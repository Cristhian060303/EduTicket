/**
 * EduTicket brand mark: a ticket with an open book inside.
 *
 * Drawn as a vector so it stays sharp at any size and weighs about 1 KB. It
 * paints with `currentColor`, so the parent decides the colour and the mark
 * works on both the gold badge and a dark background.
 *
 * The idea comes from the team's reference logo; the graduation cap and
 * calendar were dropped because at 36px — the size it actually renders in the
 * header — three stacked symbols turn into a smudge.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Ticket outline, with a notch cut into each side */}
      <path d="M8 6h16a2 2 0 0 1 2 2v2.2a2.6 2.6 0 0 0 0 5.2V24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8.6a2.6 2.6 0 0 0 0-5.2V8a2 2 0 0 1 2-2Z" />
      {/* Open book: two pages and the spine */}
      <path d="M16 13.2c-1.5-1.1-3.2-1.6-5-1.6v8c1.8 0 3.5.5 5 1.6" />
      <path d="M16 13.2c1.5-1.1 3.2-1.6 5-1.6v8c-1.8 0-3.5.5-5 1.6" />
      <path d="M16 13.2v8" />
    </svg>
  );
}
