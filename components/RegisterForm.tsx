"use client";

import { Loader2, Ticket } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAttendee, type FormState } from "@/app/register/actions";
import { EVENT } from "@/lib/site";

const INITIAL: FormState = { status: "idle" };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gold px-7 py-4 font-semibold text-midnight transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-[1.25em] animate-spin" />
          <span className="leading-none">Reservando tu cupo…</span>
        </>
      ) : (
        <>
          <Ticket aria-hidden className="size-[1.25em]" strokeWidth={1.8} />
          <span className="leading-none">Obtener mi ticket</span>
        </>
      )}
    </button>
  );
}

function Field({
  label,
  name,
  error,
  defaultValue,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  defaultValue?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-parchment">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-(--radius-soft) border bg-night/70 px-4 py-3 text-parchment
          placeholder:text-mist/50 focus:outline-none ${
            error ? "border-magenta" : "border-edge focus:border-gold/60"
          }`}
        {...rest}
      />
      {error && <span className="mt-1.5 block text-sm text-magenta">{error}</span>}
    </label>
  );
}

/**
 * Registration form.
 *
 * Validation lives in the server action, not here: the browser can be
 * bypassed, the server cannot. This component only renders what comes back.
 * On success the action redirects straight to the ticket page.
 */
export default function RegisterForm({ seatsFree }: { seatsFree: number }) {
  const [state, formAction] = useActionState(registerAttendee, INITIAL);
  const soldOut = seatsFree <= 0;

  if (state.status === "waitlisted") {
    return (
      <div className="card p-8 text-center">
        <h3 className="font-display text-2xl">Quedaste en la lista de espera</h3>
        <p className="mt-3 text-mist">
          Los {EVENT.capacity} cupos ya están tomados, pero anotamos tus datos. Si alguien
          cancela o se abre un segundo turno, el equipo te avisa en tu curso.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-5 p-6 sm:p-8" noValidate>
      {soldOut && (
        <p className="rounded-(--radius-soft) border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-parchment">
          Los {EVENT.capacity} cupos están tomados. Puedes dejar tus datos y quedas en la
          lista de espera.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombres"
          name="firstNames"
          placeholder="Ana María"
          autoComplete="given-name"
          maxLength={60}
          required
          error={state.errors?.firstNames}
          defaultValue={state.values?.firstNames}
        />
        <Field
          label="Apellidos"
          name="lastNames"
          placeholder="Pérez Chávez"
          autoComplete="family-name"
          maxLength={60}
          required
          error={state.errors?.lastNames}
          defaultValue={state.values?.lastNames}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-parchment">Curso</span>
          <select
            name="grade"
            required
            defaultValue={state.values?.grade ?? ""}
            aria-invalid={Boolean(state.errors?.grade)}
            className={`w-full rounded-(--radius-soft) border bg-night/70 px-4 py-3 text-parchment focus:outline-none ${
              state.errors?.grade ? "border-magenta" : "border-edge focus:border-gold/60"
            }`}
          >
            <option value="" disabled>
              Elige tu curso
            </option>
            {EVENT.grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          {state.errors?.grade && (
            <span className="mt-1.5 block text-sm text-magenta">{state.errors.grade}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-parchment">Paralelo</span>
          <select
            name="section"
            required
            defaultValue={state.values?.section ?? ""}
            aria-invalid={Boolean(state.errors?.section)}
            className={`w-full rounded-(--radius-soft) border bg-night/70 px-4 py-3 text-parchment focus:outline-none ${
              state.errors?.section ? "border-magenta" : "border-edge focus:border-gold/60"
            }`}
          >
            <option value="" disabled>
              Elige tu paralelo
            </option>
            {EVENT.sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
          {state.errors?.section && (
            <span className="mt-1.5 block text-sm text-magenta">{state.errors.section}</span>
          )}
        </label>
      </div>

      {state.status === "error" && (
        <p className="rounded-(--radius-soft) border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-parchment">
          {state.message}
        </p>
      )}

      <SubmitButton disabled={false} />

      <p className="text-center text-xs leading-relaxed text-mist/80">
        Usamos tus datos únicamente para el control de aforo y el préstamo de libros de esta
        actividad. Se borran después del evento.
      </p>
    </form>
  );
}
