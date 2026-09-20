import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Aurora from "@/components/Aurora";
import Header from "@/components/Header";
import TicketActions from "@/components/TicketActions";
import TicketStub from "@/components/TicketStub";
import { getTicket } from "@/lib/db";

type Params = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Tu ticket",
  // A ticket carries somebody's name: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Absolute URL of this ticket, which is what the QR encodes. */
function ticketUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/t/${token}`;
}

export default async function TicketPage({ params }: Params) {
  const { token } = await params;
  const ticket = await getTicket(token);

  if (!ticket) notFound();

  const url = ticketUrl(ticket.token);

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

        <p className="no-print mt-6 text-center text-xs break-all text-mist/70">{url}</p>
      </main>
    </>
  );
}
