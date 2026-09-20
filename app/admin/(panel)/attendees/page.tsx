import { Download, Search } from "lucide-react";
import Link from "next/link";
import CheckInButton from "@/components/admin/CheckInButton";
import { listAttendees } from "@/lib/db";
import { EVENT } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AttendeesPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const attendees = await listAttendees(q);
  const checkedIn = attendees.filter((a) => a.checkedInAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Asistentes</h1>
          <p className="mt-1 text-sm text-mist">
            {attendees.length} {attendees.length === 1 ? "registro" : "registros"}
            {q ? " encontrados" : ` · ${checkedIn} ya ingresaron`}
          </p>
        </div>

        <a
          href="/admin/attendees/export"
          className="inline-flex items-center gap-2 rounded-full border border-edge px-4 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-gold/50 hover:text-gold"
        >
          <Download aria-hidden className="size-[1.15em]" />
          <span className="leading-none">Descargar lista (CSV)</span>
        </a>
      </div>

      {/* A plain GET form: the search survives a reload and can be shared */}
      <form className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-[1.15em] -translate-y-1/2 text-mist"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, apellido o código…"
          className="w-full rounded-full border border-edge bg-night/70 py-3 pr-4 pl-11 text-parchment placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
        />
      </form>

      {attendees.length === 0 ? (
        <p className="card p-8 text-center text-mist">
          {q ? "Nadie coincide con esa búsqueda." : "Todavía no hay registros."}
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-edge/60 text-left text-xs tracking-[0.15em] text-mist uppercase">
                <th className="px-5 py-3 font-medium">Asiento</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Curso</th>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Ingreso</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((person) => (
                <tr key={person.id} className="border-b border-edge/30 last:border-0">
                  <td className="px-5 py-3 font-mono text-mist tabular-nums">
                    {String(person.seatNumber).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 text-parchment">
                    {person.lastNames}, {person.firstNames}
                  </td>
                  <td className="px-5 py-3 text-mist">
                    {person.grade} &ldquo;{person.section}&rdquo;
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/t/${person.token}`}
                      className="font-mono text-gold underline-offset-4 hover:underline"
                    >
                      {person.code}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {person.checkedInAt ? (
                      <span className="text-abyss">
                        {new Date(person.checkedInAt).toLocaleTimeString("es-EC", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: EVENT.timeZone,
                        })}
                      </span>
                    ) : (
                      <span className="text-mist/60">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CheckInButton
                      token={person.token}
                      checkedIn={Boolean(person.checkedInAt)}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-mist/70">
        Esta lista contiene datos de estudiantes. No la compartas fuera del equipo
        organizador, y bórrala de la base después del evento con{" "}
        <code className="text-mist">db/99_reset_attendees.sql</code>.
      </p>
    </div>
  );
}
