import { Search } from "lucide-react";
import CheckInButton from "@/components/admin/CheckInButton";
import QrScanner from "@/components/admin/QrScanner";
import { getStats, listAttendees } from "@/lib/db";
import { EVENT } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

/**
 * Door screen.
 *
 * Three ways in, in order of speed:
 *   1. The built-in scanner: reads a ticket, switches the camera off and
 *      shows the result. This is the one for a queue.
 *   2. The phone's own camera app, which opens the ticket page; signed in as
 *      the team, that page shows its own check-in button.
 *   3. Searching by name, for when the QR will not read at all — a cracked
 *      screen, a dead battery, a printed ticket that got wet.
 */
export default async function DoorPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const [stats, matches] = await Promise.all([
    getStats(),
    q.trim() ? listAttendees(q) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Puerta</h1>
          <p className="mt-1 text-sm text-mist">Control de ingreso</p>
        </div>
        <p className="text-right">
          <span className="font-mono text-3xl font-bold text-parchment tabular-nums">
            {stats.checkedIn}
          </span>
          <span className="font-mono text-lg text-mist tabular-nums">/{stats.registered}</span>
          <span className="block text-xs tracking-[0.18em] text-mist uppercase">dentro</span>
        </p>
      </header>

      <QrScanner />

      {/* Divider: everything below is the fallback route */}
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-edge/60" />
        <span className="text-xs tracking-[0.18em] text-mist uppercase">
          o busca por nombre
        </span>
        <span className="h-px flex-1 bg-edge/60" />
      </div>

      <section className="space-y-4">
        <form className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-[1.15em] -translate-y-1/2 text-mist"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre, apellido o código"
            className="w-full rounded-full border border-edge bg-night/70 py-3.5 pr-4 pl-11 text-parchment placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
          />
        </form>

        {q.trim() && matches.length === 0 && (
          <p className="card p-6 text-center text-sm text-mist">
            No encontramos a nadie con &ldquo;{q}&rdquo;. Revisa la ortografía, o registra a
            la persona desde la página pública si todavía quedan cupos.
          </p>
        )}

        <ul className="space-y-3">
          {matches.map((person) => (
            <li
              key={person.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <p className="font-display text-xl text-parchment">
                  {person.firstNames} {person.lastNames}
                </p>
                <p className="mt-1 text-sm text-mist">
                  {person.grade} &ldquo;{person.section}&rdquo; · asiento{" "}
                  {String(person.seatNumber).padStart(2, "0")} ·{" "}
                  <span className="font-mono">{person.code}</span>
                </p>
                {person.checkedInAt && (
                  <p className="mt-1 text-sm text-abyss">
                    Ya ingresó a las{" "}
                    {new Date(person.checkedInAt).toLocaleTimeString("es-EC", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: EVENT.timeZone,
                    })}
                  </p>
                )}
              </div>

              <CheckInButton token={person.token} checkedIn={Boolean(person.checkedInAt)} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs leading-relaxed text-mist/70">
        ¿La cámara no coopera? También puedes escanear con la cámara normal del celular: abre
        el ticket con su propio botón de ingreso.
      </p>
    </div>
  );
}
