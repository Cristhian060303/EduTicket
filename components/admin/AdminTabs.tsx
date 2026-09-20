"use client";

import { BookMarked, DoorOpen, LayoutDashboard, Library, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/door", label: "Puerta", icon: DoorOpen },
  { href: "/admin/attendees", label: "Asistentes", icon: Users },
  { href: "/admin/loans", label: "Préstamos", icon: BookMarked },
  { href: "/admin/books", label: "Libros", icon: Library },
];

/**
 * Panel navigation.
 *
 * A client component only so it can highlight the current tab — on a phone,
 * at the door, knowing where you are matters more than it does on a desktop.
 * The row scrolls sideways rather than wrapping, so the bar stays one line
 * tall at every width.
 */
export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <ul className="flex min-w-max items-center gap-1">
      {TABS.map((tab) => {
        // /admin only matches exactly; the rest match their subpages too.
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);

        return (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors ${
                active
                  ? "bg-gold/15 font-semibold text-gold"
                  : "text-mist hover:bg-night/70 hover:text-parchment"
              }`}
            >
              <tab.icon aria-hidden className="size-[1.15em] shrink-0" />
              <span className="leading-none">{tab.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
