"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Mail, Phone, User, UserCheck, Store } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { parseEuroAmount } from "@/lib/format";

interface AltaRapidaModalProps {
  open: boolean;
  onClose: () => void;
}

const CANALES = ["Llamada", "WhatsApp", "Recomendación", "Web", "Visita"] as const;
type Canal = (typeof CANALES)[number];

// AIT-35 (Post-MVP): "Media" primero porque es el valor por defecto que
// también fija el servidor si no se manda priority (convex/opportunities.ts).
const PRIORIDADES = [
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "baja", label: "Baja" },
] as const;
type Prioridad = (typeof PRIORIDADES)[number]["value"];

export function AltaRapidaModal({ open, onClose }: AltaRapidaModalProps) {
  const router = useRouter();
  const userInfo = useQuery(api.users.getCurrentUserInfo, open ? {} : "skip");
  const createQuick = useMutation(api.opportunities.createQuick);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<Canal>(CANALES[0]);
  const [priority, setPriority] = useState<Prioridad>("media");
  const [interest, setInterest] = useState("");
  const [amount, setAmount] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  // Clave de idempotencia: una por cada apertura del modal, no por click.
  // Un reintento de red del MISMO envío reutiliza la misma clave (el
  // backend lo deduplica); abrir el modal de nuevo para otra oportunidad
  // genera una clave distinta (ronda de auditoría 2, mayor #2). Se ajusta
  // durante el render (no en un efecto) siguiendo el patrón que recomienda
  // React para "reaccionar a un cambio de prop" sin una vuelta extra de
  // renderizado: https://react.dev/learn/you-might-not-need-an-effect
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setClientRequestId(crypto.randomUUID());
  }

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setSource(CANALES[0]);
    setPriority("media");
    setInterest("");
    setAmount("");
    setNameError("");
    setPhoneError("");
    setAmountError("");
    setFormError("");
  }

  function handleClose() {
    if (loading) return;
    reset();
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

    const parsedAmount = parseEuroAmount(amount);
    if (parsedAmount === null) {
      setAmountError("Importe no válido. Usa un formato como 1250,50 o 1250.50.");
      hasError = true;
    } else {
      setAmountError("");
    }
    if (hasError) return;

    setFormError("");
    setLoading(true);
    try {
      const opportunityId = await createQuick({
        clientRequestId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        source,
        priority,
        interest: interest.trim() || undefined,
        estimatedAmount: parsedAmount ?? undefined,
      });
      reset();
      onClose();
      router.push(`/oportunidades/${opportunityId}`);
    } catch (err) {
      // Mensaje genérico al usuario a propósito (ronda de auditoría 1,
      // mayor #3): no exponer err.message, que puede filtrar detalles
      // internos de Convex/infraestructura. El detalle real solo en
      // consola, y solo fuera de producción.
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo creando oportunidad:", err);
      }
      setFormError("No se ha podido crear la oportunidad. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" form="alta-rapida-form" disabled={loading}>
        {loading ? "Creando…" : "Crear oportunidad"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Alta rápida"
      description="Captura el contacto y la oportunidad. Crearemos su primer próximo paso."
      width={480}
      footer={footer}
    >
      <form
        id="alta-rapida-form"
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
          placeholder="p.ej. Café Aroma"
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
              placeholder="600 000 000"
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
              label="Email (opcional)"
              placeholder="nombre@correo.com"
              leftIcon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[160px] flex-1">
            <Select
              label="Canal de origen"
              value={source}
              onChange={(e) => setSource(e.target.value as Canal)}
            >
              {CANALES.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[160px] flex-1">
            <Input
              label="Importe estimado (opcional)"
              placeholder="0,00"
              error={amountError}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <Select
          label="Prioridad"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Prioridad)}
        >
          {PRIORIDADES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>

        <Input
          label="Producto / interés (opcional)"
          placeholder="p.ej. Rediseño web"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-border bg-neutral-50 px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <UserCheck size={14} className="text-neutral-400" />
            Comercial: <b className="font-semibold text-text">{userInfo?.name ?? "…"}</b>
          </span>
          <span className="h-3.5 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <Store size={14} className="text-neutral-400" />
            Tienda: <b className="font-semibold text-text">{userInfo?.storeName ?? "…"}</b>
          </span>
        </div>
      </form>
    </Dialog>
  );
}
