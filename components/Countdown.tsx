"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/site";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function timeLeft(): Remaining | null {
  // 07:00 on the event day, taken as the start of the session
  const target = new Date(`${EVENT.dateISO}T07:00:00`).getTime();
  const left = target - Date.now();
  if (left <= 0) return null;

  return {
    days: Math.floor(left / 86_400_000),
    hours: Math.floor((left / 3_600_000) % 24),
    minutes: Math.floor((left / 60_000) % 60),
    seconds: Math.floor((left / 1000) % 60),
  };
}

/**
 * Countdown to the event.
 *
 * Computed in the browser only (never on the server) so the time is the
 * visitor's own and the pre-rendered HTML can't ship a stale value.
 */
export default function Countdown() {
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRemaining(timeLeft());
    const id = setInterval(() => setRemaining(timeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  // Reserve the space before mounting so nothing jumps on screen.
  if (!mounted) return <div className="h-[86px]" aria-hidden />;

  if (!remaining) {
    return (
      <p className="font-display text-xl text-gold">
        ¡Hoy es el día! Te esperamos en el {EVENT.venue.toLowerCase()}.
      </p>
    );
  }

  const boxes = [
    { value: remaining.days, label: "días" },
    { value: remaining.hours, label: "horas" },
    { value: remaining.minutes, label: "min" },
    { value: remaining.seconds, label: "seg" },
  ];

  return (
    <div className="flex gap-3" role="timer" aria-label="Tiempo restante para el evento">
      {boxes.map((box) => (
        <div key={box.label} className="card flex min-w-17 flex-col items-center px-3 py-2">
          <span className="font-mono text-2xl font-bold text-parchment tabular-nums">
            {String(box.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] tracking-[0.2em] text-mist uppercase">{box.label}</span>
        </div>
      ))}
    </div>
  );
}
