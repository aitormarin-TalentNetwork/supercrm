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
  Flag,
  MessageSquare,
  Phone,
  PartyPopper,
  Pencil,
  Plus,
  Receipt,
  Trash2,
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
import { PriorityBadge } from "@/components/crm/PriorityBadge";
import { BillingStatusBadge, type BillingStatus } from "@/components/crm/BillingStatusBadge";
import { InteractionTimeline } from "@/components/crm/InteractionTimeline";
import { RegistrarInteraccionModal } from "@/components/crm/RegistrarInteraccionModal";
import { formatCurrency, formatDate, formatDateTime, parseEuroAmount } from "@/lib/format";
import { computeQuoteTotals, roundTaxRate } from "@/lib/quoteMath";

const STAGES = [
  { value: "contacto", label: "Contacto" },
  { value: "presupuesto", label: "Presupuesto" },
  { value: "negociacion", label: "Negociación" },
] as const;

// AIT-35 (Post-MVP): "Media" primero, es el valor por defecto.
const PRIORITIES = [
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "baja", label: "Baja" },
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
  const [modal, setModal] = useState<"stage" | "priority" | "won" | "lost" | null>(
    null,
  );
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
              <PriorityBadge priority={summary.priority} />
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
                <Button
                  variant="secondary"
                  leftIcon={<Flag size={16} />}
                  onClick={() => setModal("priority")}
                >
                  Cambiar prioridad
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

        {summary.billingStatus !== null && (
          <BillingStatusSection
            opportunityId={opportunityId}
            billingStatus={summary.billingStatus}
          />
        )}

        <QuoteSection opportunityId={opportunityId} isOpen={isOpen} />

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
      <ChangePriorityDialog
        open={modal === "priority"}
        onClose={() => setModal(null)}
        opportunityId={opportunityId}
        currentPriority={summary.priority}
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

const NEXT_ACTION_LABEL: Record<BillingStatus, string | null> = {
  listo_para_facturar: "Marcar facturado",
  facturado: "Marcar cobrado",
  cobrado: null,
};

// AIT-33: sección persistente (no un diálogo) — el ciclo de cobro avanza
// con un único clic de confirmación, sin datos adicionales que pedir en
// cada paso (a diferencia de Ganada/Perdida, que sí piden importe/motivo).
// "Marcar facturado" es el punto de extensión declarado para una futura
// integración con un programa de facturación externo (sin proveedor
// decidido todavía, ver brief de AIT-33): hoy el botón solo cambia este
// estado interno; el día que se decida un proveedor, la llamada real a esa
// integración se dispara desde aquí o desde una action de Convex que
// envuelva advanceBillingStatus, sin cambiar la UI.
function BillingStatusSection({
  opportunityId,
  billingStatus,
}: {
  opportunityId: Id<"opportunities">;
  billingStatus: BillingStatus;
}) {
  const advance = useMutation(api.opportunities.advanceBillingStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdvance() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await advance({ opportunityId });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo avanzando el estado de cobro:", err);
      }
      setError("No se ha podido actualizar el estado de cobro. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const nextActionLabel = NEXT_ACTION_LABEL[billingStatus];

  return (
    <section className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
      <div className="flex items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
          <Receipt size={13} />
          Estado de cobro
        </span>
        <BillingStatusBadge status={billingStatus} />
      </div>
      {nextActionLabel && (
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={handleAdvance} disabled={loading}>
            {loading ? "Guardando…" : nextActionLabel}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
    </section>
  );
}

function formatTaxRatePercent(taxRate: number): string {
  const percent = roundTaxRate(taxRate) * 100;
  return String(Number(percent.toFixed(4))).replace(".", ",");
}

// Presupuesto por líneas (AIT-29, Post-MVP ronda 1 — sustituye el bloque
// simple de AIT-21). Sección propia en vez de otro modal más en la lista
// de botones de arriba: a diferencia de Cambiar etapa/Ganada/Perdida (una
// acción puntual), el presupuesto tiene un estado que se ve de un vistazo
// aquí mismo (líneas, total, si está enviado/aceptado/rechazado), igual
// que la sección de "Próximo paso" — el editor solo se abre para
// crear/modificar.
function QuoteSection({
  opportunityId,
  isOpen,
}: {
  opportunityId: Id<"opportunities">;
  isOpen: boolean;
}) {
  const quote = useQuery(api.quotes.getForOpportunity, { opportunityId });
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
      <div className="flex items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
          <Receipt size={13} />
          Presupuesto
        </span>
        {quote && (
          <span className="rounded-pill bg-primary-subtle px-2.5 py-[3px] text-xs font-semibold text-primary">
            {QUOTE_STATUS_LABEL[quote.status]}
          </span>
        )}
      </div>

      {quote === undefined && (
        <p className="mt-2.5 text-sm text-text-secondary">Cargando…</p>
      )}

      {quote === null && (
        <>
          <p className="mt-2.5 text-sm text-text-secondary">
            Todavía no se ha creado ningún presupuesto para esta oportunidad.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            leftIcon={<Plus size={14} />}
            disabled={!isOpen}
            title={isOpen ? undefined : "La oportunidad está cerrada."}
            onClick={() => setEditorOpen(true)}
          >
            Crear presupuesto
          </Button>
        </>
      )}

      {quote && (
        <>
          <div className="mt-3 flex flex-col gap-1.5">
            {quote.lines.map((line, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-text-secondary">
                  {line.quantity} × {line.productName}
                </span>
                <span className="flex-none font-mono text-text">
                  {formatCurrency(line.quantity * line.unitPrice)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>IVA ({formatTaxRatePercent(quote.taxRate)}%)</span>
              <span className="font-mono">{formatCurrency(quote.tax)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-text">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(quote.total)}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            leftIcon={<Pencil size={14} />}
            disabled={!isOpen}
            title={isOpen ? undefined : "La oportunidad está cerrada."}
            onClick={() => setEditorOpen(true)}
          >
            Editar presupuesto
          </Button>
        </>
      )}

      <QuoteDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        opportunityId={opportunityId}
        existingQuote={quote ?? null}
      />
    </section>
  );
}

type QuoteLineDraft = { productId: string; quantity: string };

function QuoteDialog({
  open,
  onClose,
  opportunityId,
  existingQuote,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: Id<"opportunities">;
  existingQuote: {
    lines: { productId: Id<"products">; productName: string; quantity: number; unitPrice: number }[];
    taxRate: number;
    status: "sent" | "accepted" | "rejected";
  } | null;
}) {
  const products = useQuery(api.products.list, open ? {} : "skip");
  const upsert = useMutation(api.quotes.upsertForOpportunity);

  const [lines, setLines] = useState<QuoteLineDraft[]>([]);
  const [taxRatePercent, setTaxRatePercent] = useState("21");
  const [status, setStatus] = useState<"sent" | "accepted" | "rejected">("sent");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Rellena el editor con el presupuesto existente (o uno vacío) en cada
  // apertura — mismo patrón que AltaRapidaModal/RegistrarInteraccionModal
  // para "reaccionar" a que `open` pasó a true sin un efecto aparte.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (existingQuote) {
        setLines(
          existingQuote.lines.map((l) => ({
            productId: l.productId,
            quantity: String(l.quantity),
          })),
        );
        setTaxRatePercent(formatTaxRatePercent(existingQuote.taxRate));
        setStatus(existingQuote.status);
      } else {
        setLines([]);
        setTaxRatePercent("21");
        setStatus("sent");
      }
      setFormError("");
    }
  }

  function handleClose() {
    if (loading) return;
    onClose();
  }

  function addLine() {
    const firstProduct = products?.[0];
    if (!firstProduct) return;
    setLines((prev) => [...prev, { productId: firstProduct.id, quantity: "1" }]);
  }

  function updateLine(index: number, patch: Partial<QuoteLineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  // Foto del presupuesto ya guardado, por producto — para una línea cuyo
  // producto se ha borrado del catálogo entre tanto (ronda de auditoría 2,
  // mayor único): el desplegable ya no lo ofrece, pero la línea sigue en
  // el formulario y hay que poder seguir viéndola/guardándola (aunque solo
  // sea para cambiar el estado del presupuesto) sin que la previsualización
  // la trate como si costara 0€ ni que el envío la rechace.
  const existingLineByProduct = new Map(
    (existingQuote?.lines ?? []).map((l) => [l.productId, l]),
  );
  const resolvedLines = lines.map((line) => {
    const product = productById.get(line.productId as Id<"products">);
    const removedProduct = product
      ? undefined
      : existingLineByProduct.get(line.productId as Id<"products">);
    const price = product?.price ?? removedProduct?.unitPrice ?? 0;
    const name = product?.name ?? removedProduct?.productName;
    const quantity = Number(line.quantity.replace(",", "."));
    return {
      name,
      price,
      removed: removedProduct !== undefined,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      lineTotal: name && Number.isFinite(quantity) ? price * quantity : 0,
    };
  });
  // roundTaxRate aquí también (no solo al formatear/precargar): el
  // servidor redondea el taxRate recibido al mismo contrato de precisión
  // antes de calcular sus totales (ronda de auditoría 4), así que sin
  // este redondeo la previsualización podía mostrar un total calculado
  // sobre un IVA con más decimales de los que realmente se van a
  // persistir.
  const rawTaxRate = (Number(taxRatePercent.replace(",", ".")) || 0) / 100;
  const taxRate = roundTaxRate(rawTaxRate);
  // Aviso no bloqueante (sugerencia del auditor, ronda 5): el campo
  // admite más precisión de la que el servidor conserva — si lo tecleado
  // tiene más decimales de los que cabe en el contrato, se avisa de qué
  // valor es el que realmente se va a guardar, en vez de dejar que el
  // usuario lo descubra solo mirando el total. Comparación con margen
  // (no `!==` directo): dividir entre 100 y volver a redondear introduce
  // ruido de coma flotante del orden de 1e-16 incluso para un valor YA
  // canónico (p.ej. "21,56" → 0.21559999999999999 vs
  // roundTaxRate(...) = 0.21560000000000001) — sin margen, el aviso
  // aparecía siempre, para cualquier IVA, aunque no hubiera pérdida real.
  // Cualquier pérdida de precisión genuina mueve el valor al menos medio
  // paso de redondeo (~0.00005), muy por encima de ese ruido.
  const taxRateHint =
    Math.abs(rawTaxRate - taxRate) > 1e-9
      ? `Se guardará como ${formatTaxRatePercent(taxRate)}%`
      : undefined;
  // Misma función que el servidor (lib/quoteMath.ts), no una cuenta propia:
  // sumar en punto flotante sin redondear aquí podía mostrar un total
  // distinto del que persiste convex/quotes.ts con cantidades decimales
  // (ronda de auditoría 1, mayor #2) — ahora es literalmente imposible que
  // diverjan, es la misma fórmula.
  const { subtotal, tax, total } = computeQuoteTotals(
    resolvedLines.map((l) => ({ quantity: l.quantity, unitPrice: l.price })),
    taxRate,
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (lines.length === 0) {
      setFormError("Añade al menos una línea al presupuesto.");
      return;
    }
    const parsedLines: { productId: Id<"products">; quantity: number }[] = [];
    for (const line of lines) {
      const quantity = Number(line.quantity.replace(",", "."));
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setFormError("Revisa las cantidades: alguna no es válida.");
        return;
      }
      parsedLines.push({ productId: line.productId as Id<"products">, quantity });
    }
    const parsedTaxRate = Number(taxRatePercent.replace(",", ".")) / 100;
    if (!Number.isFinite(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 1) {
      setFormError("El IVA debe estar entre 0% y 100%.");
      return;
    }

    setFormError("");
    setLoading(true);
    try {
      await upsert({ opportunityId, lines: parsedLines, taxRate: parsedTaxRate, status });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo guardando el presupuesto:", err);
      }
      setFormError("No se ha podido guardar el presupuesto. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="quote-form" disabled={loading}>
        {loading ? "Guardando…" : "Guardar presupuesto"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Presupuesto"
      description="Añade productos del catálogo y ajusta cantidades. El total se calcula solo."
      width={520}
      footer={footer}
    >
      <form id="quote-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {formError && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{formError}</div>
        )}

        {products !== undefined && products.length === 0 && lines.length === 0 && (
          <p className="rounded-md bg-neutral-50 p-3 text-sm text-text-secondary">
            El catálogo todavía no tiene productos — pide a Marta que añada alguno en
            &ldquo;Catálogo&rdquo; desde el Panel.
          </p>
        )}

        {products && (products.length > 0 || lines.length > 0) && (
          <div className="flex flex-col gap-2.5">
            {lines.map((line, index) => {
              // Producto borrado del catálogo después de usarse en este
              // presupuesto (ronda de auditoría 2, mayor único): el
              // desplegable ya no lo lista, así que se añade como opción
              // aparte deshabilitada solo para que la línea siga siendo
              // visible/guardable con su foto original — no se puede
              // volver a elegir a propósito.
              const removedLine = !productById.has(line.productId as Id<"products">)
                ? existingLineByProduct.get(line.productId as Id<"products">)
                : undefined;
              return (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    label={index === 0 ? "Producto" : undefined}
                    value={line.productId}
                    onChange={(e) => updateLine(index, { productId: e.target.value })}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.price)}
                      </option>
                    ))}
                    {removedLine && (
                      <option value={line.productId} disabled>
                        {removedLine.productName} — {formatCurrency(removedLine.unitPrice)}{" "}
                        (eliminado del catálogo)
                      </option>
                    )}
                  </Select>
                </div>
                <div className="w-20 flex-none">
                  <Input
                    label={index === 0 ? "Cant." : undefined}
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Quitar línea"
                  onClick={() => removeLine(index)}
                  className={`inline-flex h-11 w-9 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-error-subtle hover:text-error ${
                    index === 0 ? "mt-[26px]" : ""
                  }`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              );
            })}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={addLine}
              className="self-start"
            >
              Añadir línea
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="w-28">
            <Input
              label="IVA (%)"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(e.target.value)}
              hint={taxRateHint}
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              {(["sent", "accepted", "rejected"] as const).map((s) => (
                <option key={s} value={s}>
                  {QUOTE_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {lines.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md bg-neutral-50 p-3 text-sm">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>IVA</span>
              <span className="font-mono">{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-text">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </form>
    </Dialog>
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

function ChangePriorityDialog({
  open,
  onClose,
  opportunityId,
  currentPriority,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: Id<"opportunities">;
  currentPriority: "alta" | "media" | "baja";
}) {
  const changePriority = useMutation(api.opportunities.changePriority);
  const [priority, setPriority] = useState(currentPriority);
  // Resincroniza al ABRIR (no solo cuando cambia currentPriority): si el
  // usuario elige un valor y Cancela, el diálogo debe olvidarlo la próxima
  // vez que se abra — mismo patrón que MarkWonDialog más abajo (prevOpen),
  // no el de ChangeStageDialog, que no lo necesita porque nunca ha tenido
  // este bug (ronda de auditoría 1 de AIT-35, mayor #1).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setPriority(currentPriority);
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setError("");
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || priority === currentPriority) return;
    setLoading(true);
    setError("");
    try {
      await changePriority({ opportunityId, priority });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo cambiando prioridad:", err);
      }
      setError("No se ha podido cambiar la prioridad. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        form="change-priority-form"
        disabled={loading || priority === currentPriority}
      >
        {loading ? "Guardando…" : "Guardar prioridad"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Cambiar prioridad"
      description="Importancia manual de la oportunidad — no cambia su etapa ni su próximo paso."
      width={420}
      footer={footer}
    >
      <form id="change-priority-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{error}</div>
        )}
        <Select
          label="Prioridad"
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
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
