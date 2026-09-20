import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import CheckInButton from "@/components/admin/CheckInButton";
import Aurora from "@/components/Aurora";
import Header from "@/components/Header";
import LoanRequest from "@/components/LoanRequest";
import TicketActions from "@/components/TicketActions";
import TicketStub from "@/components/TicketStub";
import { isAdmin } from "@/lib/auth";
import { getBookAvailability, getBooks, getLoansForTicket, getTicket } from "@/lib/db";

type Params = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Tu ticket",
  // A ticket carries somebody's name: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Absolute URL of this ticket, which is what the QR encodes.
 *
 * `NEXT_PUBLIC_SITE_URL` wins when it is set, so a ticket generated from a
 * preview deployment still points at the real site. When it is missing — or
 * set to an empty string, which is what broke the first QR codes — the domain
 * is read from the request itself, so the link is always absolute.
 */
async function ticketUrl(token: string): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return `${configured.replace(/\/$/, "")}/t/${token}`;

  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol =
    incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}/t/${token}`;
}

export default async function TicketPage({ params }: Params) {
  const { token } = await params;
  const ticket = await getTicket(token);

  if (!ticket) notFound();

  const [url, team, books, loans, availability] = await Promise.all([
    ticketUrl(ticket.token),
    isAdmin(),
    getBooks(),
    getLoansForTicket(ticket.token),
    getBookAvailability(),
  ]);

  // Generated on the server so the QR is already in the HTML: it shows up
  // even if the phone loses signal right after opening the page.
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#060a16", light: "#ffffff" },
  });

  return (
    <>
      <Aurora />
      <div className="no-print">
        <Header />
      </div>

      <main className="mx-auto max-w-2xl px-5 pt-28 pb-24 sm:pt-36 print:pt-0">
        <div className="no-print mb-8 text-center">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Tu ticket</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            ¡Listo, tienes tu <span className="gilded">cupo</span>!
          </h1>
          <p className="mt-4 text-mist">
            Guarda esta página o imprímela. En la puerta te escanean el QR.
          </p>
        </div>

        <TicketStub ticket={ticket} qrDataUrl={qrDataUrl} />

        <TicketActions url={url} />

        {/* Only the team sees this: scanning the QR with a phone that is
            signed in to the panel turns the ticket into the door screen. */}
        {team && (
          <div className="no-print mt-8 card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs tracking-[0.18em] text-gold uppercase">Equipo</p>
              <p className="mt-1 text-sm text-mist">
                {ticket.checkedInAt
                  ? "Este ticket ya fue usado para ingresar. Si quien lo muestra no es la persona del ticket, no debería pasar."
                  : "Registra el ingreso de esta persona."}
              </p>
            </div>
            <CheckInButton token={ticket.token} checkedIn={Boolean(ticket.checkedInAt)} />
          </div>
        )}

        <LoanRequest
          token={ticket.token}
          books={books}
          alreadyRequested={loans.map((loan) => loan.book.slug)}
          availability={availability}
        />

        <p className="no-print mt-8 text-center text-xs break-all text-mist/70">{url}</p>
      </main>
    </>
  );
}
