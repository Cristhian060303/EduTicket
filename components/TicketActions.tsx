"use client";

import { Check, Link2, Printer } from "lucide-react";
import { useState } from "react";

/**
 * Buttons under the ticket: print it, or copy its link.
 *
 * Copying the link matters more than it looks — it is how a student keeps the
 * ticket after closing the tab, since there are no accounts to log back into.
 */
export default function TicketActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (insecure context, denied permission): the link is
      // shown in full underneath, so it can still be copied by hand.
      setCopied(false);
    }
  };

  return (
    <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full border border-edge px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/50 hover:bg-night/60"
      >
        <Printer aria-hidden className="size-[1.15em]" />
        <span className="leading-none">Imprimir</span>
      </button>

      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-edge px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:border-parchment/50 hover:bg-night/60"
      >
        {copied ? (
          <>
            <Check aria-hidden className="size-[1.15em] text-abyss" />
            <span className="leading-none">¡Copiado!</span>
          </>
        ) : (
          <>
            <Link2 aria-hidden className="size-[1.15em]" />
            <span className="leading-none">Copiar enlace</span>
          </>
        )}
      </button>
    </div>
  );
}
