"use client";

import { BookMarked, Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { requestLoanAction } from "@/app/t/actions";
import type { Book } from "@/lib/site";

/**
 * "I'd like to borrow this one", from the student's own ticket.
 *
 * A student may request one book, two, or all three: the database keys a loan
 * by (attendee, book), so each title can be asked for once and asking twice
 * is ignored rather than duplicated.
 *
 * There is usually a single physical copy of each title, so requests beyond
 * that are not blocked — books come back, and a queue is how the team knows
 * who is next — but the real numbers are shown, so nobody walks away
 * expecting a book that is already spoken for.
 */

export type Availability = Record<string, { copies: number; claimed: number }>;

export default function LoanRequest({
  token,
  books,
  alreadyRequested,
  availability,
}: {
  token: string;
  books: Book[];
  alreadyRequested: string[];
  availability: Availability;
}) {
  const [requested, setRequested] = useState<string[]>(alreadyRequested);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const ask = (slug: string) => {
    setBusy(slug);
    startTransition(async () => {
      const ok = await requestLoanAction(token, slug);
      if (ok) setRequested((current) => [...current, slug]);
      setBusy(null);
    });
  };

  return (
    <section className="no-print mt-10">
      <h2 className="font-display text-2xl">¿Te llevas un libro?</h2>
      <p className="mt-2 text-sm text-mist">
        Al terminar las presentaciones puedes pedir prestados los que te hayan atrapado —
        uno, dos o los tres. Solicítalos aquí y retíralos con el equipo.
      </p>

      <ul className="mt-5 space-y-3">
        {books.map((book) => {
          const done = requested.includes(book.slug);
          const stock = availability[book.slug] ?? { copies: 1, claimed: 0 };
          const free = stock.copies - stock.claimed;

          return (
            <li
              key={book.slug}
              className="card flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-parchment">{book.title}</p>
                <p className="text-sm text-mist">{book.author}</p>

                {!done &&
                  (free > 0 ? (
                    <p className="mt-1 text-xs text-abyss">
                      Disponible · {free} {free === 1 ? "ejemplar" : "ejemplares"}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gold">
                      Ya lo pidieron {stock.claimed}{" "}
                      {stock.claimed === 1 ? "persona" : "personas"}. Puedes anotarte y
                      esperar a que lo devuelvan.
                    </p>
                  ))}
              </div>

              {done ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-abyss/40 bg-abyss/10 px-4 py-2 text-sm font-semibold text-abyss">
                  <Check aria-hidden className="size-[1.15em]" />
                  <span className="leading-none">Solicitado</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => ask(book.slug)}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-midnight disabled:opacity-50"
                >
                  {busy === book.slug ? (
                    <Loader2 aria-hidden className="size-[1.15em] animate-spin" />
                  ) : (
                    <BookMarked aria-hidden className="size-[1.15em]" />
                  )}
                  <span className="leading-none">
                    {free > 0 ? "Pedir prestado" : "Anotarme en la fila"}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
