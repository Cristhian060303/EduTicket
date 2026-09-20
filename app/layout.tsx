import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { EVENT } from "@/lib/site";
import "./globals.css";

/* Editorial serif with character: headlines should smell like a book. */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--display-font",
  display: "swap",
});

/* Humanist sans, very legible on small screens. */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--body-font",
  display: "swap",
});

/* Monospace for ticket codes: digits that can't be mistaken for each other. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mono-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${EVENT.project} · ${EVENT.name}`,
    template: `%s · ${EVENT.project}`,
  },
  description: `Consigue tu ticket digital para la ${EVENT.name} del ${EVENT.dateLong}. Aforo limitado a ${EVENT.capacity} personas.`,
  applicationName: EVENT.project,
};

export const viewport: Viewport = {
  themeColor: "#060a16",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
