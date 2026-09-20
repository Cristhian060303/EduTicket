import { Play, Ticket } from "lucide-react";
import Link from "next/link";
import Aurora from "@/components/Aurora";
import BookCard from "@/components/BookCard";
import Countdown from "@/components/Countdown";
import Header from "@/components/Header";
import Reveal from "@/components/Reveal";
import SeatMeter from "@/components/SeatMeter";
import TrailerEmbed from "@/components/TrailerEmbed";
import { getBooks, getSession } from "@/lib/db";
import { EVENT } from "@/lib/site";

const STEPS = [
  {
    n: "01",
    title: "Regístrate",
    text: "Tus nombres, apellidos y curso. Nada más: ni contraseñas ni correos.",
  },
  {
    n: "02",
    title: "Recibe tu ticket",
    text: `Un código único con QR. Solo hay ${EVENT.capacity}, así que no lo dejes para después.`,
  },
  {
    n: "03",
    title: "Entra y llévate un libro",
    text: "Muestras el QR en la puerta y al final puedes pedir prestado el libro que te atrapó.",
  },
];

// Seats run out as people register, so the landing page is always fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [books, session] = await Promise.all([getBooks(), getSession()]);
  const seatsFree = session?.seatsFree ?? EVENT.capacity;
  const capacity = session?.capacity ?? EVENT.capacity;

  // The event's own trailer, falling back to the first one a book has.
  const featuredTrailer = EVENT.trailer ?? books.find((book) => book.trailer)?.trailer ?? null;

  return (
    <>
      <Aurora />

      <Header />

      <main id="top">
        {/* ================= Hero ================= */}
        <section className="hero-exit mx-auto max-w-6xl px-5 pt-28 pb-24 sm:pt-36">
          <Reveal className="inline-flex items-center gap-2 rounded-full border border-edge bg-night/60 px-4 py-1.5 text-xs tracking-wide text-mist">
            <span className="size-2 rounded-full bg-abyss animate-heartbeat" />
            {EVENT.dateLong} · {EVENT.venue}
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
              La <span className="gilded">Zona Literaria</span> abre sus puertas
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
              Tres obras, tres mundos montados dentro del {EVENT.venue.toLowerCase()}. El
              aforo es de <strong className="text-parchment">{capacity} personas</strong>{" "}
              entre {EVENT.grades.join(", ")}, y se entra con ticket digital.
            </p>
          </Reveal>

          <Reveal delay={320} className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gold px-7 py-3.5 font-semibold text-midnight shadow-[0_18px_45px_-18px_var(--color-gold)] transition-transform duration-300 hover:scale-[1.04]"
            >
              <Ticket aria-hidden className="relative z-10 size-[1.25em] shrink-0" strokeWidth={1.8} />
              <span className="relative z-10 leading-none">Obtener mi ticket</span>
              <span
                aria-hidden
                className="sheen absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </Link>
            <a
              href="#trailer"
              className="inline-flex items-center gap-2.5 rounded-full border border-edge px-7 py-3.5 font-semibold text-parchment transition-colors hover:border-parchment/50 hover:bg-night/60"
            >
              <Play aria-hidden className="size-[1.1em] shrink-0 fill-current" strokeWidth={0} />
              <span className="leading-none">Ver el book trailer</span>
            </a>
          </Reveal>

          <Reveal delay={400} className="mt-10 max-w-md">
            <SeatMeter seatsFree={seatsFree} capacity={capacity} />
          </Reveal>

          <Reveal delay={480} className="mt-12">
            <p className="mb-3 text-xs tracking-[0.2em] text-mist uppercase">
              Faltan para la jornada
            </p>
            <Countdown />
          </Reveal>
        </section>

        {/* ================= How it works ================= */}
        <section className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
          <Reveal as="h2" className="font-display text-3xl sm:text-4xl">
            Cómo conseguir tu lugar
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 140}>
                <div className="card group h-full p-6 transition-colors duration-300 hover:border-gold/40">
                  <span className="font-mono text-sm text-gold">{step.n}</span>
                  <h3 className="mt-3 font-display text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= Books ================= */}
        <section id="books" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
          <Reveal>
            <p className="text-xs tracking-[0.2em] text-abyss uppercase">El catálogo</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Las obras de esta edición</h2>
            <p className="mt-3 max-w-xl text-mist">
              Cada espacio está ambientado según su libro y lo presenta un expositor del
              equipo. Al terminar la jornada puedes solicitar el préstamo.
            </p>
          </Reveal>

          {/* items-stretch + h-full on every Reveal keeps the three cards equal in height */}
          <div className="mt-12 grid items-stretch gap-7 md:grid-cols-3">
            {books.map((book, i) => (
              <Reveal key={book.slug} delay={i * 150} className="h-full">
                <BookCard book={book} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= Book trailer ================= */}
        <section id="trailer" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-20">
          <Reveal>
            <p className="text-xs tracking-[0.2em] text-magenta uppercase">Book trailer</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Un vistazo a lo que te espera</h2>
          </Reveal>

          <Reveal delay={150} className="mt-8">
            <TrailerEmbed url={featuredTrailer} title={EVENT.name} poster={EVENT.trailerPoster} />
          </Reveal>
        </section>

        {/* ================= Registration ================= */}
        <section id="register" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-20">
          <Reveal>
            <div className="card relative overflow-hidden p-8 text-center sm:p-12">
              <div
                aria-hidden
                className="absolute -top-24 left-1/2 size-48 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
              />
              <h2 className="font-display text-3xl sm:text-4xl">
                Reserva tu <span className="gilded">cupo</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-mist">
                {seatsFree > 0
                  ? `Quedan ${seatsFree} de ${capacity} tickets. Cuando se acaben, se acabaron.`
                  : "Los cupos están agotados, pero puedes anotarte en la lista de espera."}
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3.5 font-semibold text-midnight transition-transform duration-300 hover:scale-[1.04]"
              >
                <Ticket aria-hidden className="size-[1.25em]" strokeWidth={1.8} />
                <span className="leading-none">
                  {seatsFree > 0 ? "Obtener mi ticket" : "Anotarme en la lista"}
                </span>
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ================= Footer ================= */}
      <footer className="border-t border-edge/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-display text-parchment">{EVENT.project}</span> · Proyecto
            interdisciplinario
          </p>
          <p>
            {EVENT.name} · {EVENT.dateShort} · {EVENT.venue}
          </p>
        </div>
      </footer>
    </>
  );
}
