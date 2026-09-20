import { NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Setup diagnostics: GET /api/health
 *
 * Confirms in one request that the environment variables are in place, that
 * the database answers and that the seed data is loaded. Useful locally and,
 * above all, on Vercel — where a missing variable is otherwise invisible
 * until someone tries to register.
 *
 * It only returns counts, never personal data, so it is safe to open in a
 * browser. It is also the URL the weekly cron ping can hit to keep the free
 * Supabase project from being paused.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabase()) {
    return NextResponse.json(
      {
        ok: false,
        problem: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        hint: "Locally: copy .env.example to .env.local. On Vercel: Project Settings → Environment Variables.",
      },
      { status: 503 },
    );
  }

  try {
    const db = supabaseAdmin();
    const count = async (table: string, onlyFreeSeats = false) => {
      const query = db.from(table).select("*", { count: "exact", head: true });
      const { count: total, error } = onlyFreeSeats
        ? await query.eq("taken", false)
        : await query;
      if (error) throw new Error(`${table}: ${error.message}`);
      return total ?? 0;
    };

    const [sessions, seats, seatsFree, books] = await Promise.all([
      count("sessions"),
      count("seats"),
      count("seats", true),
      count("books"),
    ]);

    // The seed is only complete with one session, 30 seats and 3 books.
    const seeded = sessions >= 1 && seats === 30 && books === 3;

    return NextResponse.json({
      ok: true,
      database: "connected",
      seeded,
      sessions,
      seats,
      seatsFree,
      books,
      ...(seeded ? {} : { hint: "Run db/02_seed.sql in the Supabase SQL Editor." }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        problem: "The database did not answer",
        detail: error instanceof Error ? error.message : String(error),
        hint: "Check the Supabase URL and service role key, and that db/01_schema.sql ran.",
      },
      { status: 500 },
    );
  }
}
