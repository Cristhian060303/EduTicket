"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "#top", label: "Inicio" },
  { href: "#books", label: "Los libros" },
  { href: "#trailer", label: "Book trailer" },
];

/**
 * A link to a section of the landing page.
 *
 * Within the landing page it has to be a plain <a>: Next's <Link> resolves a
 * hash-only href against the current URL and appends to it, so jumping from
 * "/#books" to "#trailer" produced "/#books#trailer". The browser's own
 * resolution replaces the hash, which is what a same-page jump needs — and
 * there is no route change to hand to the router anyway.
 *
 * From any other page it is a real navigation, and there <Link> belongs.
 */
function SectionLink({
  hash,
  label,
  atHome,
  className,
}: {
  hash: string;
  label: string;
  atHome: boolean;
  className: string;
}) {
  if (atHome) {
    return (
      <a href={hash} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={`/${hash}`} className={className}>
      {label}
    </Link>
  );
}

/** The logo: back to the top of the landing page, or back to it from elsewhere. */
function LogoLink({ atHome, children }: { atHome: boolean; children: React.ReactNode }) {
  const className = "flex items-center gap-2.5";

  if (atHome) {
    return (
      <a href="#top" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href="/" className={className}>
      {children}
    </Link>
  );
}

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
  const pathname = usePathname();

  /**
   * The bar lives on every public page, but its links point at sections of
   * the landing page. From a book page or a ticket those anchors do not
   * exist, so they have to become links back home plus the anchor — which is
   * also why the logo could not simply be "#top".
   */
  const atHome = pathname === "/";

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
        <LogoLink atHome={atHome}>
          <span className="grid size-9 place-items-center rounded-lg bg-gold text-midnight">
            <Logo className="size-6" />
          </span>
          <span className="font-display text-lg tracking-tight">
            Edu<span className="text-gold">Ticket</span>
          </span>
        </LogoLink>

        {/* Inline on a laptop; on a phone these move to their own row below,
            where the bar would otherwise not fit them beside the button. */}
        <ul className="hidden items-center gap-8 text-sm text-mist md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <SectionLink
                hash={link.href}
                label={link.label}
                atHome={atHome}
                className="transition-colors hover:text-parchment"
              />
            </li>
          ))}
        </ul>

        {/* Call to action */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-gold transition-colors hover:bg-gold hover:text-midnight"
        >
          {/* Sized in `em`: the icon scales with the label and its height
              matches the cap height, so it doesn't float next to the text. */}
          <Ticket aria-hidden className="size-[1.25em] shrink-0" strokeWidth={1.8} />
          {/* A plain space, not &nbsp;: this font renders U+00A0 with zero
              width, which is what glued "Obtenerticket" together. The label
              is kept on one line by whitespace-nowrap above. */}
          <span className="leading-none">Obtener ticket</span>
        </Link>
      </nav>

      {/* Phone row: the same links, scrollable sideways so the bar stays one
          line tall no matter how narrow the screen is. */}
      <nav className="overflow-x-auto px-5 pb-2 md:hidden">
        <ul className="flex min-w-max items-center gap-5 text-sm text-mist">
          {LINKS.map((link) => (
            <li key={link.href}>
              <SectionLink
                hash={link.href}
                label={link.label}
                atHome={atHome}
                className="transition-colors hover:text-parchment"
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Scroll progress: shows how much of the page is left, and it is pure
          CSS — the browser drives it from the scroll position itself. */}
      <div
        aria-hidden
        className="progress-bar h-0.5 w-full bg-linear-to-r from-gold via-magenta to-abyss"
      />
    </header>
  );
}
