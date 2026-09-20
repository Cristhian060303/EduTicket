import { BookMarked, DoorOpen, TicketCheck, Users } from "lucide-react";
import Link from "next/link";
import { getStats } from "@/lib/db";
import { EVENT } from "@/lib/site";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  hint,
  tone = "parchment",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "parchment" | "gold" | "abyss" | "magenta";
}) {
  const tones = {
    parchment: "text-parchment",
    gold: "text-gold",
    abyss: "text-abyss",
    magenta: "text-magenta",
  };

  return (
    <div className="card p-5">
      <p className="text-xs tracking-[0.18em] text-mist uppercase">{label}</p>
      <p className={`mt-2 font-mono text-4xl font-bold tabular-nums ${tones[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export default async function AdminHome() {
  const stats = await getStats();
  const pending = stats.registered - stats.checkedIn;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Resumen</h1>
        <p className="mt-1 text-sm text-mist">
          {EVENT.name} · {EVENT.dateLong}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Registrados"
          value={stats.registered}
          hint={`de ${stats.capacity || EVENT.capacity} cupos`}
        />
        <Stat label="Ya ingresaron" value={stats.checkedIn} tone="abyss" hint={`faltan ${pending}`} />
        <Stat label="Cupos libres" value={stats.seatsFree} tone="gold" />
        <Stat
          label="Libros prestados"
          value={stats.loansOut}
          tone="magenta"
          hint={stats.waitlist > 0 ? `${stats.waitlist} en lista de espera` : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/door"
          className="card group flex items-center gap-4 p-5 transition-colors hover:border-gold/50"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <DoorOpen aria-hidden className="size-6" />
          </span>
          <span>
            <span className="block font-display text-lg">Puerta</span>
            <span className="block text-sm text-mist">Marcar ingresos</span>
          </span>
        </Link>

        <Link
          href="/admin/attendees"
          className="card group flex items-center gap-4 p-5 transition-colors hover:border-abyss/50"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-abyss/15 text-abyss">
            <Users aria-hidden className="size-6" />
          </span>
          <span>
            <span className="block font-display text-lg">Asistentes</span>
            <span className="block text-sm text-mist">Buscar y exportar</span>
          </span>
        </Link>

        <Link
          href="/admin/loans"
          className="card group flex items-center gap-4 p-5 transition-colors hover:border-magenta/50"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-magenta/15 text-magenta">
            <BookMarked aria-hidden className="size-6" />
          </span>
          <span>
            <span className="block font-display text-lg">Préstamos</span>
            <span className="block text-sm text-mist">Entregas y devoluciones</span>
          </span>
        </Link>
      </div>

      <div className="card flex items-start gap-4 p-5">
        <TicketCheck aria-hidden className="size-5 shrink-0 text-gold" />
        <div className="text-sm leading-relaxed text-mist">
          <p className="font-medium text-parchment">Cómo marcar ingresos el día del evento</p>
          <p className="mt-1">
            Escanea el QR del estudiante con la cámara normal del celular. Se abre su ticket
            y, como tienes sesión de equipo en ese teléfono, verás el botón para registrar el
            ingreso. Si el QR no se deja leer, búscalo por nombre en{" "}
            <Link href="/admin/door" className="text-gold underline underline-offset-4">
              Puerta
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
