import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ACCENTS, type Book } from "@/lib/site";

/**
 * Book card used on the landing page.
 *
 * All three cards end up exactly the same height even when the synopses have
 * different lengths: the `h-full` + `flex-col` chain stretches them to the row
 * height, and `mt-auto` pushes the presenter line to the bottom so the card
 * footers line up.
 *
 * The "book lifting off" effect is pure CSS — perspective on the wrapper plus
 * a subtle rotation on hover and a light sweep across the cover. No
 * JavaScript, so it behaves the same on low-end phones.
 */
export default function BookCard({ book }: { book: Book }) {
  const accent = ACCENTS[book.accent];

  return (
    <article className="group h-full perspective-[1400px]">
      <Link
        href={`/books/${book.slug}`}
        className={`card flex h-full flex-col p-5 transition-all duration-500 ease-out
          group-hover:-translate-y-2 ${accent.border} ${accent.glow}`}
      >
        {/* --- Cover --- */}
        <div
          className="relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-(--radius-soft)
            bg-ink shadow-xl shadow-black/40 transition-transform duration-500 ease-out
            transform-3d group-hover:transform-[rotateX(6deg)_rotateY(-6deg)_scale(1.03)]"
        >
          {book.cover ? (
            /* Blurred copy behind, whole cover in front: book jackets come in
               every proportion, and cropping them to a fixed ratio eats the
               title. This way nothing is cut and the cards stay uniform. */
            <>
              <Image
                src={book.cover}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 768px) 90vw, 30vw"
                className="scale-110 object-cover opacity-40 blur-xl"
              />
              <Image
                src={book.cover}
                alt={`Portada de ${book.title}`}
                fill
                sizes="(max-width: 768px) 90vw, 30vw"
                className="cover-drift object-contain"
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <BookOpen
                aria-hidden
                className={`size-10 ${accent.text} opacity-70`}
                strokeWidth={1.3}
              />
              <p className="font-display text-lg text-parchment/80">{book.title}</p>
              <p className="text-[11px] tracking-[0.18em] text-mist uppercase">
                Portada en camino
              </p>
            </div>
          )}

          {/* Light sweep on hover */}
          <div
            aria-hidden
            className="sheen pointer-events-none absolute inset-0 opacity-0
              transition-opacity duration-300 group-hover:opacity-100"
          />
          {/* Book spine: the dark edge down the left side */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-3
              bg-linear-to-r from-black/50 to-transparent"
          />
        </div>

        {/* --- Details --- */}
        <div className="mt-5 flex flex-1 flex-col">
          <p className={`text-xs font-semibold tracking-[0.18em] uppercase ${accent.text}`}>
            {book.author}
          </p>
          <h3 className="mt-2 font-display text-xl leading-snug text-parchment">
            {book.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-mist">{book.synopsis}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <span className="text-xs text-mist/70">
              {book.presenter ? (
                <>
                  Presenta: <span className="text-parchment/90">{book.presenter}</span>
                </>
              ) : (
                "Expositor por confirmar"
              )}
            </span>
            <span
              aria-hidden
              className={`inline-flex items-center gap-1 text-xs font-semibold ${accent.text}
                transition-transform duration-300 group-hover:translate-x-1`}
            >
              Ver ficha
              <ArrowRight className="size-[1.1em]" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
