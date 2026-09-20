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

/* ==========================================================================
   Team panel
   ========================================================================== */

export type AttendeeRow = {
  id: string;
  code: string;
  token: string;
  firstNames: string;
  lastNames: string;
  grade: Grade;
  section: string;
  seatNumber: number;
  createdAt: string;
  checkedInAt: string | null;
};

export type Stats = {
  registered: number;
  checkedIn: number;
  seatsFree: number;
  capacity: number;
  waitlist: number;
  loansOut: number;
};

/** Headline numbers for the dashboard. */
export async function getStats(): Promise<Stats> {
  const empty: Stats = {
    registered: 0,
    checkedIn: 0,
    seatsFree: 0,
    capacity: 0,
    waitlist: 0,
    loansOut: 0,
  };
  if (!hasSupabase()) return empty;

  const db = supabaseAdmin();
  const head = { count: "exact" as const, head: true };

  const [session, registered, checkedIn, waitlist, loansOut] = await Promise.all([
    getSession(),
    db.from("attendees").select("*", head),
    db.from("attendees").select("*", head).not("checked_in_at", "is", null),
    db.from("waitlist").select("*", head),
    db.from("loans").select("*", head).eq("status", "delivered"),
  ]);

  return {
    registered: registered.count ?? 0,
    checkedIn: checkedIn.count ?? 0,
    waitlist: waitlist.count ?? 0,
    loansOut: loansOut.count ?? 0,
    seatsFree: session?.seatsFree ?? 0,
    capacity: session?.capacity ?? 0,
  };
}

/**
 * The attendee list, optionally filtered.
 *
 * The search covers names and ticket code at once, because at the door people
 * are found by whatever the organiser manages to read or hear.
 */
export async function listAttendees(search = ""): Promise<AttendeeRow[]> {
  if (!hasSupabase()) return [];

  const db = supabaseAdmin();
  let query = db
    .from("attendees")
    .select("id, ticket_code, token, first_names, last_names, grade, section, created_at, checked_in_at, seats(number)")
    .order("created_at");

  const term = search.trim();
  if (term) {
    const safe = term.replace(/[%,]/g, " ");
    query = query.or(
      `first_names.ilike.%${safe}%,last_names.ilike.%${safe}%,ticket_code.ilike.%${safe}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const seat = row.seats as unknown as { number: number } | null;
    return {
      id: row.id,
      code: row.ticket_code,
      token: row.token,
      firstNames: row.first_names,
      lastNames: row.last_names,
      grade: row.grade as Grade,
      section: row.section,
      seatNumber: seat?.number ?? 0,
      createdAt: row.created_at,
      checkedInAt: row.checked_in_at,
    };
  });
}

export type CheckInResult =
  | { status: "ok"; name: string; alreadyIn: boolean; since: string | null }
  | { status: "not-found" }
  | { status: "error" };

/**
 * Records an arrival at the door.
 *
 * When the ticket was already used it does NOT overwrite the timestamp and
 * says so instead — that is the signal the organiser needs to stop and look,
 * because two people showing the same QR means one of them should not pass.
 */
export async function checkIn(token: string): Promise<CheckInResult> {
  if (!hasSupabase()) return { status: "error" };

  const db = supabaseAdmin();
  const { data: found, error: lookupError } = await db
    .from("attendees")
    .select("id, first_names, last_names, checked_in_at")
    .eq("token", token)
    .maybeSingle();

  if (lookupError) return { status: "error" };
  if (!found) return { status: "not-found" };

  const name = `${found.first_names} ${found.last_names}`;
  if (found.checked_in_at) {
    return { status: "ok", name, alreadyIn: true, since: found.checked_in_at };
  }

  const { error } = await db
    .from("attendees")
    .update({ checked_in_at: new Date().toISOString() })
    .eq("id", found.id);

  if (error) return { status: "error" };
  return { status: "ok", name, alreadyIn: false, since: null };
}

/** Undo a check-in, for the inevitable mis-tap. */
export async function undoCheckIn(token: string): Promise<boolean> {
  if (!hasSupabase()) return false;
  const { error } = await supabaseAdmin()
    .from("attendees")
    .update({ checked_in_at: null })
    .eq("token", token);
  return !error;
}

export type LoanStatus = "requested" | "delivered" | "returned";

export type LoanRow = {
  id: string;
  status: LoanStatus;
  requestedAt: string;
  attendee: { firstNames: string; lastNames: string; grade: Grade; section: string };
  book: { title: string; slug: string };
};

export async function listLoans(): Promise<LoanRow[]> {
  if (!hasSupabase()) return [];

  const { data, error } = await supabaseAdmin()
    .from("loans")
    .select("id, status, requested_at, attendees(first_names, last_names, grade, section), books(title, slug)")
    .order("requested_at");  // first come, first served at the delivery table

  if (error || !data) return [];

  return data.map((row) => {
    const attendee = row.attendees as unknown as {
      first_names: string;
      last_names: string;
      grade: Grade;
      section: string;
    } | null;
    const book = row.books as unknown as { title: string; slug: string } | null;

    return {
      id: row.id,
      status: row.status as LoanStatus,
      requestedAt: row.requested_at,
      attendee: {
        firstNames: attendee?.first_names ?? "",
        lastNames: attendee?.last_names ?? "",
        grade: (attendee?.grade ?? "8vo") as Grade,
        section: attendee?.section ?? "",
      },
      book: { title: book?.title ?? "", slug: book?.slug ?? "" },
    };
  });
}

/** Loans already requested by one attendee, to render their ticket page. */
export async function getLoansForTicket(token: string): Promise<LoanRow[]> {
  if (!hasSupabase()) return [];

  const db = supabaseAdmin();
  const { data: attendee } = await db
    .from("attendees")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (!attendee) return [];

  const { data } = await db
    .from("loans")
    .select("id, status, requested_at, books(title, slug)")
    .eq("attendee_id", attendee.id);

  return (data ?? []).map((row) => {
    const book = row.books as unknown as { title: string; slug: string } | null;
    return {
      id: row.id,
      status: row.status as LoanStatus,
      requestedAt: row.requested_at,
      attendee: { firstNames: "", lastNames: "", grade: "8vo" as Grade, section: "" },
      book: { title: book?.title ?? "", slug: book?.slug ?? "" },
    };
  });
}

/** An attendee asks to borrow a book, from their own ticket page. */
export async function requestLoan(token: string, bookSlug: string): Promise<boolean> {
  if (!hasSupabase()) return false;

  const db = supabaseAdmin();
  const [{ data: attendee }, { data: book }] = await Promise.all([
    db.from("attendees").select("id").eq("token", token).maybeSingle(),
    db.from("books").select("id").eq("slug", bookSlug).maybeSingle(),
  ]);

  if (!attendee || !book) return false;

  // The unique (attendee, book) pair means asking twice is a no-op.
  const { error } = await db
    .from("loans")
    .upsert(
      { attendee_id: attendee.id, book_id: book.id },
      { onConflict: "attendee_id,book_id", ignoreDuplicates: true },
    );

  return !error;
}

export async function setLoanStatus(id: string, status: LoanStatus): Promise<boolean> {
  if (!hasSupabase()) return false;

  const stamps: Record<LoanStatus, Record<string, string | null>> = {
    requested: { delivered_at: null, returned_at: null },
    delivered: { delivered_at: new Date().toISOString(), returned_at: null },
    returned: { returned_at: new Date().toISOString() },
  };

  const { error } = await supabaseAdmin()
    .from("loans")
    .update({ status, ...stamps[status] })
    .eq("id", id);

  return !error;
}

/** Fields of a book the team can edit from the panel. */
export async function updateBook(
  slug: string,
  fields: { presenter?: string | null; trailerUrl?: string | null; copies?: number },
): Promise<boolean> {
  if (!hasSupabase()) return false;

  const patch: Record<string, unknown> = {};
  if (fields.presenter !== undefined) patch.presenter = fields.presenter || null;
  if (fields.trailerUrl !== undefined) patch.trailer_url = fields.trailerUrl || null;
  if (fields.copies !== undefined) patch.copies = fields.copies;

  const { error } = await supabaseAdmin().from("books").update(patch).eq("slug", slug);
  return !error;
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

/**
 * How many copies each book has and how many are already spoken for.
 *
 * There is normally a single physical copy of each title, and nothing stops
 * thirty students from requesting the same one. Rather than blocking them —
 * a queue is useful, because books do come back — the request screen shows
 * the real numbers so nobody expects a book that is already taken.
 */
export async function getBookAvailability(): Promise<
  Record<string, { copies: number; claimed: number }>
> {
  if (!hasSupabase()) return {};

  const db = supabaseAdmin();
  const [{ data: books }, { data: loans }] = await Promise.all([
    db.from("books").select("id, slug, copies"),
    db.from("loans").select("book_id").neq("status", "returned"),
  ]);

  if (!books) return {};

  const claimedByBook = new Map<string, number>();
  for (const loan of loans ?? []) {
    claimedByBook.set(loan.book_id, (claimedByBook.get(loan.book_id) ?? 0) + 1);
  }

  return Object.fromEntries(
    books.map((book) => [
      book.slug,
      { copies: book.copies ?? 1, claimed: claimedByBook.get(book.id) ?? 0 },
    ]),
  );
}
