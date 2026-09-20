"use client";

import { BookMarked, Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { requestLoanAction } from "@/app/t/actions";
import type { Book } from "@/lib/site";

/**
 * "I'd like to borrow this one", from the student's own ticket.
 *
 * Asking twice is harmless: the database keys a loan by (attendee, book), so
 * a second request is ignored rather than duplicated.
 */
export default function LoanRequest({
  token,
  books,
  alreadyRequested,
}: {
  token: string;
  books: Book[];
  alreadyRequested: string[];
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
        Al terminar las presentaciones puedes pedir prestado el que te haya atrapado. Solicítalo
        aquí y retíralo con el equipo.
      </p>

      <ul className="mt-5 space-y-3">
        {books.map((book) => {
          const done = requested.includes(book.slug);

          return (
            <li
              key={book.slug}
              className="card flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-parchment">{book.title}</p>
                <p className="text-sm text-mist">{book.author}</p>
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
                  <span className="leading-none">Pedir prestado</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
