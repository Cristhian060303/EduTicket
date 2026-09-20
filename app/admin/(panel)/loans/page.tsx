import LoanRowActions from "@/components/admin/LoanRowActions";
import { listLoans } from "@/lib/db";
import { EVENT } from "@/lib/site";

export const dynamic = "force-dynamic";

const LABELS = {
  requested: { text: "Solicitado", className: "text-gold" },
  delivered: { text: "Entregado", className: "text-abyss" },
  returned: { text: "Devuelto", className: "text-mist" },
} as const;

export default async function LoansPage() {
  const loans = await listLoans();

  const pending = loans.filter((loan) => loan.status === "requested");
  const out = loans.filter((loan) => loan.status === "delivered");
  const back = loans.filter((loan) => loan.status === "returned");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Préstamos</h1>
        <p className="mt-1 text-sm text-mist">
          {pending.length} por entregar · {out.length} en manos de estudiantes ·{" "}
          {back.length} devueltos
        </p>
      </div>

      {loans.length === 0 ? (
        <p className="card p-8 text-center text-mist">
          Todavía nadie ha solicitado un libro. Las solicitudes llegan desde el ticket de
          cada estudiante, al terminar las presentaciones.
        </p>
      ) : (
        <div className="space-y-8">
          <Section title="Por entregar" loans={pending} empty="Nada pendiente de entrega." />
          <Section
            title="Fuera (sin devolver)"
            loans={out}
            empty="No hay libros prestados en este momento."
          />
          <Section title="Devueltos" loans={back} empty="Aún no hay devoluciones." />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  loans,
  empty,
}: {
  title: string;
  loans: Awaited<ReturnType<typeof listLoans>>;
  empty: string;
}) {
  return (
    <section>
      <h2 className="font-display text-xl">{title}</h2>

      {loans.length === 0 ? (
        <p className="mt-3 text-sm text-mist/70">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {loans.map((loan) => (
            <li
              key={loan.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-parchment">{loan.book.title}</p>
                <p className="mt-1 text-sm text-mist">
                  {loan.attendee.firstNames} {loan.attendee.lastNames} · {loan.attendee.grade}{" "}
                  &ldquo;{loan.attendee.section}&rdquo;
                </p>
                <p className="mt-1 text-xs text-mist/70">
                  <span className={LABELS[loan.status].className}>
                    {LABELS[loan.status].text}
                  </span>{" "}
                  ·{" "}
                  {new Date(loan.requestedAt).toLocaleString("es-EC", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: EVENT.timeZone,
                  })}
                </p>
              </div>

              <LoanRowActions id={loan.id} status={loan.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
