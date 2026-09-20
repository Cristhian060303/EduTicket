import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Aurora from "@/components/Aurora";
import Logo from "@/components/Logo";
import { isAdmin, pinMissing, signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel del equipo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await isAdmin()) redirect("/admin");

  const { error } = await searchParams;
  const noPin = pinMissing();

  async function enter(formData: FormData) {
    "use server";
    const ok = await signIn(String(formData.get("pin") ?? ""));
    redirect(ok ? "/admin" : "/admin/login?error=1");
  }

  return (
    <>
      <Aurora />
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 py-16">
        <div className="w-full">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-gold text-midnight">
              <Logo className="size-8" />
            </span>
            <h1 className="font-display text-3xl">Panel del equipo</h1>
            <p className="text-sm text-mist">
              Solo para quienes organizan la Zona Literaria.
            </p>
          </div>

          {noPin ? (
            <p className="card border-magenta/40 p-5 text-sm text-parchment">
              No hay PIN configurado. Define la variable <code>ADMIN_PIN</code> en el
              entorno y vuelve a desplegar.
            </p>
          ) : (
            <form action={enter} className="card space-y-4 p-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-parchment">
                  PIN de acceso
                </span>
                <input
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="w-full rounded-(--radius-soft) border border-edge bg-night/70 px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-parchment focus:border-gold/60 focus:outline-none"
                />
              </label>

              {error && (
                <p className="rounded-(--radius-soft) border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-parchment">
                  PIN incorrecto.
                </p>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-7 py-3.5 font-semibold text-midnight transition-transform duration-300 hover:scale-[1.02]"
              >
                <KeyRound aria-hidden className="size-[1.25em]" strokeWidth={1.8} />
                <span className="leading-none">Entrar</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
