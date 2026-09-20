import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminTabs from "@/components/admin/AdminTabs";
import Aurora from "@/components/Aurora";
import Logo from "@/components/Logo";
import { isAdmin, signOut } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel del equipo",
  // The panel lists attendees: keep it out of every search engine.
  robots: { index: false, follow: false },
};

/**
 * Shell for every page of the panel.
 *
 * The guard lives here rather than in middleware so each page is protected by
 * the same check that reads the cookie, with no second place to keep in sync.
 *
 * The pages sit in the `(panel)` route group — which does not appear in the
 * URL — precisely so that `/admin/login` stays outside this layout. With the
 * login page inside it, the guard redirected the login page to itself and the
 * browser bounced forever.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  async function leave() {
    "use server";
    await signOut();
    redirect("/admin/login");
  }

  return (
    <>
      <Aurora />

      {/* Sticky: at the door the organiser scrolls a long list and still needs
          to reach the tabs without scrolling back up. */}
      <header className="sticky top-0 z-50 border-b border-edge/60 bg-midnight/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gold text-midnight">
              <Logo className="size-5" />
            </span>
            <span className="font-display text-base">
              Edu<span className="text-gold">Ticket</span>
              <span className="ml-2 text-xs tracking-[0.18em] text-mist uppercase">
                Equipo
              </span>
            </span>
          </Link>

          <form action={leave}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-edge px-4 py-2 text-sm text-mist transition-colors hover:border-parchment/40 hover:text-parchment"
            >
              <LogOut aria-hidden className="size-[1.15em]" />
              <span className="leading-none">Salir</span>
            </button>
          </form>
        </div>

        {/* Tabs scroll sideways on a phone instead of wrapping into two rows */}
        <nav className="mx-auto max-w-6xl overflow-x-auto px-5 pb-2">
          <AdminTabs />
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </>
  );
}
