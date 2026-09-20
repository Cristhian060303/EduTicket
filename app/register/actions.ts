"use server";

import { redirect } from "next/navigation";
import { claimSeat, getSession, joinWaitlist, type Grade } from "@/lib/db";
import { EVENT } from "@/lib/site";

/**
 * Registration server action.
 *
 * It runs on the server, so the browser can never skip the validation or
 * hand itself a seat. The form talks to it through `useActionState`.
 */

export type FormState = {
  status: "idle" | "invalid" | "full" | "waitlisted" | "error";
  errors?: Partial<Record<"firstNames" | "lastNames" | "grade" | "section", string>>;
  message?: string;
  /** What the person typed, so a rejected form comes back filled in */
  values?: Record<string, string>;
};

const GRADES = EVENT.grades as readonly string[];
const SECTIONS = EVENT.sections as readonly string[];

/** Collapses double spaces and trims: "  Ana   María " → "Ana María". */
function tidy(value: FormDataEntryValue | null): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Letters, spaces, apostrophes and hyphens — enough for any Spanish name. */
const NAME_PATTERN = /^[\p{L}][\p{L}\s'´`-]*$/u;

export async function registerAttendee(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const firstNames = tidy(formData.get("firstNames"));
  const lastNames = tidy(formData.get("lastNames"));
  const grade = tidy(formData.get("grade"));
  const section = tidy(formData.get("section")).toUpperCase();
  const values = { firstNames, lastNames, grade, section };

  const errors: FormState["errors"] = {};
  if (firstNames.length < 2) errors.firstNames = "Escribe tus nombres.";
  else if (firstNames.length > 60) errors.firstNames = "Demasiado largo.";
  else if (!NAME_PATTERN.test(firstNames)) errors.firstNames = "Solo letras, sin números.";

  if (lastNames.length < 2) errors.lastNames = "Escribe tus apellidos.";
  else if (lastNames.length > 60) errors.lastNames = "Demasiado largo.";
  else if (!NAME_PATTERN.test(lastNames)) errors.lastNames = "Solo letras, sin números.";

  if (!GRADES.includes(grade)) errors.grade = "Elige tu curso.";
  if (!SECTIONS.includes(section)) errors.section = "Elige tu paralelo.";

  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors, values };
  }

  const session = await getSession();
  if (!session) {
    return {
      status: "error",
      message: "No pudimos conectarnos. Intenta de nuevo en un momento.",
      values,
    };
  }

  const claim = await claimSeat({
    sessionId: session.id,
    firstNames,
    lastNames,
    grade: grade as Grade,
    section,
  });

  if (claim.status === "error") {
    return { status: "error", message: "Algo falló al reservar tu cupo.", values };
  }

  if (claim.status === "full") {
    const added = await joinWaitlist({
      sessionId: session.id,
      firstNames,
      lastNames,
      grade: grade as Grade,
      section,
    });
    return { status: added ? "waitlisted" : "full", values };
  }

  // redirect() throws internally, so it has to be the last thing here and
  // stay outside any try/catch.
  redirect(`/t/${claim.token}`);
}
