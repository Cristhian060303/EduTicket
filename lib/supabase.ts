import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * **Server-only** Supabase client.
 *
 * It uses the service role key, which bypasses the database security
 * policies. That is why this file must never be imported from a "use client"
 * component: the key would end up in the browser.
 *
 * Every decision that matters (claiming a seat, checking someone in,
 * approving a loan) goes through here, from a Server Action or Route Handler.
 */

let client: SupabaseClient | null = null;

/**
 * The project URL, whichever name it arrives under.
 *
 * `NEXT_PUBLIC_SUPABASE_URL` is the one we set by hand; `SUPABASE_URL` is
 * injected by the Vercel↔Supabase integration. Accepting both means the app
 * runs whether or not that integration is installed.
 */
function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

/**
 * The full-access key. `SUPABASE_SERVICE_ROLE_KEY` is the classic name and
 * `SUPABASE_SECRET_KEY` (sb_secret_...) the newer one the integration adds.
 * Both bypass row level security, so neither may ever reach the browser.
 */
function supabaseKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = supabaseUrl();
  const key = supabaseKey();

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Copia .env.example como .env.local y completa los valores (ver README.md).",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

/** Are the Supabase variables configured yet? Lets the site keep working
 *  while the database does not exist yet (phase 1). */
export function hasSupabase(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}
