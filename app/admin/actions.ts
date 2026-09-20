"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { checkIn, setLoanStatus, undoCheckIn, updateBook, type LoanStatus } from "@/lib/db";

/**
 * Actions the team panel performs.
 *
 * Every one re-checks `isAdmin()`. A server action is a public HTTP endpoint:
 * being rendered inside a protected page does not protect the action itself,
 * so the check cannot live only in the layout.
 */

export async function checkInAction(token: string) {
  if (!(await isAdmin())) return { status: "error" as const };

  const result = await checkIn(token);
  revalidatePath("/admin");
  revalidatePath("/admin/door");
  revalidatePath("/admin/attendees");
  revalidatePath(`/t/${token}`);
  return result;
}

export async function undoCheckInAction(token: string) {
  if (!(await isAdmin())) return false;

  const ok = await undoCheckIn(token);
  revalidatePath("/admin");
  revalidatePath("/admin/door");
  revalidatePath("/admin/attendees");
  revalidatePath(`/t/${token}`);
  return ok;
}

export async function setLoanStatusAction(id: string, status: LoanStatus) {
  if (!(await isAdmin())) return false;

  const ok = await setLoanStatus(id, status);
  revalidatePath("/admin/loans");
  revalidatePath("/admin");
  return ok;
}

/** Bound to a <form action>, so it returns nothing: React requires void. */
export async function updateBookAction(slug: string, formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  const copies = Number(formData.get("copies"));
  await updateBook(slug, {
    presenter: String(formData.get("presenter") ?? "").trim(),
    trailerUrl: String(formData.get("trailerUrl") ?? "").trim(),
    copies: Number.isFinite(copies) && copies >= 0 ? copies : undefined,
  });

  revalidatePath("/admin/books");
  revalidatePath("/");
  revalidatePath(`/books/${slug}`);
}
