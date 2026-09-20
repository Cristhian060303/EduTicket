import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Logo from "@/components/Logo";
import type { Ticket } from "@/lib/db";
import { EVENT } from "@/lib/site";

/**
 * The digital ticket.
 *
 * Designed to be read off a phone at the door in a badly lit room: the QR
 * first, then the seat number, then the name. It also has to survive being
 * printed in black and white — see the print rules in globals.css — because
 * the school's wifi is the weakest link on the day.
 */
export default function TicketStub({
  ticket,
  qrDataUrl,
}: {
  ticket: Ticket;
  qrDataUrl: string;
}) {
  const startsAt = ticket.session.startsAt
    ? new Date(ticket.session.startsAt)
    : new Date(`${EVENT.dateISO}T07:00:00`);

  const time = startsAt.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="card overflow-hidden print:border print:border-black print:bg-white">
      {/* Stub header */}
      <header className="flex items-center justify-between gap-3 border-b border-dashed border-edge/70 px-6 py-4 print:border-black">
        <span className="flex items-center gap-2">
          <Logo className="size-6 text-gold print:text-black" />
          <span className="font-display text-lg print:text-black">
            Edu<span className="text-gold print:text-black">Ticket</span>
          </span>
        </span>
        <span className="font-mono text-xs tracking-widest text-mist uppercase print:text-black">
          {EVENT.name}
        </span>
      </header>

      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        {/* QR: white plate so any camera reads it, on screen and on paper */}
        <div className="mx-auto rounded-(--radius-soft) bg-white p-3">
          <Image
            src={qrDataUrl}
            alt={`Código QR del ticket ${ticket.code}`}
            width={180}
            height={180}
            unoptimized
            className="size-[180px]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs tracking-[0.2em] text-mist uppercase print:text-black">
            A nombre de
          </p>
          <p className="mt-1 font-display text-2xl leading-tight break-words text-parchment print:text-black">
            {ticket.firstNames} {ticket.lastNames}
          </p>
          <p className="mt-1 text-mist print:text-black">
            {ticket.grade} &ldquo;{ticket.section}&rdquo;
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs tracking-[0.18em] text-mist uppercase print:text-black">
                Código
              </dt>
              <dd className="mt-1 font-mono text-lg font-bold text-gold print:text-black">
                {ticket.code}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.18em] text-mist uppercase print:text-black">
                Asiento
              </dt>
              <dd className="mt-1 font-mono text-lg font-bold text-parchment print:text-black">
                {String(ticket.seatNumber).padStart(2, "0")}{" "}
                <span className="text-sm font-normal text-mist print:text-black">
                  de {EVENT.capacity}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Perforation: two notches and a dashed line, like a real ticket */}
      <div className="relative border-t border-dashed border-edge/70 print:border-black">
        <span
          aria-hidden
          className="absolute -top-3 -left-3 size-6 rounded-full bg-midnight print:hidden"
        />
        <span
          aria-hidden
          className="absolute -top-3 -right-3 size-6 rounded-full bg-midnight print:hidden"
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-sm text-mist print:text-black">
          <span className="inline-flex items-center gap-2">
            <CalendarDays aria-hidden className="size-[1.15em] shrink-0" />
            {EVENT.dateLong} · {time}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden className="size-[1.15em] shrink-0" />
            {EVENT.venue}
          </span>
        </div>
      </div>

      {ticket.checkedInAt && (
        <p className="border-t border-edge/70 bg-abyss/15 px-6 py-3 text-sm text-abyss print:hidden">
          Ingreso registrado. ¡Disfruta la jornada!
        </p>
      )}

      <p className="hidden px-6 pb-4 text-xs text-black print:block">
        Presenta este ticket en la puerta. Si el QR no se puede escanear, el código{" "}
        {ticket.code} se busca por nombre en la lista.
      </p>
    </article>
  );
}
