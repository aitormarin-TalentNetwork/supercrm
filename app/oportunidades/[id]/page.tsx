"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Stub mínimo — el Detalle de oportunidad real es AIT-13 (Fase 2, aún no
// construido). Esto solo confirma que Alta rápida (AIT-10) creó la
// oportunidad y su primer próximo paso.
export default function OportunidadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const summary = useQuery(api.opportunities.getSummary, {
    opportunityId: id as Id<"opportunities">,
  });

  if (summary === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  if (summary === null) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">
          Oportunidad no encontrada o sin acceso.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 font-sans">
      <h1 className="text-h1 font-bold text-text">Oportunidad creada</h1>
      <p className="text-text-secondary">
        Cliente: <strong>{summary.customerName}</strong>
      </p>
      {summary.interest && (
        <p className="text-text-secondary">Interés: {summary.interest}</p>
      )}
      {summary.estimatedAmount !== null && (
        <p className="text-text-secondary">
          Importe estimado: {summary.estimatedAmount} €
        </p>
      )}
      {summary.nextStepAction && (
        <p className="text-text-secondary">
          Próximo paso: <strong>{summary.nextStepAction}</strong>
        </p>
      )}
      <Link
        href={`/clientes/${summary.customerId}`}
        className="text-sm font-semibold text-primary hover:underline"
      >
        Ver ficha del cliente
      </Link>
      <p className="text-sm text-text-muted">
        Pantalla real pendiente (Fase 2 — AIT-13).
      </p>
    </main>
  );
}
