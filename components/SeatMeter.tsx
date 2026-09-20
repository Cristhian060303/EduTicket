import { Users } from "lucide-react";

/**
 * How many seats are still free, straight from the database.
 *
 * Honest scarcity: a real number counting down does more to get people to
 * register early than any "hurry up" copy, and on the day it tells the team
 * at a glance how the room is filling.
 */
export default function SeatMeter({
  seatsFree,
  capacity,
}: {
  seatsFree: number;
  capacity: number;
}) {
  const taken = Math.max(0, capacity - seatsFree);
  const percent = capacity > 0 ? Math.min(100, (taken / capacity) * 100) : 0;
  const soldOut = seatsFree <= 0;
  const almostGone = !soldOut && seatsFree <= Math.ceil(capacity * 0.2);

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-mist">
          <Users aria-hidden className="size-[1.15em]" />
          Cupos disponibles
        </span>
        <span
          className={`font-mono text-2xl font-bold tabular-nums ${
            soldOut ? "text-magenta" : almostGone ? "text-gold" : "text-parchment"
          }`}
        >
          {seatsFree}
          <span className="text-sm font-normal text-mist"> / {capacity}</span>
        </span>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-night"
        role="progressbar"
        aria-valuenow={taken}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`${taken} de ${capacity} cupos tomados`}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-gold to-magenta transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {soldOut && (
        <p className="mt-3 text-sm text-magenta">
          Aforo completo. Queda la lista de espera.
        </p>
      )}
      {almostGone && (
        <p className="mt-3 text-sm text-gold">
          Quedan pocos: {seatsFree} {seatsFree === 1 ? "cupo" : "cupos"}.
        </p>
      )}
    </div>
  );
}
