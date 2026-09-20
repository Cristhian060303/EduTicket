import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Access control for the team's panel.
 *
 * A shared PIN rather than user accounts: this is one afternoon with six
 * organisers, and administering accounts for minors would create more
 * personal data than it protects. The PIN lives only in ADMIN_PIN.
 *
 * The cookie never carries the PIN. It carries an HMAC of a fixed string
 * keyed by the PIN, so it can be verified but not reversed, and it cannot be
 * forged by anyone who does not know the PIN. Changing ADMIN_PIN invalidates
 * every session at once, which is the fastest way to lock everyone out if a
 * phone is lost on the day.
 */

const COOKIE = "eduticket_admin";
const SESSION_HOURS = 12;

function configuredPin(): string | null {
  return process.env.ADMIN_PIN?.trim() || null;
}

function fingerprint(pin: string): string {
  return createHmac("sha256", pin).update("eduticket-admin-v1").digest("hex");
}

/** Constant-time comparison, so the PIN can't be guessed by timing. */
function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function signIn(pin: string): Promise<boolean> {
  const expected = configuredPin();
  if (!expected || !sameSecret(pin.trim(), expected)) return false;

  const jar = await cookies();
  jar.set(COOKIE, fingerprint(expected), {
    httpOnly: true, // unreadable from JavaScript
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });

  return true;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const expected = configuredPin();
  if (!expected) return false;

  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(value && sameSecret(value, fingerprint(expected)));
}

/** Guard for every page under /admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** True when nobody configured a PIN, so the panel can say so out loud. */
export function pinMissing(): boolean {
  return configuredPin() === null;
}
