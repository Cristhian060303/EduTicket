import { ArrowLeft, BookOpen, Ticket } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Aurora from "@/components/Aurora";
import Header from "@/components/Header";
import Reveal from "@/components/Reveal";
import TrailerEmbed from "@/components/TrailerEmbed";
import { getBook, getBooks } from "@/lib/db";
import { ACCENTS } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const books = await getBooks();
  return books.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return { title: "Libro no encontrado" };

  return {
    title: book.title,
    description: book.synopsis.slice(0, 160),
  };
}

export default async function BookPage({ params }: Params) {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) notFound();

  const accent = ACCENTS[book.accent];

  return (
    <>
      <Aurora />
      <Header />

      <main className="mx-auto max-w-5xl px-5 pt-28 pb-24 sm:pt-36">
        <Link
          href="/#books"
          className="inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-parchment"
        >
          <ArrowLeft aria-hidden className="size-[1.15em]" />
          <span className="leading-none">Volver al catálogo</span>
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,320px)_1fr]">
          {/* Cover */}
          <Reveal>
            <div className="relative aspect-[2/3] overflow-hidden rounded-(--radius-card) bg-ink shadow-2xl shadow-black/50">
              {book.cover ? (
                <Image
                  src={book.cover}
                  alt={`Portada de ${book.title}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 320px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen aria-hidden className={`size-16 ${accent.text} opacity-60`} />
                </div>
              )}
            </div>
          </Reveal>

          {/* Details */}
          <div>
            <Reveal delay={100}>
              <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${accent.text}`}>
                {book.author}
              </p>
              <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                {book.title}
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-6 text-lg leading-relaxed text-mist">{book.synopsis}</p>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-8 card inline-flex items-center gap-3 px-5 py-3 text-sm">
                <BookOpen aria-hidden className={`size-5 ${accent.text}`} />
                <span className="text-mist">
                  {book.presenter ? (
                    <>
                      Presenta: <strong className="text-parchment">{book.presenter}</strong>
                    </>
                  ) : (
                    "Expositor por confirmar"
                  )}
                </span>
              </div>
            </Reveal>

            <Reveal delay={340}>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3.5 font-semibold text-midnight transition-transform duration-300 hover:scale-[1.04]"
              >
                <Ticket aria-hidden className="size-[1.25em]" strokeWidth={1.8} />
                <span className="leading-none">Obtener mi ticket</span>
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Trailer */}
        <Reveal delay={200} className="mt-16 block">
          <h2 className="font-display text-2xl sm:text-3xl">Book trailer</h2>
          <div className="mt-5">
            <TrailerEmbed url={book.trailer} title={book.title} />
          </div>
        </Reveal>
      </main>
    </>
  );
}
