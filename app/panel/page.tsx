"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Store, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/ui/Avatar";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { BillingStatusBadge } from "@/components/crm/BillingStatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

// 3 etapas + status, no las 6 de la paleta del design system — igual que
// en Pipeline (AIT-12): ganada/perdida son status, no etapa.
const STAGE_META: Record<string, { label: string; color: string }> = {
  contacto: { label: "Contacto", color: "var(--pipeline-contactado)" },
  presupuesto: { label: "Presupuesto", color: "var(--pipeline-propuesta)" },
  negociacion: { label: "Negociación", color: "var(--pipeline-negociacion)" },
};

export default function PanelPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const router = useRouter();

  // Guardia de UX (no de acceso real — eso lo hacen proxy.ts y
  // requireStoreAccess en cada query de convex/dashboard.ts y de
  // stores.getStoreInfo). "skip" mientras no sabemos el rol evita pedir
  // datos financieros a Convex antes de confirmar que el usuario tiene
  // acceso — y evita una carrera real vista en pruebas: sin este guard,
  // getStoreInfo podía dispararse en el instante justo de un cambio de
  // sesión (signIn en curso) y fallar contra el token todavía-no-reemplazado
  // del usuario anterior. AIT-31: storeManager ve su tienda igual que
  // owner ve la suya — ambos pasan el guard, cada uno acotado a la suya
  // por requireStoreAccess (owner no pide ninguna tienda ajena aquí
  // todavía: eso es la comparativa entre tiendas, pendiente aparte).
  const canQuery = role === "owner" || role === "storeManager";
  const store = useQuery(api.stores.getStoreInfo, canQuery ? {} : "skip");
  const pipelineValue = useQuery(
    api.dashboard.getPipelineValue,
    canQuery ? {} : "skip",
  );
  const forecast = useQuery(api.dashboard.getForecast, canQuery ? {} : "skip");
  const atRiskCount = useQuery(
    api.dashboard.getAtRiskCount,
    canQuery ? {} : "skip",
  );
  const funnel = useQuery(
    api.dashboard.getFunnelByStage,
    canQuery ? {} : "skip",
  );
  const atRiskList = useQuery(
    api.dashboard.getAtRiskList,
    canQuery ? {} : "skip",
  );
  const pendingBilling = useQuery(
    api.dashboard.listPendingBilling,
    canQuery ? {} : "skip",
  );

  useEffect(() => {
    if (role === "sales") router.replace("/hoy");
    // null = no autenticado (getCurrentUserRole devuelve null si
    // getAuthUserId es null), distinto de undefined = todavía cargando.
    // proxy.ts ya debería haber redirigido antes de llegar aquí, pero una
    // sesión que expira o una carrera de auth en curso puede dejar el rol
    // en null momentáneamente — sin este caso, canQuery se queda en false
    // y las queries en "skip" para siempre, así que la pantalla se
    // quedaba en "Cargando…" sin salida (hallazgo de auditoría).
    if (role === null) router.replace("/login");
  }, [role, router]);

  if (role === undefined || role === "sales" || role === null) {
    return null;
  }

  const loading =
    pipelineValue === undefined ||
    forecast === undefined ||
    atRiskCount === undefined ||
    funnel === undefined ||
    atRiskList === undefined ||
    pendingBilling === undefined;

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  const forecastTotal = forecast.reduce((sum, f) => sum + f.amount, 0);
  const forecastSub =
    forecast.length === 0
      ? "Sin oportunidades con fecha de cierre prevista"
      : `Previsto en ${forecast.length} periodo${forecast.length === 1 ? "" : "s"}`;

  const maxFunnelAmount = Math.max(1, ...funnel.map((f) => f.totalAmount));

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text lg:flex-row">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          <h1 className="m-0 text-[15px] font-bold">Panel</h1>
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-secondary">
            <Store size={13} className="text-neutral-400" />
            {store?.name ?? "…"}
          </span>
        </header>

        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 pb-16 pt-[18px]">
          <p className="m-0 text-sm text-text-secondary">
            Hola Marta — así van las ventas de tu negocio.
          </p>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-muted">
                  Valor del pipeline
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary-subtle text-primary">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-3 font-mono text-[26px] font-bold tracking-tight">
                {formatCurrency(pipelineValue)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {funnel.reduce((sum, f) => sum + f.count, 0)} oportunidades
                abiertas
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-muted">
                  Forecast
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-secondary-subtle text-secondary">
                  <CalendarDays size={16} />
                </span>
              </div>
              <div className="mt-3 font-mono text-[26px] font-bold tracking-tight">
                {formatCurrency(forecastTotal)}
              </div>
              <div className="mt-1 text-xs text-text-muted">{forecastSub}</div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-muted">
                  Oportunidades en riesgo
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-error-subtle text-error">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <div className="mt-3 text-[26px] font-bold tracking-tight">
                {atRiskCount}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Sin actividad +7 días
              </div>
            </div>
          </div>

          {/* EMBUDO */}
          <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-e1)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-base font-bold">Embudo por etapa</h2>
              <Link
                href="/pipeline"
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                Ver pipeline
              </Link>
            </div>
            <div className="flex flex-col gap-3.5">
              {funnel.map((f) => {
                const meta = STAGE_META[f.stage];
                const width = Math.round(
                  (f.totalAmount / maxFunnelAmount) * 100,
                );
                return (
                  <div key={f.stage} className="flex items-center gap-3.5">
                    <div className="flex w-[120px] flex-none items-center gap-2">
                      <span
                        className="h-2 w-2 flex-none rounded-full"
                        style={{ background: meta.color }}
                      />
                      <span className="text-[13.5px] font-semibold">
                        {meta.label}
                      </span>
                    </div>
                    <div className="h-[26px] min-w-0 flex-1 overflow-hidden rounded-sm bg-neutral-100">
                      <div
                        className="h-full rounded-sm transition-[width] duration-300"
                        style={{ width: `${width}%`, background: meta.color }}
                      />
                    </div>
                    <div className="w-[54px] flex-none text-right text-xs text-text-muted">
                      {f.count} op.
                    </div>
                    <div className="w-[92px] flex-none text-right font-mono text-[13.5px] font-semibold">
                      {formatCurrency(f.totalAmount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* EN RIESGO */}
          <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-[18px]">
              <div className="flex items-center gap-2">
                <h2 className="m-0 text-base font-bold">
                  Oportunidades en riesgo
                </h2>
                <span className="rounded-pill bg-error-subtle px-2.5 py-0.5 text-[11px] font-bold text-error">
                  {atRiskList.length}
                </span>
              </div>
              <Link
                href="/supervision"
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                Ver supervisión
              </Link>
            </div>

            {atRiskList.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-text-secondary">
                Ninguna oportunidad abierta lleva más de 7 días sin actividad.
              </p>
            ) : (
              <>
                <div className="flex items-center px-5 pb-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  <span className="min-w-0 flex-[2]">Cliente</span>
                  <span className="flex-1 text-right">Importe</span>
                  <span className="flex-[1.3] text-center">Sin actividad</span>
                  <span className="flex-[1.4] text-right">Comercial</span>
                </div>
                {atRiskList.map((item) => (
                  <Link
                    key={item.opportunityId}
                    href={`/oportunidades/${item.opportunityId}`}
                    className="flex items-center border-t border-border px-5 py-3 transition-colors hover:bg-neutral-100"
                  >
                    <span className="flex min-w-0 flex-[2] items-center gap-2.5">
                      <Avatar name={item.customerName} size="xs" />
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {item.customerName}
                      </span>
                    </span>
                    <span className="flex-1 text-right font-mono text-[13.5px] font-semibold">
                      {item.estimatedAmount !== null
                        ? formatCurrency(item.estimatedAmount)
                        : "—"}
                    </span>
                    <span className="flex flex-[1.3] justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-error-subtle px-2.5 py-0.5 text-xs font-semibold text-error">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.daysSinceActivity} días
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-[1.4] items-center justify-end gap-2">
                      <span className="min-w-0 truncate text-[13px] text-text-secondary">
                        {item.ownerName ?? "—"}
                      </span>
                    </span>
                  </Link>
                ))}
              </>
            )}
          </section>

          {/* PENDIENTES DE COBRO — AIT-33: ventas ganadas cuyo ciclo de
            cobro no ha llegado a "cobrado" todavía. Sección propia en
            Panel (no en Supervisión): es visibilidad financiera del
            negocio (como Valor del pipeline/Forecast, arriba), no
            rendimiento del equipo — que es lo que ya cubre Supervisión. */}
          <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-[18px]">
              <div className="flex items-center gap-2">
                <h2 className="m-0 text-base font-bold">Pendientes de cobro</h2>
                <span className="rounded-pill bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-text-secondary">
                  {pendingBilling.length}
                </span>
              </div>
            </div>

            {pendingBilling.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-text-secondary">
                Ninguna venta ganada pendiente de cobro.
              </p>
            ) : (
              <>
                <div className="flex items-center px-5 pb-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  <span className="min-w-0 flex-[2]">Cliente</span>
                  <span className="flex-1 text-right">Importe</span>
                  <span className="flex-[1.3] text-center">Cerrada</span>
                  <span className="flex-[1.4] text-right">Estado</span>
                </div>
                {pendingBilling.map((item) => (
                  <Link
                    key={item.opportunityId}
                    href={`/oportunidades/${item.opportunityId}`}
                    className="flex items-center border-t border-border px-5 py-3 transition-colors hover:bg-neutral-100"
                  >
                    <span className="flex min-w-0 flex-[2] items-center gap-2.5">
                      <Avatar name={item.customerName} size="xs" />
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {item.customerName}
                      </span>
                    </span>
                    <span className="flex-1 text-right font-mono text-[13.5px] font-semibold">
                      {item.finalAmount !== null
                        ? formatCurrency(item.finalAmount)
                        : "—"}
                    </span>
                    <span className="flex-[1.3] text-center font-mono text-xs text-text-muted">
                      {item.closedAt ? formatDate(item.closedAt) : "—"}
                    </span>
                    <span className="flex flex-[1.4] justify-end">
                      <BillingStatusBadge status={item.billingStatus} />
                    </span>
                  </Link>
                ))}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
