"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  MessageSquare,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { NavToggleButton } from "@/components/nav/NavToggleButton";
import { QuickActions } from "@/components/nav/QuickActions";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { formatCurrency } from "@/lib/format";

// Guard de rol de UX (evita que un "sales" vea el shell de supervisión) —
// no es el control de acceso real, que vive en proxy.ts + requireStoreAccess
// dentro de cada query de convex/dashboard.ts. Mismo patrón que
// app/panel/page.tsx. AIT-31: storeManager pasa este guard igual que
// owner — cada uno ve su propia tienda, resuelto por requireStoreAccess.
export default function SupervisionPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const store = useQuery(api.stores.getStoreInfo, {});
  const router = useRouter();

  const workload = useQuery(api.dashboard.getWorkloadByOwner, {});
  const interactionCounts = useQuery(
    api.dashboard.getInteractionCountsByOwner,
    {},
  );
  const overdueCounts = useQuery(api.dashboard.getOverdueCountsByOwner, {});
  const openOpportunities = useQuery(
    api.dashboard.listOpenOpportunitiesForSupervision,
    {},
  );

  const [filtro, setFiltro] = useState<Id<"users"> | "todos">("todos");

  useEffect(() => {
    if (role === "sales") router.replace("/hoy");
  }, [role, router]);

  const comerciales = useMemo(() => {
    if (!interactionCounts || !overdueCounts || !workload) return null;
    const workloadByOwner = new Map(workload.map((w) => [w.ownerId, w]));
    const overdueByOwner = new Map(
      overdueCounts.map((o) => [o.ownerId, o.count]),
    );
    return interactionCounts
      .map((ic) => {
        const w = workloadByOwner.get(ic.ownerId);
        return {
          ownerId: ic.ownerId,
          ownerName: ic.ownerName ?? "Sin nombre",
          openCount: w?.count ?? 0,
          openAmount: w?.totalAmount ?? 0,
          interactionCount: ic.count,
          overdueCount: overdueByOwner.get(ic.ownerId) ?? 0,
        };
      })
      .sort((a, b) => b.openAmount - a.openAmount);
  }, [interactionCounts, overdueCounts, workload]);

  const maxOpenAmount = useMemo(
    () => Math.max(1, ...(comerciales ?? []).map((c) => c.openAmount)),
    [comerciales],
  );

  const filteredOpportunities = useMemo(() => {
    if (!openOpportunities) return [];
    if (filtro === "todos") return openOpportunities;
    return openOpportunities.filter((o) => o.ownerId === filtro);
  }, [openOpportunities, filtro]);

  if (role === "sales") return null;

  if (
    role === undefined ||
    comerciales === null ||
    openOpportunities === undefined
  ) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  // Totales de cabecera calculados sobre TODAS las oportunidades abiertas
  // de la tienda (openOpportunities), no sumando solo la tabla "por
  // comercial" (que es sales-only) — si no, "Oportunidades abiertas" y
  // "Seguimientos atrasados" no coincidirían con lo que se ve en el
  // listado de abajo cuando la propia Marta tiene oportunidades propias
  // (pasa de verdad en este deployment: verificado en real).
  const team = {
    comerciales: comerciales.length,
    abiertas: openOpportunities.length,
    valor: openOpportunities.reduce(
      (sum, o) => sum + (o.estimatedAmount ?? 0),
      0,
    ),
    atrasados: openOpportunities.filter((o) => o.isOverdue).length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex-none border-b border-border bg-surface px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-3.5">
            <NavToggleButton />
            <div className="min-w-0">
              <h1 className="m-0 text-[19px] font-bold tracking-tight">
                Supervisión del equipo
              </h1>
              <p className="text-[12.5px] text-text-muted">
                Rendimiento de tus comerciales — últimos 30 días
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <Badge variant="neutral">
                <span className="inline-flex items-center gap-1.5">
                  <Store size={12} />
                  {store?.name ?? "…"}
                </span>
              </Badge>
              <QuickActions />
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 px-5 py-6">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <KpiCard
              icon={<Users size={16} />}
              label="Comerciales"
              value={String(team.comerciales)}
            />
            <KpiCard
              icon={<TrendingUp size={16} />}
              label="Oportunidades abiertas"
              value={String(team.abiertas)}
            />
            <KpiCard
              label="Valor en juego"
              value={formatCurrency(team.valor)}
              mono
            />
            <KpiCard
              icon={<AlertTriangle size={16} />}
              label="Seguimientos atrasados"
              value={String(team.atrasados)}
              accent={team.atrasados > 0 ? "error" : undefined}
            />
          </div>

          <section className="rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <h2 className="m-0 text-[15px] font-bold">
                Comparativa por comercial
              </h2>
              <div className="w-full sm:w-[190px]">
                <Select
                  size="sm"
                  value={filtro}
                  onChange={(e) =>
                    setFiltro(e.target.value as Id<"users"> | "todos")
                  }
                >
                  <option value="todos">Todos los comerciales</option>
                  {comerciales.map((c) => (
                    <option key={c.ownerId} value={c.ownerId}>
                      {c.ownerName}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {comerciales.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-text-secondary">
                Todavía no hay comerciales en esta tienda.
              </p>
            ) : (
              <div className="flex flex-col">
                {comerciales.map((c) => (
                  <button
                    key={c.ownerId}
                    type="button"
                    onClick={() =>
                      setFiltro((current) =>
                        current === c.ownerId ? "todos" : c.ownerId,
                      )
                    }
                    className={`flex flex-col gap-2.5 border-t border-border px-4 py-3 text-left transition-colors hover:bg-neutral-100 sm:flex-row sm:items-center sm:gap-3 ${
                      filtro === c.ownerId ? "bg-primary-subtle" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2.5 sm:w-32 sm:flex-none">
                      <Avatar name={c.ownerName} size="sm" />
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {c.ownerName}
                      </span>
                    </span>
                    <span className="flex flex-1 items-center gap-2.5">
                      <span className="h-2 flex-1 overflow-hidden rounded-pill bg-neutral-100">
                        <span
                          className="block h-full rounded-pill bg-primary"
                          style={{
                            width: `${Math.round((c.openAmount / maxOpenAmount) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="flex-none whitespace-nowrap font-mono text-[13px] font-semibold">
                        {formatCurrency(c.openAmount)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-4 text-sm text-text-secondary sm:flex-none sm:justify-end">
                      <span
                        className="font-semibold text-text"
                        title="Oportunidades abiertas"
                      >
                        {c.openCount} abiertas
                      </span>
                      <span
                        className="inline-flex items-center gap-1"
                        title="Interacciones (30 días)"
                      >
                        <MessageSquare size={13} className="text-neutral-400" />
                        {c.interactionCount}
                      </span>
                      <span
                        title="Seguimientos atrasados"
                        className={`inline-flex min-w-[26px] justify-center rounded-pill px-2 py-0.5 text-xs font-bold ${
                          c.overdueCount > 0
                            ? "bg-error-subtle text-error"
                            : "bg-[var(--color-success-subtle)] text-[#15803D]"
                        }`}
                      >
                        {c.overdueCount}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
            <div className="flex items-center justify-between gap-3 p-4">
              <h2 className="m-0 text-[15px] font-bold">
                Oportunidades ·{" "}
                {filtro === "todos"
                  ? "Todo el equipo"
                  : comerciales.find((c) => c.ownerId === filtro)?.ownerName}
              </h2>
              <span className="text-xs text-text-muted">
                {filteredOpportunities.length} abiertas
              </span>
            </div>
            {filteredOpportunities.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-text-secondary">
                Sin oportunidades abiertas para este filtro.
              </p>
            ) : (
              <div className="flex flex-col">
                {filteredOpportunities.map((o) => (
                  <Link
                    key={o.id}
                    href={`/oportunidades/${o.id}`}
                    className="flex flex-col gap-2 border-t border-border px-4 py-3 transition-colors hover:bg-neutral-100 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5 sm:flex-1">
                      <Avatar name={o.customerName} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {o.customerName}
                        </span>
                        {o.isOverdue && (
                          <span className="text-[11.5px] font-semibold text-error">
                            Seguimiento atrasado
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:flex-none sm:justify-end sm:gap-4">
                      <OpportunityStageBadge stage={o.stage} status="open" />
                      <span className="w-28 flex-none truncate text-[13px] text-text-secondary">
                        {o.ownerName ?? "—"}
                      </span>
                      <span className="w-24 flex-none text-right font-mono text-[13px] font-semibold">
                        {o.estimatedAmount !== null
                          ? formatCurrency(o.estimatedAmount)
                          : "—"}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  mono,
  accent,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  accent?: "error";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5 shadow-[var(--shadow-e1)]">
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1.5 text-[22px] font-bold ${mono ? "font-mono" : ""} ${
          accent === "error" && value !== "0" ? "text-error" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
