"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Bell, Plus, Check, Clock, AlertTriangle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { AltaRapidaModal } from "@/components/crm/AltaRapidaModal";
import { RegistrarInteraccionModal } from "@/components/crm/RegistrarInteraccionModal";
import { formatCurrency } from "@/lib/format";
import { BUSINESS_TIME_ZONE, getBusinessHour, startOfBusinessDay } from "@/lib/businessTime";

type NextStepItem = {
  nextStepId: Id<"nextSteps">;
  opportunityId: Id<"opportunities">;
  customerName: string;
  action: string;
  dueDate: number;
  stage: "contacto" | "presupuesto" | "negociacion";
  estimatedAmount: number | null;
  isOverdue: boolean;
  isAtRisk: boolean;
};

function formatDueDate(ms: number): string {
  const startOfDate = startOfBusinessDay(ms);
  const startOfToday = startOfBusinessDay(Date.now());
  const diffDays = Math.round((startOfToday - startOfDate) / 86_400_000);
  const time = new Date(ms).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TIME_ZONE,
  });
  if (diffDays === 0) return `Hoy ${time}`;
  if (diffDays === 1) return `Ayer ${time}`;
  if (diffDays > 1) return `Hace ${diffDays} días`;
  return new Date(ms).toLocaleDateString("es-ES", { timeZone: BUSINESS_TIME_ZONE });
}


function NextStepCard({ item }: { item: NextStepItem }) {
  const markDone = useMutation(api.nextSteps.markDone);
  const postpone = useMutation(api.nextSteps.postpone);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);

  async function handleDone() {
    if (acting) return;
    setActing(true);
    setActionError("");
    try {
      await markDone({ nextStepId: item.nextStepId });
    } catch {
      setActionError("No se ha podido marcar como hecho. Inténtalo de nuevo.");
    } finally {
      setActing(false);
    }
  }

  async function handlePostpone() {
    if (acting) return;
    setActing(true);
    setActionError("");
    try {
      await postpone({ nextStepId: item.nextStepId });
    } catch {
      setActionError("No se ha podido posponer. Inténtalo de nuevo.");
    } finally {
      setActing(false);
    }
  }

  const amount =
    item.estimatedAmount !== null ? formatCurrency(item.estimatedAmount) : null;

  return (
    <div
      className={`relative rounded-lg border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md ${
        item.isOverdue ? "border-l-[3px] border-l-error border-border" : "border-border"
      }`}
    >
      {/* Área navegable de la tarjeta ("stretched link"): cubre toda la
          tarjeta sin anidar los botones dentro del <a>, que sería HTML
          inválido y rompería su accesibilidad. El contenido de abajo NO
          lleva position/z-index propios: un <div> posicionado, aunque sea
          transparente, capta los clics de toda su caja y taparía el Link
          que queda debajo. Solo los botones lo llevan (z-10, por encima
          del Link en z-0) para poder pulsarse sin disparar la navegación. */}
      <Link
        href={`/oportunidades/${item.opportunityId}`}
        aria-label={`Ver oportunidad de ${item.customerName}`}
        className="absolute inset-0 z-0 rounded-lg"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[15px] font-semibold text-text">
              {item.customerName}
            </span>
            {amount && (
              <span className="flex-none font-mono text-[13px] font-semibold text-text">
                {amount}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-text-secondary">{item.action}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OpportunityStageBadge stage={item.stage} status="open" />
            <span
              className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                item.isOverdue ? "text-error" : "text-text-muted"
              }`}
            >
              <Clock size={14} />
              {formatDueDate(item.dueDate)}
            </span>
            {item.isAtRisk && (
              <Badge variant="error" dot>
                En riesgo
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Check size={14} />}
          onClick={handleDone}
          disabled={acting}
          className="relative z-10"
        >
          Hecho
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePostpone}
          disabled={acting}
          className="relative z-10"
        >
          Posponer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInteractionModalOpen(true)}
          className="relative z-10"
        >
          Registrar
        </Button>
      </div>
      {actionError && (
        <p className="relative z-10 mt-2 text-xs font-medium text-error">{actionError}</p>
      )}
      <RegistrarInteraccionModal
        open={interactionModalOpen}
        onClose={() => setInteractionModalOpen(false)}
        opportunityId={item.opportunityId}
      />
    </div>
  );
}

// Pantalla real de "Hoy" (AIT-16). El guard de rol de aquí abajo es solo
// UX (evita que Marta vea el shell de Carlos): NO es el control de acceso
// real, que vive en proxy.ts (enrutado) y en requireUser dentro de cada
// función de Convex (datos) — ver convex/nextSteps.ts.
export default function HoyPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const userInfo = useQuery(api.users.getCurrentUserInfo);
  const items = useQuery(api.nextSteps.listForToday);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [altaRapidaOpen, setAltaRapidaOpen] = useState(false);

  useEffect(() => {
    if (role === "owner") router.replace("/panel");
  }, [role, router]);

  if (role === "owner") {
    return null;
  }

  const vencidos = items?.filter((item) => item.isOverdue) ?? [];
  const hoy = items?.filter((item) => !item.isOverdue) ?? [];
  const hour = getBusinessHour(new Date().getTime());
  const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BUSINESS_TIME_ZONE,
  });

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text">
      <header className="flex items-start justify-between gap-3 border-b border-border bg-surface px-5 py-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text">
            {greeting}, {userInfo?.name ?? "…"}
          </h1>
          <p className="mt-0.5 text-[13px] capitalize text-text-muted">{today}</p>
        </div>
        <button
          type="button"
          disabled
          title="Notificaciones — disponible próximamente (AIT-18)"
          className="relative inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-border bg-surface text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Bell size={18} />
          {vencidos.length > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill border-2 border-surface bg-error px-1 text-[11px] font-bold text-white">
              {vencidos.length}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 pb-28">
        {items === undefined && <p className="text-text-secondary">Cargando…</p>}

        {items !== undefined && vencidos.length === 0 && hoy.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Check size={32} className="text-success" />
            <div>
              <p className="text-base font-semibold text-text">¡Todo al día!</p>
              <p className="mt-1 text-sm text-text-secondary">
                No te queda ningún seguimiento para hoy. Buen momento para captar una
                nueva oportunidad.
              </p>
            </div>
            <Button leftIcon={<Plus size={16} />} onClick={() => setAltaRapidaOpen(true)}>
              Nueva oportunidad
            </Button>
          </div>
        )}

        {vencidos.length > 0 && (
          <section className="mb-6">
            <div className="mb-2.5 flex items-center gap-2">
              <AlertTriangle size={16} className="text-error" />
              <span className="text-[13px] font-bold uppercase tracking-wide text-error">
                Vencidos
              </span>
              <span className="rounded-pill bg-error-subtle px-2.5 py-0.5 text-xs font-bold text-error">
                {vencidos.length}
              </span>
              <span className="ml-0.5 text-[12.5px] text-text-muted">
                no dejes que se enfríen
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {vencidos.map((item) => (
                <NextStepCard key={item.nextStepId} item={item} />
              ))}
            </div>
          </section>
        )}

        {hoy.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-[13px] font-bold uppercase tracking-wide text-text-secondary">
                Hoy
              </span>
              <span className="rounded-pill bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-text-secondary">
                {hoy.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {hoy.map((item) => (
                <NextStepCard key={item.nextStepId} item={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          aria-label="Alta rápida"
          onClick={() => setAltaRapidaOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-hover"
        >
          <Plus size={26} />
        </button>
      </div>

      <div className="flex justify-center border-t border-border bg-surface px-5 py-3">
        <Button variant="secondary" size="sm" onClick={() => signOut()}>
          Cerrar sesión
        </Button>
      </div>

      <AltaRapidaModal open={altaRapidaOpen} onClose={() => setAltaRapidaOpen(false)} />
    </div>
  );
}
