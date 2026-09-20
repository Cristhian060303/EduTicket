import type { Metadata } from "next";
import Aurora from "@/components/Aurora";
import Header from "@/components/Header";
import RegisterForm from "@/components/RegisterForm";
import { getSession } from "@/lib/db";
import { EVENT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Obtén tu ticket",
  description: `Regístrate para la ${EVENT.name} del ${EVENT.dateLong}.`,
};

// Seat availability changes as people register, so this page is never cached.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getSession();
  const seatsFree = session?.seatsFree ?? 0;
  const taken = (session?.capacity ?? EVENT.capacity) - seatsFree;

  return (
    <>
      <Aurora />
      <Header />

      <main className="mx-auto max-w-2xl px-5 pt-28 pb-24 sm:pt-36">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">Registro</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          Reserva tu <span className="gilded">cupo</span>
        </h1>
        <p className="mt-4 text-mist">
          {EVENT.dateLong} · {EVENT.venue}. Con tus datos generamos un ticket con código QR
          que debes mostrar en la puerta.
        </p>

        {/* Live seat counter: the honest reason to hurry */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-night">
            <div
              className="h-full rounded-full bg-linear-to-r from-gold to-magenta transition-[width] duration-700"
              style={{ width: `${Math.min(100, (taken / EVENT.capacity) * 100)}%` }}
            />
          </div>
          <span className="font-mono text-sm whitespace-nowrap text-parchment tabular-nums">
            {seatsFree} / {session?.capacity ?? EVENT.capacity} libres
          </span>
        </div>

        <div className="mt-8">
          <RegisterForm seatsFree={seatsFree} />
        </div>

        <p className="mt-6 text-center text-sm text-mist">
          ¿Ya te registraste? Vuelve a llenar el formulario con los mismos datos y te
          devolvemos tu mismo ticket.
        </p>
      </main>
    </>
  );
}
