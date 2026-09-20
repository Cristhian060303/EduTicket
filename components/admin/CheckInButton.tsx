"use client";

import { Check, Loader2, RotateCcw, UserCheck } from "lucide-react";
import { useTransition } from "react";
import { checkInAction, undoCheckInAction } from "@/app/admin/actions";

/**
 * Marks an arrival at the door, or undoes one.
 *
 * `useTransition` keeps the button responsive while the server acts, which
 * matters when thirty people are queuing and the school wifi is slow: without
 * it, an organiser cannot tell whether their tap registered and taps again.
 */
export default function CheckInButton({
  token,
  checkedIn,
  compact = false,
}: {
  token: string;
  checkedIn: boolean;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      if (checkedIn) await undoCheckInAction(token);
      else await checkInAction(token);
    });
  };

  if (checkedIn) {
    return (
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-full border border-abyss/40 bg-abyss/10 font-semibold text-abyss transition-colors hover:border-magenta/50 hover:text-magenta disabled:opacity-60 ${
          compact ? "px-3 py-1.5 text-xs" : "px-5 py-3 text-sm"
        }`}
        title="Deshacer el ingreso"
      >
        {pending ? (
          <Loader2 aria-hidden className="size-[1.15em] animate-spin" />
        ) : (
          <Check aria-hidden className="size-[1.15em]" />
        )}
        <span className="leading-none">Ingresó</span>
        {!compact && <RotateCcw aria-hidden className="size-[1.05em] opacity-60" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-full bg-gold font-semibold text-midnight transition-transform hover:scale-[1.03] disabled:opacity-60 ${
        compact ? "px-3 py-1.5 text-xs" : "px-6 py-3 text-sm"
      }`}
    >
      {pending ? (
        <Loader2 aria-hidden className="size-[1.15em] animate-spin" />
      ) : (
        <UserCheck aria-hidden className="size-[1.15em]" />
      )}
      <span className="leading-none">Registrar ingreso</span>
    </button>
  );
}
