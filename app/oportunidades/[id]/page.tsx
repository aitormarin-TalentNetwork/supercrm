"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Euro,
  MessageSquare,
  Phone,
  PartyPopper,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { InteractionTimeline } from "@/components/crm/InteractionTimeline";
import { RegistrarInteraccionModal } from "@/components/crm/RegistrarInteraccionModal";
import { formatCurrency, formatDate, formatDateTime, parseEuroAmount } from "@/lib/format";

const STAGES = [
  { value: "contacto", label: "Contacto" },
  { value: "presupuesto", label: "Presupuesto" },
  { value: "negociacion", label: "Negociación" },
] as const;

const LOST_REASONS = [
  "Precio",
  "Eligió a la competencia",
  "Sin respuesta",
  "No era el momento",
  "Otro",
] as const;

export default function OportunidadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const opportunityId = id as Id<"opportunities">;
  const router = useRouter();
  const summary = useQuery(api.opportunities.getSummary, { opportunityId });
  const interactions = useQuery(api.interactions.listByOpportunity, { opportunityId });
  const [modal, setModal] = useState<"stage" | "won" | "lost" | null>(null);
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);

  if (summary === undefined || interactions === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  if (summary === null || interactions === null) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Oportunidad no encontrada o sin acceso.</p>
      </main>
    );
  }

  const isOpen = summary.status === "open";
  const isOverdue = summary.nextStep?.overdue ?? false;

  // Detalle es el nodo central (docs/01-arquitectura.md §3): se llega desde
  // Hoy, Pipeline, Ficha de cliente, Panel y Supervisión — "Volver" no
  // puede apuntar siempre a /hoy (ronda de auditoría 1 de AIT-25,
  // sugerencia #1). router.back() vuelve a la pantalla de origen real; si
  // no hay historial propio (enlace directo, pestaña nueva), "/" ya
  // resuelve el destino por rol (owner → /panel, sales → /hoy) sin
  // duplicar esa lógica aquí.
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-bg font-sans text-text">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Volver"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Oportunidad
        </div>
        <a
          href={`tel:${summary.customerPhone}`}
          aria-label="Llamar"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-primary hover:bg-primary-subtle"
        >
          <Phone size={18} />
        </a>
      </header>

      <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 pb-24 pt-[18px]">
        {!isOpen && (
          <div
            className="flex items-center gap-2.5 rounded-md px-4 py-3.5"
            style={{
              background:
                summary.status === "won"
                  ? "var(--color-success-subtle)"
                  : "var(--color-error-subtle)",
              color: summary.status === "won" ? "#15803D" : "#B91C1C",
            }}
          >
            {summary.status === "won" ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
            <span className="text-sm font-semibold">
              {summary.status === "won"
                ? `Oportunidad ganada · ${
                    summary.finalAmount !== null ? formatCurrency(summary.finalAmount) : "—"
                  }`
                : `Oportunidad perdida · Motivo: ${summary.lostReason ?? "—"}`}
            </span>
          </div>
        )}

        <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-e1)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/clientes/${summary.customerId}`}
                className="inline-flex items-center gap-1.5 text-inherit no-underline hover:text-primary"
              >
                <h1 className="m-0 text-[23px] font-bold tracking-tight">
                  {summary.customerName}
                </h1>
                <ChevronRight size={18} className="flex-none text-neutral-400" />
              </Link>
              <div className="mt-0.5 text-xs text-text-muted">Ver ficha del cliente</div>
              <div className="mt-1.5 font-mono text-sm text-text-secondary">
                {summary.customerPhone}
              </div>
            </div>
            <div className="flex flex-none flex-col items-end gap-2">
              <OpportunityStageBadge stage={summary.stage} status={summary.status} />
              {isOpen && summary.atRisk && (
                <Badge variant="warning">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle size={11} />
                    En riesgo
                  </span>
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-[18px] grid grid-cols-1 gap-x-[18px] gap-y-3.5 border-t border-border pt-[18px] sm:grid-cols-2">
            <HeaderField label="Importe estimado">
              <span className="font-mono text-[17px] font-semibold">
                {summary.estimatedAmount !== null
                  ? formatCurrency(summary.estimatedAmount)
                  : "—"}
              </span>
            </HeaderField>
            <HeaderField label="Cierre previsto">
              <span className="font-mono text-sm">
                {summary.expectedCloseDate !== null
                  ? formatDate(summary.expectedCloseDate)
                  : "—"}
              </span>
            </HeaderField>
            <HeaderField label="Producto / interés">
              {summary.interest ?? "—"}
            </HeaderField>
            <HeaderField label="Comercial">{summary.ownerName ?? "—"}</HeaderField>
            <HeaderField label="Tienda">{summary.storeName ?? "—"}</HeaderField>
          </div>

          <div className="mt-[18px] flex flex-wrap items-center gap-2.5 border-t border-border pt-[18px]">
            <Button
              variant="secondary"
              leftIcon={<MessageSquare size={16} />}
              disabled={!isOpen}
              title={isOpen ? undefined : "La oportunidad está cerrada."}
              onClick={() => setInteractionModalOpen(true)}
            >
              Registrar interacción
            </Button>
            {isOpen && (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeftRight size={16} />}
                  onClick={() => setModal("stage")}
                >
                  Cambiar etapa
                </Button>
                <span className="flex-1" />
                <Button
                  variant="secondary"
                  leftIcon={<CheckCircle2 size={16} />}
                  onClick={() => setModal("won")}
                >
                  Ganada
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<XCircle size={16} />}
                  onClick={() => setModal("lost")}
                >
                  Perdida
                </Button>
              </>
            )}
          </div>
        </section>

        <section
          className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]"
          style={{
            borderLeft: `3px solid ${isOverdue ? "var(--color-error)" : "var(--color-primary)"}`,
          }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Próximo paso
            </span>
            {summary.nextStep && (
              <span
                className="rounded-pill px-2.5 py-[3px] text-xs font-semibold"
                style={{
                  background: isOverdue ? "var(--color-error-subtle)" : "var(--color-primary-subtle)",
                  color: isOverdue ? "#B91C1C" : "var(--color-primary)",
                }}
              >
                {isOverdue ? "Vencido" : "Pendiente"}
              </span>
            )}
          </div>
          {summary.nextStep ? (
            <div className="mt-3">
              <div className="text-base font-semibold">{summary.nextStep.action}</div>
              <div
                className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[13px] font-medium"
                style={{ color: isOverdue ? "var(--color-error)" : "var(--color-primary)" }}
              >
                <Clock size={15} />
                {formatDateTime(summary.nextStep.dueDate)}
              </div>
            </div>
          ) : (
            <div className="mt-2.5 text-sm text-text-muted">
              Sin próximo paso — la oportunidad está cerrada.
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Presupuesto
          </span>
          <p className="mt-2.5 text-sm text-text-secondary">
            Todavía no se ha creado ningún presupuesto para esta oportunidad.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
          <span className="mb-4 block text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Historial de interacciones
          </span>
          <InteractionTimeline
            interactions={interactions}
            emptyMessage="Sin interacciones registradas todavía."
          />
        </section>
      </div>

      <RegistrarInteraccionModal
        open={interactionModalOpen}
        onClose={() => setInteractionModalOpen(false)}
        opportunityId={opportunityId}
      />
      <ChangeStageDialog
        open={modal === "stage"}
        onClose={() => setModal(null)}
        opportunityId={opportunityId}
        currentStage={summary.stage}
      />
      <MarkWonDialog
        open={modal === "won"}
        onClose={() => setModal(null)}
        opportunityId={opportunityId}
        estimatedAmount={summary.estimatedAmount}
      />
      <MarkLostDialog
        open={modal === "lost"}
        onClose={() => setModal(null)}
        opportunityId={opportunityId}
      />
    </main>
  );
}

function HeaderField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function ChangeStageDialog({
  open,
  onClose,
  opportunityId,
  currentStage,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: Id<"opportunities">;
  currentStage: "contacto" | "presupuesto" | "negociacion";
}) {
  const changeStage = useMutation(api.opportunities.changeStage);
  const [stage, setStage] = useState(currentStage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setError("");
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || stage === currentStage) return;
    setLoading(true);
    setError("");
    try {
      await changeStage({ opportunityId, stage });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo cambiando etapa:", err);
      }
      setError("No se ha podido cambiar la etapa. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="change-stage-form" disabled={loading || stage === currentStage}>
        {loading ? "Guardando…" : "Guardar etapa"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Cambiar etapa"
      description="Mueve la oportunidad a otra fase del proceso."
      width={420}
      footer={footer}
    >
      <form id="change-stage-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{error}</div>
        )}
        <Select
          label="Etapa"
          value={stage}
          onChange={(e) => setStage(e.target.value as typeof stage)}
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </form>
    </Dialog>
  );
}

function MarkWonDialog({
  open,
  onClose,
  opportunityId,
  estimatedAmount,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: Id<"opportunities">;
  estimatedAmount: number | null;
}) {
  const markWon = useMutation(api.opportunities.markWon);
  const [amount, setAmount] = useState(() =>
    estimatedAmount !== null ? String(estimatedAmount).replace(".", ",") : "",
  );
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAmount(estimatedAmount !== null ? String(estimatedAmount).replace(".", ",") : "");
    }
  }
  const [amountError, setAmountError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setAmountError("");
    setError("");
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const parsed = parseEuroAmount(amount);
    if (parsed === undefined || parsed === null) {
      setAmountError("Introduce el importe final de la venta.");
      return;
    }
    setAmountError("");
    setError("");
    setLoading(true);
    try {
      await markWon({ opportunityId, finalAmount: parsed });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo marcando ganada:", err);
      }
      setError("No se ha podido marcar la oportunidad como ganada. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="mark-won-form" disabled={loading}>
        {loading ? "Guardando…" : "Marcar ganada"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Marcar como ganada"
      description="Registra la venta cerrada."
      width={420}
      footer={footer}
    >
      <form id="mark-won-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{error}</div>
        )}
        <div className="flex items-center gap-2.5 rounded-md bg-success-subtle p-3">
          <PartyPopper size={18} className="flex-none text-[#15803D]" />
          <span className="text-[13.5px] text-text-secondary">
            ¡Buen trabajo! Confirma el importe final de la venta.
          </span>
        </div>
        <Input
          label="Importe final (€)"
          leftIcon={<Euro size={16} />}
          error={amountError}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </form>
    </Dialog>
  );
}

function MarkLostDialog({
  open,
  onClose,
  opportunityId,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: Id<"opportunities">;
}) {
  const markLost = useMutation(api.opportunities.markLost);
  const [reason, setReason] = useState<string>(LOST_REASONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setError("");
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await markLost({ opportunityId, lostReason: reason });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo marcando perdida:", err);
      }
      setError("No se ha podido marcar la oportunidad como perdida. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="mark-lost-form" variant="danger" disabled={loading}>
        {loading ? "Guardando…" : "Marcar perdida"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Marcar como perdida"
      description="Indica el motivo para aprender de cada cierre."
      width={420}
      footer={footer}
    >
      <form id="mark-lost-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{error}</div>
        )}
        <Select
          label="Motivo de la pérdida"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {LOST_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </form>
    </Dialog>
  );
}
