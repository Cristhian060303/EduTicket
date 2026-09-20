"use server";

import { revalidatePath } from "next/cache";
import { requestLoan } from "@/lib/db";

/**
 * A student asks to borrow a book from their own ticket.
 *
 * Holding the ticket's token is the authorisation: it is unguessable and it
 * is the same thing that lets them see the ticket at all. Nothing here can
 * reach another attendee's data, since the token picks the attendee.
 */
export async function requestLoanAction(token: string, bookSlug: string): Promise<boolean> {
  if (!/^[0-9a-f]{16}$/.test(token)) return false;

  const ok = await requestLoan(token, bookSlug);
  if (ok) {
    revalidatePath(`/t/${token}`);
    revalidatePath("/admin/loans");
  }
  return ok;
}
