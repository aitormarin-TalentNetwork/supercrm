"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Clock, Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AltaRapidaModal } from "@/components/crm/AltaRapidaModal";
import { formatCurrency } from "@/lib/format";

type Stage = "contacto" | "presupuesto" | "negociacion";
type SortOption = "importe-desc" | "importe-asc" | "cliente";

// 3 etapas + status, no las 6 de la paleta del design system — ver
// docs/02-modelo-de-datos.md §2 (ganada/perdida son status, no etapa).
const STAGES: { stage: Stage; title: string }[] = [
  { stage: "contacto", title: "Contacto" },
  { stage: "presupuesto", title: "Presupuesto" },
  { stage: "negociacion", title: "Negociación" },
];

export default function PipelinePage() {
  const router = useRouter();
  const opportunities = useQuery(api.opportunities.listOpen, {});
  const changeStage = useMutation(api.opportunities.changeStage);

  const [search, setSearch] = useState("");
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [sort, setSort] = useState<SortOption>("importe-desc");
  const [altaOpen, setAltaOpen] = useState(false);
  const [dragId, setDragId] = useState<Id<"opportunities"> | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const [moveError, setMoveError] = useState("");

  const visible = useMemo(() => {
    if (!opportunities) return [];
    const q = search.trim().toLowerCase();
    return opportunities
      .filter(
        (o) =>
          (!q || o.customerName.toLowerCase().includes(q)) &&
          (!onlyAtRisk || o.atRisk),
      )
      .sort((a, b) => {
        if (sort === "cliente") {
          return a.customerName.localeCompare(b.customerName, "es");
        }
        const diff = (a.estimatedAmount ?? 0) - (b.estimatedAmount ?? 0);
        return sort === "importe-asc" ? diff : -diff;
      });
  }, [opportunities, search, onlyAtRisk, sort]);

  const columns = STAGES.map(({ stage, title }) => {
    const cards = visible.filter((o) => o.stage === stage);
    const total = cards.reduce((sum, o) => sum + (o.estimatedAmount ?? 0), 0);
    return { stage, title, cards, total };
  });

  const openCount = visible.length;
  const openSum = visible.reduce((sum, o) => sum + (o.estimatedAmount ?? 0), 0);

  async function handleDrop(stage: Stage) {
    const draggedId = dragId;
    setDragId(null);
    setOverStage(null);
    if (!draggedId) return;
    const dragged = opportunities?.find((o) => o.id === draggedId);
    if (!dragged || dragged.stage === stage) return;
    try {
      await changeStage({ opportunityId: draggedId, stage });
      setMoveError("");
    } catch (err) {
      // Mensaje genérico al usuario, detalle solo en consola de desarrollo
      // (mismo criterio que AltaRapidaModal: no exponer err.message).
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo moviendo la oportunidad de etapa:", err);
      }
      setMoveError("No se ha podido mover la oportunidad. Inténtalo de nuevo.");
    }
  }

  if (opportunities === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-bg font-sans text-text">
      <header className="flex-none border-b border-border bg-surface px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="min-w-0">
            <h1 className="m-0 text-[19px] font-bold tracking-tight">Pipeline</h1>
            <p className="text-[12.5px] text-text-muted">
              {openCount} oportunidad{openCount === 1 ? "" : "es"} abierta
              {openCount === 1 ? "" : "s"} ·{" "}
              <span className="font-mono">{formatCurrency(openSum)}</span> en
              juego
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden w-[220px] sm:block">
              <Input
                size="sm"
                leftIcon={<Search size={15} />}
                placeholder="Buscar cliente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button leftIcon={<Plus size={16} />} onClick={() => setAltaOpen(true)}>
              Nueva oportunidad
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
            <input
              type="checkbox"
              checked={onlyAtRisk}
              onChange={(e) => setOnlyAtRisk(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Solo en riesgo
          </label>
          <span className="flex-1" />
          <div className="w-[190px]">
            <Select
              size="sm"
              aria-label="Ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
            >
              <option value="importe-desc">Importe (mayor)</option>
              <option value="importe-asc">Importe (menor)</option>
              <option value="cliente">Cliente (A–Z)</option>
            </Select>
          </div>
        </div>

        {moveError && (
          <div className="mt-3 rounded-md bg-error-subtle p-2.5 text-sm text-error">
            {moveError}
          </div>
        )}
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden p-5">
        {columns.map((col) => (
          <div
            key={col.stage}
            data-stage={col.stage}
            onDragOver={(e) => {
              e.preventDefault();
              if (overStage !== col.stage) setOverStage(col.stage);
            }}
            onDrop={(e) => {
              e.preventDefault();
              void handleDrop(col.stage);
            }}
            className="flex w-[280px] flex-none flex-col rounded-lg transition-shadow"
            style={{
              boxShadow:
                overStage === col.stage ? "0 0 0 2px var(--color-primary)" : "none",
            }}
          >
            <div className="flex items-center justify-between gap-2 rounded-t-lg border border-b-0 border-border bg-neutral-50 px-3.5 py-3">
              <span className="text-[13px] font-bold">{col.title}</span>
              <span className="rounded-pill bg-neutral-200 px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                {col.cards.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto rounded-b-lg border border-t-0 border-border bg-neutral-50 p-2.5">
              <div className="mb-2 px-1 font-mono text-xs font-semibold text-text-muted">
                {formatCurrency(col.total)}
              </div>
              <div className="flex flex-col gap-2">
                {col.cards.map((item) => (
                  <div
                    key={item.id}
                    data-opportunity-id={item.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(item.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStage(null);
                    }}
                    onClick={() => router.push(`/oportunidades/${item.id}`)}
                    role="button"
                    tabIndex={0}
                    className="cursor-grab rounded-md border border-border bg-surface p-3 shadow-[var(--shadow-e1)] transition-shadow hover:border-border-strong hover:shadow-[var(--shadow-e2)]"
                    style={{ opacity: dragId === item.id ? 0.4 : 1 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                        {item.customerName}
                      </span>
                      <span className="flex-none font-mono text-[13px] font-semibold">
                        {item.estimatedAmount !== null
                          ? formatCurrency(item.estimatedAmount)
                          : "—"}
                      </span>
                    </div>
                    {item.nextStepAction && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock size={13} className="flex-none" />
                        <span className="min-w-0 truncate">
                          {item.nextStepAction}
                        </span>
                      </div>
                    )}
                    {item.atRisk && (
                      <div className="mt-2.5">
                        <Badge variant="warning">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle size={11} />
                            En riesgo
                          </span>
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                {col.cards.length === 0 && (
                  <div className="rounded-md border-[1.5px] border-dashed border-border-strong px-3 py-4 text-center text-xs text-text-muted">
                    Sin oportunidades
                    <br />
                    Suelta aquí para mover
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AltaRapidaModal open={altaOpen} onClose={() => setAltaOpen(false)} />
    </main>
  );
}
