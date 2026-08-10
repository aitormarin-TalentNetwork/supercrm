"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Building2, Mail, MapPin, MessageCircle, Phone, Sparkles, Target, User } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Dialog } from "@/components/ui/Dialog";

type InteractionType = "llamada" | "whatsapp" | "email" | "visita";

const STAGE_LABEL: Record<"contacto" | "presupuesto" | "negociacion", string> = {
  contacto: "Contacto",
  presupuesto: "Presupuesto",
  negociacion: "Negociación",
};

const TYPE_ITEMS: { value: InteractionType; label: string; icon: React.ReactNode }[] = [
  { value: "llamada", label: "Llamada", icon: <Phone size={15} /> },
  { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={15} /> },
  { value: "email", label: "Email", icon: <Mail size={15} /> },
  { value: "visita", label: "Visita", icon: <MapPin size={15} /> },
];

// Sugerencia de partida al elegir tipo — igual que Design/pantallas/Registrar
// interacción.dc.html. Editable: quien registra la interacción puede
// cambiar el texto antes de guardar.
const SUGGESTED_ACTION_BY_TYPE: Record<InteractionType, string> = {
  llamada: "Llamar de seguimiento",
  whatsapp: "Enviar WhatsApp de seguimiento",
  email: "Enviar email de seguimiento",
  visita: "Agendar próxima visita",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function nowAsDatetimeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayPlusDaysAsDate(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface RegistrarInteraccionModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId: Id<"opportunities">;
}

export function RegistrarInteraccionModal({
  open,
  onClose,
  opportunityId,
}: RegistrarInteraccionModalProps) {
  const summary = useQuery(
    api.opportunities.getSummary,
    open ? { opportunityId } : "skip",
  );
  const userInfo = useQuery(api.users.getCurrentUserInfo, open ? {} : "skip");
  const create = useMutation(api.interactions.create);

  const [type, setType] = useState<InteractionType | null>(null);
  const [typeError, setTypeError] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => nowAsDatetimeLocal());
  const [nextStepAction, setNextStepAction] = useState("");
  const [nextStepDueDate, setNextStepDueDate] = useState(() => todayPlusDaysAsDate(3));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  // Clave de idempotencia: una por apertura del modal, no por click en
  // Guardar — un reintento del MISMO envío (Convex ya confirmó pero la
  // respuesta no llegó) reutiliza la misma clave, así el backend lo
  // deduplica en vez de duplicar la interacción y el próximo paso (ronda
  // de auditoría 1, mayor #1). Mismo patrón que AltaRapidaModal.
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());

  // Reinicia el formulario en cada apertura, sin un efecto aparte — mismo
  // patrón que AltaRapidaModal para "reaccionar" a que `open` pasó a true.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setType(null);
      setTypeError("");
      setNote("");
      setOccurredAt(nowAsDatetimeLocal());
      setNextStepAction("");
      setNextStepDueDate(todayPlusDaysAsDate(3));
      setFormError("");
      setClientRequestId(crypto.randomUUID());
    }
  }

  function handleClose() {
    if (loading) return;
    onClose();
  }

  function handleSelectType(value: string) {
    const next = value as InteractionType;
    setType(next);
    setTypeError("");
    setNextStepAction(SUGGESTED_ACTION_BY_TYPE[next]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (type === null) {
      setTypeError("Selecciona el tipo de interacción.");
      return;
    }
    const action = nextStepAction.trim();
    if (action.length === 0) {
      setFormError("La acción del próximo paso es obligatoria.");
      return;
    }
    const occurredAtMs = new Date(occurredAt).getTime();
    const nextStepDueDateMs = new Date(`${nextStepDueDate}T09:00:00`).getTime();
    if (!Number.isFinite(occurredAtMs) || !Number.isFinite(nextStepDueDateMs)) {
      setFormError("Revisa las fechas: alguna no es válida.");
      return;
    }

    setFormError("");
    setLoading(true);
    try {
      await create({
        clientRequestId,
        opportunityId,
        type,
        note: note.trim(),
        occurredAt: occurredAtMs,
        nextStepAction: action,
        nextStepDueDate: nextStepDueDateMs,
      });
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo registrando interacción:", err);
      }
      setFormError("No se ha podido registrar la interacción. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="registrar-interaccion-form" disabled={loading}>
        {loading ? "Guardando…" : "Guardar"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Registrar interacción"
      description="Deja constancia de lo que pasó con el cliente."
      width={480}
      footer={footer}
    >
      <form
        id="registrar-interaccion-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {formError && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">
            {formError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-neutral-50 px-3 py-2.5 text-[12.5px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={14} className="text-neutral-400" />
            <b className="font-semibold text-text">{summary?.customerName ?? "…"}</b>
          </span>
          <span className="h-3.5 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Target size={14} className="text-neutral-400" />
            {summary ? STAGE_LABEL[summary.stage] : "…"}
          </span>
          <span className="h-3.5 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <User size={14} className="text-neutral-400" />
            {userInfo?.name ?? "…"}
          </span>
        </div>

        <div>
          <div className="mb-2 text-[13px] font-semibold text-text-secondary">
            Tipo <span className="text-error">*</span>
          </div>
          <Tabs items={TYPE_ITEMS} value={type} onChange={handleSelectType} />
          {typeError && <div className="mt-1.5 text-xs text-error">{typeError}</div>}
        </div>

        <Textarea
          label="Nota / resultado"
          rows={3}
          placeholder="¿Qué ha pasado? p.ej. Interesado, pide ajustar el precio."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Input
          type="datetime-local"
          label="Fecha y hora"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />

        <div className="rounded-md border border-border bg-surface p-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[13px] font-semibold">Próximo paso sugerido</span>
            <span className="rounded-pill bg-primary-subtle px-2 py-px text-[11px] font-semibold text-primary">
              editable
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="min-w-[180px] flex-[2]">
              <Input
                label="Acción"
                value={nextStepAction}
                onChange={(e) => setNextStepAction(e.target.value)}
              />
            </div>
            <div className="min-w-[130px] flex-1">
              <Input
                type="date"
                label="Fecha"
                value={nextStepDueDate}
                onChange={(e) => setNextStepDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          Registro manual. La captura automática de WhatsApp, email y llamadas
          llegará más adelante.
        </p>
      </form>
    </Dialog>
  );
}
