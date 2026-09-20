import "server-only";
import { BOOKS, type Accent, type Book } from "@/lib/site";
import { hasSupabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Server-side data access.
 *
 * Every function here runs on the server and talks to Supabase with the
 * service role key. The `server-only` import makes the build fail if a client
 * component ever imports this file by mistake.
 *
 * The read functions degrade gracefully: with no database configured the site
 * still renders using the static catalogue from lib/site.ts. The write
 * functions do not — claiming a seat without a database has to be an error.
 */

export type Grade = "8vo" | "9no" | "10mo";

export type SessionInfo = {
  id: string;
  name: string;
  startsAt: string;
  capacity: number;
  seatsFree: number;
};

export type Ticket = {
  code: string;
  token: string;
  firstNames: string;
  lastNames: string;
  grade: Grade;
  section: string;
  seatNumber: number;
  checkedInAt: string | null;
  session: { name: string; startsAt: string };
};

/** The active session plus how many seats are still free. */
export async function getSession(): Promise<SessionInfo | null> {
  if (!hasSupabase()) return null;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sessions")
    .select("id, name, starts_at, capacity")
    .eq("active", true)
    .order("starts_at")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const { count } = await db
    .from("seats")
    .select("*", { count: "exact", head: true })
    .eq("session_id", data.id)
    .eq("taken", false);

  return {
    id: data.id,
    name: data.name,
    startsAt: data.starts_at,
    capacity: data.capacity,
    seatsFree: count ?? 0,
  };
}

/** The catalogue, from the database when there is one. */
export async function getBooks(): Promise<Book[]> {
  if (!hasSupabase()) return BOOKS;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("books")
    .select("slug, title, author, synopsis, cover_url, trailer_url, presenter, accent")
    .order("sort_order");

  if (error || !data?.length) return BOOKS;

  return data.map((row) => ({
    slug: row.slug,
    title: row.title,
    author: row.author ?? "",
    cover: row.cover_url,
    synopsis: row.synopsis ?? "",
    presenter: row.presenter,
    trailer: row.trailer_url,
    accent: (row.accent ?? "gold") as Accent,
  }));
}

export async function getBook(slug: string): Promise<Book | null> {
  const books = await getBooks();
  return books.find((book) => book.slug === slug) ?? null;
}

/** A ticket looked up by its random token (never by the readable code). */
export async function getTicket(token: string): Promise<Ticket | null> {
  if (!hasSupabase()) return null;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("attendees")
    .select(
      "ticket_code, token, first_names, last_names, grade, section, checked_in_at, seats(number), sessions(name, starts_at)",
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;

  // Supabase types the embedded relations loosely; normalise them here.
  const seat = data.seats as unknown as { number: number } | null;
  const session = data.sessions as unknown as { name: string; starts_at: string } | null;

  return {
    code: data.ticket_code,
    token: data.token,
    firstNames: data.first_names,
    lastNames: data.last_names,
    grade: data.grade as Grade,
    section: data.section,
    seatNumber: seat?.number ?? 0,
    checkedInAt: data.checked_in_at,
    session: {
      name: session?.name ?? "",
      startsAt: session?.starts_at ?? "",
    },
  };
}

export type ClaimResult =
  | { status: "ok"; code: string; token: string; seatNumber: number; alreadyExisted: boolean }
  | { status: "full" }
  | { status: "error"; message: string };

/**
 * Claims a seat by calling the `claim_seat` database function.
 *
 * All the hard parts happen inside Postgres in a single statement: the lock
 * that stops two people taking the same seat, and returning the existing
 * ticket when somebody registers twice. See db/01_schema.sql.
 */
export async function claimSeat(input: {
  sessionId: string;
  firstNames: string;
  lastNames: string;
  grade: Grade;
  section: string;
}): Promise<ClaimResult> {
  if (!hasSupabase()) {
    return { status: "error", message: "La base de datos no está configurada." };
  }

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("claim_seat", {
    p_session_id: input.sessionId,
    p_first_names: input.firstNames,
    p_last_names: input.lastNames,
    p_grade: input.grade,
    p_section: input.section,
  });

  if (error) return { status: "error", message: error.message };

  // Zero rows is the function's way of saying the session is full.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { status: "full" };

  return {
    status: "ok",
    code: row.ticket,
    token: row.token,
    seatNumber: row.seat_number,
    alreadyExisted: row.already_existed,
  };
}

/** Records somebody who arrived after the last seat was gone. */
export async function joinWaitlist(input: {
  sessionId: string;
  firstNames: string;
  lastNames: string;
  grade: Grade;
  section: string;
}): Promise<boolean> {
  if (!hasSupabase()) return false;

  const { error } = await supabaseAdmin().from("waitlist").insert({
    session_id: input.sessionId,
    first_names: input.firstNames,
    last_names: input.lastNames,
    grade: input.grade,
    section: input.section,
  });

  return !error;
}
