"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Mail,
  Pencil,
  Phone,
  Plus,
  Store,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { InteractionTimeline } from "@/components/crm/InteractionTimeline";
import { AltaRapidaModal } from "@/components/crm/AltaRapidaModal";
import { QuickActions } from "@/components/nav/QuickActions";
import { formatCurrency } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

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
  const [editarClienteOpen, setEditarClienteOpen] = useState(false);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [nuevaOportunidadOpen, setNuevaOportunidadOpen] = useState(false);
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
            // AIT-71: h-11 w-11 (44px, --tap-min), no h-[38px] w-[38px].
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100"
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
  // Si no hay ninguna abierta, se pasa `null` a QuickActions en la
  // cabecera, que abre su Dialog informativo en vez del modal real — no
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
          // AIT-71: h-11 w-11 (44px, --tap-min), no h-[38px] w-[38px].
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Ficha de cliente
        </div>
        <div className="ml-auto flex flex-none items-center gap-2">
          <QuickActions registrarInteraccionOpportunityId={activeOpportunity?.id ?? null} />
          <a
            href={`tel:${customer.phone}`}
            aria-label="Llamar"
            // AIT-71: h-11 w-11 (44px, --tap-min), no h-10 w-10.
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-primary hover:bg-primary-subtle"
          >
            <Phone size={18} />
          </a>
        </div>
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
              {/* AIT-80: `phone` se almacena canónico, así que se formatea en
                  el último paso antes de pintarlo. El `tel:` de la cabecera NO
                  se formatea a propósito (docs/02-modelo-de-datos.md): los
                  dígitos pelados son válidos y mejores para marcar. */}
              <span className="whitespace-nowrap font-mono">
                {formatPhone(customer.phone)}
              </span>
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
            {/* AIT-74: la etiqueta dice "para este cliente" porque el "+" de
                la cabecera (QuickActions) se llama también "Nueva
                oportunidad" y crea un cliente NUEVO. Con los dos activos y
                el mismo nombre, la pantalla sería más ambigua que antes. La
                normalización de las tres instancias de la etiqueta es
                AIT-78; esto solo evita empeorar mientras tanto. */}
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => setNuevaOportunidadOpen(true)}
            >
              Nueva oportunidad para este cliente
            </Button>
            {/* AIT-77: sin condición de rol, a diferencia de "Eliminar
                cliente". `customers.update` comparte guarda con
                `customers.getFicha`, así que quien está viendo esta ficha es
                exactamente quien puede editarla — filtrar por rol aquí dejaría
                fuera a `sales` sobre sus propios clientes, que es el caso de uso
                que origina la tarea. */}
            <Button
              variant="ghost"
              leftIcon={<Pencil size={16} />}
              onClick={() => setEditarClienteOpen(true)}
            >
              Editar
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

      <AltaRapidaModal
        open={nuevaOportunidadOpen}
        onClose={() => setNuevaOportunidadOpen(false)}
        customer={{ id: customerId, name: customer.name }}
      />
      <EditarClienteDialog
        open={editarClienteOpen}
        onClose={() => setEditarClienteOpen(false)}
        customerId={customerId}
        customer={customer}
      />
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

// AIT-77: mismos cinco canales que el Select del Alta rápida
// (components/crm/AltaRapidaModal.tsx) y que el union que valida
// convex/customers.ts::update en servidor. Tercera copia del catálogo, a
// propósito y con fecha: AIT-81 lo centraliza y elimina las tres.
const CANALES = ["Llamada", "WhatsApp", "Recomendación", "Web", "Visita"] as const;

// AIT-77: editar los datos del cliente desde su propia ficha. Diálogo local,
// como DeleteCustomerDialog y DeleteInteractionDialog aquí mismo — este
// proyecto define los diálogos en la página que los usa y no los comparte.
// La validación de aquí es un espejo de la del servidor para dar el error al
// lado del campo; la que manda es la de convex/customers.ts::update.
function EditarClienteDialog({
  open,
  onClose,
  customerId,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customerId: Id<"customers">;
  customer: { name: string; phone: string; email: string | null; source: string };
}) {
  const updateCustomer = useMutation(api.customers.update);
  const [name, setName] = useState(customer.name);
  // AIT-80: `customer.phone` viene canónico (solo dígitos). Se precarga
  // formateado, aquí y en la reinicialización al abrir — las DOS, o el diálogo
  // se comportaría distinto la primera vez que las siguientes. Sin esto, el
  // usuario abre el formulario y ve su teléfono "estropeado" a dígitos pelados.
  // El viaje de vuelta es estable: la mutation vuelve a normalizar al guardar.
  const [phone, setPhone] = useState(formatPhone(customer.phone));
  const [email, setEmail] = useState(customer.email ?? "");
  const [source, setSource] = useState(customer.source);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // El diálogo NO se desmonta al cerrarse: la página lo renderiza siempre y es
  // Dialog quien devuelve null por dentro. Sin esto, un borrador que el usuario
  // canceló seguiría en el estado local y se enviaría en la siguiente edición
  // —modificaría datos que nadie pidió cambiar, justo lo contrario de lo que
  // esta pantalla viene a arreglar—, y además taparía cualquier cambio llegado
  // por la query reactiva mientras estaba cerrado. Se ajusta durante el render
  // y no en un efecto, mismo patrón y misma razón que el clientRequestId de
  // AltaRapidaModal: https://react.dev/learn/you-might-not-need-an-effect
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(customer.name);
      setPhone(formatPhone(customer.phone));
      setEmail(customer.email ?? "");
      setSource(customer.source);
      setNameError("");
      setPhoneError("");
      setEmailError("");
      setSourceError("");
      setFormError("");
    }
  }

  // Un cliente con un canal fuera del catálogo no debería existir (el schema lo
  // declara `v.string()` libre, pero los dos escritores validan el union), y si
  // existiera, un <select> sin la <option> correspondiente NO mostraría ese
  // valor: caería en la primera opción y guardar reescribiría el canal en
  // silencio. Se pinta el valor real como opción no seleccionable y se bloquea
  // el envío hasta elegir uno válido. AIT-81 cierra la causa.
  const canalFueraDeCatalogo = !(CANALES as readonly string[]).includes(source);

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    let hasError = false;
    if (!name.trim()) {
      setNameError("El nombre es obligatorio.");
      hasError = true;
    } else {
      setNameError("");
    }
    if (!phone.trim()) {
      setPhoneError("El teléfono es obligatorio.");
      hasError = true;
    } else if (!/^[\d\s+()-]+$/.test(phone.trim())) {
      setPhoneError("El teléfono solo puede tener números y separadores.");
      hasError = true;
    } else if (phone.replace(/\D/g, "").length < 9) {
      setPhoneError("Introduce un teléfono válido (9 dígitos).");
      hasError = true;
    } else if (phone.replace(/\D/g, "").length > 15) {
      setPhoneError("El teléfono es demasiado largo.");
      hasError = true;
    } else {
      setPhoneError("");
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("El email no tiene un formato válido.");
      hasError = true;
    } else {
      setEmailError("");
    }
    if (canalFueraDeCatalogo) {
      setSourceError("Este canal ya no está en el catálogo. Elige uno de la lista.");
      hasError = true;
    } else {
      setSourceError("");
    }
    if (hasError) return;

    setFormError("");
    setLoading(true);
    try {
      await updateCustomer({
        customerId,
        name: name.trim(),
        phone: phone.trim(),
        // Vacío significa vacío: se manda `undefined` y el servidor borra el
        // campo. Un email equivocado es peor que ninguno.
        email: email.trim() || undefined,
        source: source as (typeof CANALES)[number],
      });
      onClose();
    } catch (err) {
      // Mensaje genérico al usuario, mismo criterio que el resto de modales: no
      // exponer err.message, que puede filtrar detalles internos de Convex.
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo editando cliente:", err);
      }
      setFormError("No se han podido guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="editar-cliente-form" disabled={loading}>
        {loading ? "Guardando…" : "Guardar cambios"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Editar cliente"
      description="Corrige los datos de contacto. Sus oportunidades e interacciones no se tocan."
      width={480}
      footer={footer}
    >
      <form
        id="editar-cliente-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5"
      >
        {formError && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">
            {formError}
          </div>
        )}

        <Input
          label="Nombre del cliente"
          leftIcon={<User size={16} />}
          error={nameError}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[160px] flex-1">
            <Input
              type="tel"
              label="Teléfono"
              leftIcon={<Phone size={16} />}
              error={phoneError}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <Input
              type="email"
              label="Email"
              hint="Puedes dejarlo vacío para quitarlo."
              leftIcon={<Mail size={16} />}
              error={emailError}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <Select
          label="Canal de origen"
          error={sourceError}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {canalFueraDeCatalogo && (
            <option value={source} disabled>
              {source} (fuera del catálogo)
            </option>
          )}
          {CANALES.map((canal) => (
            <option key={canal} value={canal}>
              {canal}
            </option>
          ))}
        </Select>
      </form>
    </Dialog>
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
