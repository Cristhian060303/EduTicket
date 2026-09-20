/**
 * Event configuration and book catalogue.
 *
 * In phase 1 this lives in code so the site can be deployed and reviewed.
 * In phase 2 the catalogue moves to Supabase (the `books` table) and this
 * file keeps only the event configuration.
 *
 * Note: identifiers are English, visible copy is Spanish — see the project
 * conventions in README.md.
 */

export const EVENT = {
  name: "Zona Literaria",
  project: "EduTicket",
  /** Friday, 16 October 2026 */
  dateISO: "2026-10-16",
  dateLong: "Viernes 16 de octubre de 2026",
  dateShort: "16 oct 2026",
  venue: "Salón de música",
  /**
   * Times are always formatted in this zone, never the server's.
   * Vercel runs in UTC, which turned 07:00 in Ecuador into "12:00 p.m."
   * on the first tickets.
   */
  timeZone: "America/Guayaquil",
  capacity: 30,
  /**
   * General book trailer, served by this site rather than YouTube: at 4 MB it
   * costs less than the embed's scripts, and it still plays if the school
   * network blocks YouTube.
   */
  trailer: "/trailers/storybook-general.mp4",
  trailerPoster: "/trailers/storybook-general.jpg",
  grades: ["8vo", "9no", "10mo"] as const,
  sections: ["A", "B", "C", "D"] as const,
} as const;

export type Accent = "abyss" | "gold" | "magenta";

export type Book = {
  slug: string;
  title: string;
  author: string;
  /** null until the team hands in the cover image */
  cover: string | null;
  synopsis: string;
  presenter: string | null;
  /** YouTube URL of the book trailer, once there is one */
  trailer: string | null;
  accent: Accent;
};

export const BOOKS: Book[] = [
  {
    slug: "veinte-mil-leguas",
    title: "Veinte mil leguas de viaje submarino",
    author: "Jules Verne",
    cover: "/covers/veinte-mil-leguas.jpg",
    synopsis:
      "Un profesor, su criado y un arponero acaban prisioneros del Nautilus, el submarino del enigmático capitán Nemo. Bajo la superficie los espera un mundo de bosques de coral, ciudades hundidas y criaturas que nadie ha visto jamás.",
    presenter: null,
    trailer: "/trailers/veinte-mil-leguas.mp4",
    accent: "abyss",
  },
  {
    slug: "el-hobbit",
    title: "El Hobbit",
    author: "J.R.R. Tolkien",
    cover: "/covers/el-hobbit.jpg",
    synopsis:
      "Bilbo Bolsón vivía tranquilo en su agujero hobbit hasta que un mago y trece enanos lo arrastraron a recuperar un tesoro custodiado por el dragón Smaug. Volvió siendo otro, y con un anillo en el bolsillo.",
    presenter: null,
    trailer: "/trailers/el-hobbit.mp4",
    accent: "gold",
  },
  {
    slug: "enciclopedia-dinosaurios",
    title: "Enciclopedia de los dinosaurios",
    author: "Ediciones Saldaña",
    cover: "/covers/enciclopedia-dinosaurios.jpg",
    synopsis:
      "Ciento sesenta millones de años de historia en un solo volumen: desde el Triásico hasta el asteroide que lo cambió todo, con las criaturas que dominaron el planeta mucho antes que nosotros.",
    presenter: null,
    trailer: "/trailers/enciclopedia-dinosaurios.mp4",
    accent: "magenta",
  },
];

/** Tailwind classes per accent, so components don't repeat them. */
export const ACCENTS: Record<Accent, { text: string; border: string; glow: string }> = {
  abyss: {
    text: "text-abyss",
    border: "group-hover:border-abyss/60",
    glow: "group-hover:shadow-[0_28px_70px_-28px_var(--color-abyss)]",
  },
  gold: {
    text: "text-gold",
    border: "group-hover:border-gold/60",
    glow: "group-hover:shadow-[0_28px_70px_-28px_var(--color-gold)]",
  },
  magenta: {
    text: "text-magenta",
    border: "group-hover:border-magenta/60",
    glow: "group-hover:shadow-[0_28px_70px_-28px_var(--color-magenta)]",
  },
};
