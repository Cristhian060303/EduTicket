/**
 * Ambient background: three pools of light drifting slowly, like the glow of
 * an aquarium or a reading lamp, plus a grain layer that keeps the gradients
 * from looking flat.
 *
 * Pure CSS, no JavaScript, and it holds still for anyone who asked their
 * system for reduced motion.
 */
export default function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-midnight" />

      <div className="absolute -top-40 -left-32 size-136 rounded-full bg-abyss/25 blur-[120px] animate-drift" />
      <div
        className="absolute top-1/4 -right-40 size-152 rounded-full bg-gold/20 blur-[130px] animate-drift"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute -bottom-52 left-1/3 size-128 rounded-full bg-magenta/15 blur-[120px] animate-drift"
        style={{ animationDelay: "-14s" }}
      />

      {/* Vignette: darkens the edges and pulls the eye to the centre */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--color-midnight)_100%)]" />

      <div className="absolute inset-0 grain" />
    </div>
  );
}
