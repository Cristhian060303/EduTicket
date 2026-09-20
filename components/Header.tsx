"use client";

import { Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "#books", label: "Los libros" },
  { href: "#trailer", label: "Book trailer" },
];

/**
 * Fixed top bar.
 *
 * Starts transparent over the hero and turns solid with a blur as soon as the
 * page scrolls, so content is never read "through" the header. It is 64px
 * tall; sections use `scroll-mt-24` so in-page links don't leave their
 * heading hidden underneath it.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-edge/60 bg-midnight/85 shadow-lg shadow-black/30 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gold text-midnight">
            <Logo className="size-6" />
          </span>
          <span className="font-display text-lg tracking-tight">
            Edu<span className="text-gold">Ticket</span>
          </span>
        </a>

        {/* Nav links — hidden on phones to leave room for the call to action */}
        <ul className="hidden items-center gap-8 text-sm text-mist md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-parchment">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Call to action */}
        <a
          href="#register"
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-gold transition-colors hover:bg-gold hover:text-midnight"
        >
          {/* Sized in `em`: the icon scales with the label and its height
              matches the cap height, so it doesn't float next to the text. */}
          <Ticket aria-hidden className="size-[1.25em] shrink-0" strokeWidth={1.8} />
          {/* A plain space, not &nbsp;: this font renders U+00A0 with zero
              width, which is what glued "Obtenerticket" together. The label
              is kept on one line by whitespace-nowrap above. */}
          <span className="leading-none">Obtener ticket</span>
        </a>
      </nav>
    </header>
  );
}
