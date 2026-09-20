"use client";

import { Loader2, PackageCheck, Undo2 } from "lucide-react";
import { useTransition } from "react";
import { setLoanStatusAction } from "@/app/admin/actions";
import type { LoanStatus } from "@/lib/db";

/**
 * Moves one loan along: requested → delivered → returned.
 *
 * Every step is reversible, because the mistakes here happen with a queue of
 * students waiting and a book in hand.
 */
export default function LoanRowActions({
  id,
  status,
}: {
  id: string;
  status: LoanStatus;
}) {
  const [pending, startTransition] = useTransition();

  const move = (next: LoanStatus) => {
    startTransition(async () => {
      await setLoanStatusAction(id, next);
    });
  };

  const spinner = <Loader2 aria-hidden className="size-[1.15em] animate-spin" />;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "requested" && (
        <button
          type="button"
          onClick={() => move("delivered")}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-midnight transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {pending ? spinner : <PackageCheck aria-hidden className="size-[1.15em]" />}
          <span className="leading-none">Entregar</span>
        </button>
      )}

      {status === "delivered" && (
        <>
          <button
            type="button"
            onClick={() => move("returned")}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-abyss px-5 py-2.5 text-sm font-semibold text-midnight transition-transform hover:scale-[1.03] disabled:opacity-60"
          >
            {pending ? spinner : <Undo2 aria-hidden className="size-[1.15em]" />}
            <span className="leading-none">Marcar devuelto</span>
          </button>
          <button
            type="button"
            onClick={() => move("requested")}
            disabled={pending}
            className="rounded-full border border-edge px-4 py-2.5 text-sm text-mist transition-colors hover:text-parchment disabled:opacity-60"
          >
            Deshacer
          </button>
        </>
      )}

      {status === "returned" && (
        <button
          type="button"
          onClick={() => move("delivered")}
          disabled={pending}
          className="rounded-full border border-edge px-4 py-2.5 text-sm text-mist transition-colors hover:text-parchment disabled:opacity-60"
        >
          Deshacer devolución
        </button>
      )}
    </div>
  );
}
