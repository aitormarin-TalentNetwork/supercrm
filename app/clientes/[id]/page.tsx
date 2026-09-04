"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Store,
  Trash2,
  UserCheck,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { InteractionTimeline } from "@/components/crm/InteractionTimeline";
import { RegistrarInteraccionModal } from "@/components/crm/RegistrarInteraccionModal";
import { formatCurrency } from "@/lib/format";

export default function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customerId = id as Id<"customers">;
  const router = useRouter();
  const role = useQuery(api.users.getCurrentUserRole);
  const ficha = useQuery(api.customers.getFicha, { customerId });
  const interactions = useQuery(api.interactions.listByCustomer, { customerId });
  // La oportunidad del modal se fija al abrirlo (no se recalcula en cada
  // render): si se derivara en cada render de `activeOpportunity` (más
  // abajo), y esa oportunidad se cerrara desde otra pestaña/sesión
  // mientras el modal sigue abierto, la siguiente oportunidad abierta
  // pasaría a ser la "activa" y el envío acabaría registrando la
  // interacción en una oportunidad distinta a la que el usuario veía en
  // pantalla, sin ningún aviso (ronda de auditoría 1, mayor #2).
  const [interactionOpportunityId, setInteractionOpportunityId] =
    useState<Id<"opportunities"> | null>(null);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deleteInteractionId, setDeleteInteractionId] =
    useState<Id<"interactions"> | null>(null);

  // Mismo criterio que app/oportunidades/[id]/page.tsx (ronda de auditoría
  // 1 de AIT-25, sugerencia #1): la Ficha de cliente también se alcanza
  // desde varias pantallas (Detalle, Pipeline...), no solo Hoy. Declarada
  // como function (hoisted): se usa también en la rama "no encontrado" más
  // abajo, antes de su definición textual.
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  if (ficha === undefined || interactions === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  if (ficha === null || interactions === null) {
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
            Ficha de cliente
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-text-secondary">Este cliente ya no existe.</p>
        </div>
      </main>
    );
  }

  const { customer, opportunities } = ficha;
  // La más reciente con `status === "open"` (la lista ya viene ordenada por
  // lastActivityAt desc desde customers.getFicha): el cliente puede tener
  // varias oportunidades, pero el modal solo cuelga la interacción de una.
  // Si no hay ninguna abierta, el botón queda deshabilitado más abajo — no
  // tiene sentido registrar una interacción sin oportunidad a la que
  // enganchar el próximo paso (regla 6, docs/02-modelo-de-datos.md §1).
  const activeOpportunity = opportunities.find((o) => o.status === "open") ?? null;

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
          Ficha de cliente
        </div>
        <a
          href={`tel:${customer.phone}`}
          aria-label="Llamar"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-primary hover:bg-primary-subtle"
        >
          <Phone size={18} />
        </a>
      </header>

      <div className="mx-auto flex max-w-[880px] flex-col gap-4 px-4 pb-24 pt-[18px]">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-e1)]">
          <div className="flex items-start gap-3.5">
            <Avatar name={customer.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[22px] font-bold tracking-tight">{customer.name}</h1>
            </div>
            <Badge variant="neutral" dot>
              {customer.source}
            </Badge>
          </div>

          <div className="mt-[18px] grid grid-cols-1 gap-x-[18px] gap-y-3 border-t border-border pt-[18px] sm:grid-cols-2">
            <div className="flex items-center gap-2 text-[13.5px] text-text-secondary">
              <Phone size={16} className="text-neutral-400" />
              <span className="whitespace-nowrap font-mono">{customer.phone}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-[13.5px] text-text-secondary">
              <Mail size={16} className="flex-none text-neutral-400" />
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {customer.email ?? "Sin email registrado"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[13.5px] text-text-secondary">
              <UserCheck size={16} className="text-neutral-400" />
              {customer.ownerName ?? "—"}
            </div>
            <div className="flex items-center gap-2 text-[13.5px] text-text-secondary">
              <Store size={16} className="text-neutral-400" />
              {customer.storeName ?? "—"}
            </div>
          </div>

          <div className="mt-[18px] flex flex-wrap items-center gap-2.5 border-t border-border pt-[18px]">
            <Button leftIcon={<Plus size={16} />} disabled title="Disponible próximamente">
              Nueva oportunidad
            </Button>
            <Button
              variant="secondary"
              leftIcon={<MessageSquare size={16} />}
              disabled={activeOpportunity === null}
              title={
                activeOpportunity === null
                  ? "Este cliente no tiene ninguna oportunidad abierta."
                  : undefined
              }
              onClick={() => {
                if (activeOpportunity) {
                  setInteractionOpportunityId(activeOpportunity.id);
                }
              }}
            >
              Registrar interacción
            </Button>
            {role === "owner" && (
              <>
                <span className="flex-1" />
                <Button
                  variant="danger"
                  leftIcon={<Trash2 size={16} />}
                  disabled={opportunities.length > 0}
                  title={
                    opportunities.length > 0
                      ? "No se puede eliminar: tiene oportunidades asociadas. Bórralas o reasígnalas primero."
                      : undefined
                  }
                  onClick={() => setDeleteCustomerOpen(true)}
                >
                  Eliminar cliente
                </Button>
              </>
            )}
          </div>
          <p className="mt-2.5 text-xs text-text-muted">
            Muy pronto podrás crear oportunidades desde aquí.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.25fr_1fr]">
          <section className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Oportunidades
              </span>
              <span className="rounded-pill bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                {opportunities.length}
              </span>
            </div>
            {opportunities.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin oportunidades todavía.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {opportunities.map((o) => (
                  <Link
                    key={o.id}
                    href={`/oportunidades/${o.id}`}
                    className="rounded-md border border-border p-3.5 transition-colors hover:border-border-strong hover:shadow-[var(--shadow-e1)]"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <span className="min-w-0 truncate text-[14.5px] font-semibold">
                        {o.interest ?? "Sin producto especificado"}
                      </span>
                      {o.estimatedAmount !== null && (
                        <span className="flex-none whitespace-nowrap font-mono text-sm font-semibold">
                          {formatCurrency(o.estimatedAmount)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <OpportunityStageBadge stage={o.stage} status={o.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface p-[18px_20px] shadow-[var(--shadow-e1)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Historial de interacciones
              </span>
            </div>
            <InteractionTimeline
              interactions={interactions}
              emptyMessage="Sin interacciones registradas todavía."
              canDelete={role === "owner"}
              onRequestDelete={setDeleteInteractionId}
            />
          </section>
        </div>
      </div>

      {interactionOpportunityId && (
        <RegistrarInteraccionModal
          open={interactionOpportunityId !== null}
          onClose={() => setInteractionOpportunityId(null)}
          opportunityId={interactionOpportunityId}
        />
      )}
      <DeleteCustomerDialog
        open={deleteCustomerOpen}
        onClose={() => setDeleteCustomerOpen(false)}
        customerId={customerId}
        customerName={customer.name}
      />
      <DeleteInteractionDialog
        interactionId={deleteInteractionId}
        onClose={() => setDeleteInteractionId(null)}
      />
    </main>
  );
}

// AIT-65: mismo patrón que los diálogos de borrado de
// app/oportunidades/[id]/page.tsx — confirmación con estado de
// carga/error inline. Al tener éxito, la ficha ya no existe: redirige al
// listado de clientes (AIT-58).
function DeleteCustomerDialog({
  open,
  onClose,
  customerId,
  customerName,
}: {
  open: boolean;
  onClose: () => void;
  customerId: Id<"customers">;
  customerName: string;
}) {
  const router = useRouter();
  const removeCustomer = useMutation(api.customers.remove);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setError("");
    onClose();
  }

  async function handleConfirm() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await removeCustomer({ customerId });
      router.push("/clientes");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo eliminando cliente:", err);
      }
      setError(
        err instanceof Error
          ? err.message
          : "No se ha podido eliminar el cliente. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={handleConfirm} disabled={loading}>
        {loading ? "Eliminando…" : "Eliminar cliente"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Eliminar cliente"
      description={`Vas a eliminar a ${customerName} de forma permanente. Esta acción no se puede deshacer.`}
      width={420}
      footer={footer}
    >
      {error && (
        <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{error}</div>
      )}
    </Dialog>
  );
}

// AIT-65: idéntico a DeleteInteractionDialog de
// app/oportunidades/[id]/page.tsx — se repite aquí (no se comparte)
// porque ambas páginas ya definen sus propios diálogos locales, mismo
// patrón que el resto de este proyecto (p.ej. ChangeStageDialog vive solo
// en la página de oportunidad, no se comparte con ninguna otra).
function DeleteInteractionDialog({
  interactionId,
  onClose,
}: {
  interactionId: Id<"interactions"> | null;
  onClose: () => void;
}) {
  const removeInteraction = useMutation(api.interactions.remove);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setError("");
    onClose();
  }

  async function handleConfirm() {
    if (loading || interactionId === null) return;
    setLoading(true);
    setError("");
    try {
      await removeInteraction({ interactionId });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo eliminando interacción:", err);
      }
      setError("No se ha podido eliminar la interacción. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={handleConfirm} disabled={loading}>
        {loading ? "Eliminando…" : "Eliminar interacción"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={interactionId !== null}
      onClose={handleClose}
      title="Eliminar interacción"
      description="Esta interacción se eliminará de forma permanente. Esta acción no se puede deshacer."
      width={420}
      footer={footer}
    >
      {error && (
        <div className="rounded-md bg-error-subtle p-3 text-sm text-error">{error}</div>
      )}
    </Dialog>
  );
}
