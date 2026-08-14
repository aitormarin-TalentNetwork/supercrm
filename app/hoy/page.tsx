"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Plus, Check, Clock, AlertTriangle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { PriorityBadge } from "@/components/crm/PriorityBadge";
import { AltaRapidaModal } from "@/components/crm/AltaRapidaModal";
import { RegistrarInteraccionModal } from "@/components/crm/RegistrarInteraccionModal";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { formatCurrency } from "@/lib/format";
import {
  BUSINESS_TIME_ZONE,
  businessDaysBetween,
  getBusinessHour,
  startOfBusinessDay,
} from "@/lib/businessTime";

type Priority = "alta" | "media" | "baja";
type SortOption = "vencimiento" | "prioridad";

// AIT-36: alta primero — mismo orden que ya usa el Select de "Ordenar"
// (menor peso = más arriba).
const PRIORITY_WEIGHT: Record<Priority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

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
  priority: Priority;
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
  return new Date(ms).toLocaleDateString("es-ES", {
    timeZone: BUSINESS_TIME_ZONE,
  });
}

function daysSince(ms: number): number {
  return businessDaysBetween(ms, Date.now());
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
        item.isOverdue
          ? "border-l-[3px] border-l-error border-border"
          : "border-border"
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
            <PriorityBadge priority={item.priority} />
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
          size="md"
          leftIcon={<Check size={14} />}
          onClick={handleDone}
          disabled={acting}
          className="relative z-10"
        >
          Hecho
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={handlePostpone}
          disabled={acting}
          className="relative z-10"
        >
          Posponer
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => setInteractionModalOpen(true)}
          className="relative z-10"
        >
          Registrar
        </Button>
      </div>
      {actionError && (
        <p className="relative z-10 mt-2 text-xs font-medium text-error">
          {actionError}
        </p>
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
  const notifications = useQuery(api.nextSteps.getNotifications);
  const router = useRouter();
  const [altaRapidaOpen, setAltaRapidaOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "todas">(
    "todas",
  );
  const [sortBy, setSortBy] = useState<SortOption>("vencimiento");

  useEffect(() => {
    // AIT-50 (NO-GO ronda 1, mayor #1): storeManager es un rol de
    // gestión de tienda entera, igual que owner (ver isStoreWideRole en
    // convex/model/access.ts) — Hoy es la agenda personal de un
    // comercial individual, no encaja con ese rol. Se redirige a Panel
    // igual que a owner, en vez de dejarlo "colarse" con el shell de
    // navegación de sales solo porque el guard original solo miraba
    // "owner" a secas.
    if (role === "owner" || role === "storeManager") router.replace("/panel");
  }, [role, router]);

  // Filtro y orden por prioridad (AIT-36) aplicados ANTES de separar en
  // Vencidos/Hoy: cada sección conserva su propio criterio de orden
  // (vencimiento por defecto, o prioridad con el vencimiento como
  // desempate) en vez de reordenar solo una de las dos.
  const filteredItems = useMemo(() => {
    if (!items) return [];
    const filtered =
      priorityFilter === "todas"
        ? items
        : items.filter((item) => item.priority === priorityFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === "prioridad") {
        const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (diff !== 0) return diff;
      }
      return a.dueDate - b.dueDate;
    });
  }, [items, priorityFilter, sortBy]);

  // AIT-50 (NO-GO ronda 2, mayor): "role === undefined" (la query
  // todavía no ha resuelto, primer render) NO cumplía ninguna de las
  // dos ramas de abajo, así que se pintaba el shell completo de sales
  // — BottomTabBar incluido — antes de que el useEffect de arriba
  // redirigiera. Con app/page.tsx ya mandando a storeManager
  // directamente a /panel, este caso ya no debería darse en el camino
  // normal de entrada, pero se trata igual que el resto de guards de
  // rol del proyecto (p.ej. app/panel/page.tsx): no se pinta contenido
  // mientras el rol no se conoce.
  if (role === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  if (role === "owner" || role === "storeManager") {
    return null;
  }

  const hasAnyItems = (items?.length ?? 0) > 0;
  const vencidos = filteredItems.filter((item) => item.isOverdue);
  const hoy = filteredItems.filter((item) => !item.isOverdue);
  const hasFilteredItems = vencidos.length > 0 || hoy.length > 0;
  const dueSteps = notifications?.dueSteps ?? [];
  const atRiskOpportunities = notifications?.atRiskOpportunities ?? [];
  const notifCount = dueSteps.length + atRiskOpportunities.length;
  const hour = getBusinessHour(new Date().getTime());
  const greeting =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
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
          <p className="mt-0.5 text-[13px] capitalize text-text-muted">
            {today}
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-label="Notificaciones"
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen((open) => !open)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-text-secondary hover:bg-neutral-100"
            >
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill border-2 border-surface bg-error px-1 text-[11px] font-bold text-white">
                  {notifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                {/* Cierra al hacer clic fuera — pantalla completa transparente
                  detrás del panel, por delante del resto de la página. */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] w-[340px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                  <div className="sticky top-0 border-b border-border bg-surface px-4 py-3">
                    <span className="text-sm font-bold text-text">
                      Notificaciones
                    </span>
                  </div>

                  {notifications === undefined && (
                    <p className="px-4 py-6 text-center text-sm text-text-secondary">
                      Cargando…
                    </p>
                  )}

                  {notifications !== undefined && notifCount === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-text-secondary">
                      Sin avisos pendientes.
                    </p>
                  )}

                  {dueSteps.length > 0 && (
                    <div className="px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                        Pasos de hoy
                      </span>
                      <div className="mt-2 flex flex-col gap-2.5">
                        {dueSteps.map((step) => (
                          <Link
                            key={step.nextStepId}
                            href={`/oportunidades/${step.opportunityId}`}
                            onClick={() => setNotifOpen(false)}
                            className="block rounded-md p-2 -mx-2 hover:bg-neutral-100"
                          >
                            <div className="truncate text-sm font-semibold text-text">
                              {step.customerName}
                            </div>
                            <div className="mt-0.5 truncate text-xs text-text-secondary">
                              {step.action}
                            </div>
                            <div
                              className={`mt-1 font-mono text-xs font-semibold ${
                                step.isOverdue
                                  ? "text-error"
                                  : "text-text-muted"
                              }`}
                            >
                              {formatDueDate(step.dueDate)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {atRiskOpportunities.length > 0 && (
                    <div className="border-t border-border px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                        Oportunidades en riesgo
                      </span>
                      <div className="mt-2 flex flex-col gap-2.5">
                        {atRiskOpportunities.map((item) => (
                          <Link
                            key={item.opportunityId}
                            href={`/oportunidades/${item.opportunityId}`}
                            onClick={() => setNotifOpen(false)}
                            className="block rounded-md p-2 -mx-2 hover:bg-neutral-100"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-text">
                                {item.customerName}
                              </span>
                              <Badge variant="error" dot>
                                {daysSince(item.lastActivityAt)} días sin
                                actividad
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {hasAnyItems && (
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-surface px-5 py-3">
          <div className="w-full sm:w-[190px]">
            <Select
              size="sm"
              aria-label="Filtrar por prioridad"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as Priority | "todas")
              }
            >
              <option value="todas">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </Select>
          </div>
          <div className="w-full sm:w-[190px]">
            <Select
              size="sm"
              aria-label="Ordenar"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="vencimiento">Vencimiento</option>
              <option value="prioridad">Prioridad (alta primero)</option>
            </Select>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-5 py-5 pb-32">
        {items === undefined && (
          <p className="text-text-secondary">Cargando…</p>
        )}

        {items !== undefined && !hasAnyItems && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Check size={32} className="text-success" />
            <div>
              <p className="text-base font-semibold text-text">¡Todo al día!</p>
              <p className="mt-1 text-sm text-text-secondary">
                No te queda ningún seguimiento para hoy. Buen momento para
                captar una nueva oportunidad.
              </p>
            </div>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => setAltaRapidaOpen(true)}
            >
              Nueva oportunidad
            </Button>
          </div>
        )}

        {hasAnyItems && !hasFilteredItems && (
          <p className="py-16 text-center text-sm text-text-secondary">
            Ningún seguimiento con esa prioridad. Prueba con otro filtro.
          </p>
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

      <div className="fixed bottom-[76px] right-6">
        <button
          type="button"
          aria-label="Alta rápida"
          onClick={() => setAltaRapidaOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-hover"
        >
          <Plus size={26} />
        </button>
      </div>

      <BottomTabBar />

      <AltaRapidaModal
        open={altaRapidaOpen}
        onClose={() => setAltaRapidaOpen(false)}
      />
    </div>
  );
}
