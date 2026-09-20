import { isAdmin } from "@/lib/auth";
import { listAttendees } from "@/lib/db";
import { EVENT } from "@/lib/site";

/**
 * The attendee list as a CSV file, for the project report and as the printed
 * backup for the day — the plan B if the school wifi fails at the door.
 *
 * It re-checks the PIN: a route handler is reachable by URL, so it cannot
 * rely on the panel's layout for protection.
 */

export const dynamic = "force-dynamic";

/** Quotes a value so Excel reads commas, quotes and accents correctly. */
function cell(value: string | number | null): string {
  const text = String(value ?? "");
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("No autorizado", { status: 401 });
  }

  const attendees = await listAttendees();

  const header = [
    "Asiento",
    "Apellidos",
    "Nombres",
    "Curso",
    "Paralelo",
    "Codigo",
    "Registrado",
    "Ingreso",
  ];

  const rows = attendees.map((person) =>
    [
      String(person.seatNumber).padStart(2, "0"),
      person.lastNames,
      person.firstNames,
      person.grade,
      person.section,
      person.code,
      new Date(person.createdAt).toLocaleString("es-EC", { timeZone: EVENT.timeZone }),
      person.checkedInAt
        ? new Date(person.checkedInAt).toLocaleString("es-EC", { timeZone: EVENT.timeZone })
        : "",
    ].map(cell),
  );

  // Semicolons and a BOM: that is what makes Excel in Spanish open the file
  // in columns and show the accents properly.
  const csv = "﻿" + [header.map(cell), ...rows].map((row) => row.join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asistentes-${EVENT.dateISO}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
