"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Building2, Euro, Mail, Phone, User, UserCheck, Store } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { parseEuroAmount } from "@/lib/format";
import {
  CUSTOMER_SOURCES,
  type CustomerSource,
} from "@/lib/customerSource";
// AIT-82: qué es un cliente válido, en un solo sitio — las mismas funciones que
// aplica el servidor.
import {
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPhone,
} from "@/lib/customerValidation";

interface AltaRapidaModalProps {
  open: boolean;
  onClose: () => void;
  // AIT-74: con un cliente ya existente el diálogo es OTRO (el de
  // Design/pantallas/Ficha de cliente.dc.html:113): no se piden sus datos,
  // que es justo lo que no hay que volver a teclear. Sin esta prop, el
  // componente se comporta exactamente como siempre — es lo que siguen
  // usando QuickActions y el resto de pantallas.
  customer?: { id: Id<"customers">; name: string } | null;
}

// AIT-81: el desplegable se alimenta del MISMO catálogo que valida el
// servidor (`lib/customerSource.ts`). Antes esta lista era una copia, y una
// copia deja de coincidir en cuanto alguien toca solo un lado: el usuario
// elegiría un canal que la mutation rechaza, o al revés.

// Mismos valores que el schema (convex/schema.ts: opportunities.stage), con
// las etiquetas del diseño.
const ETAPAS = [
  { value: "contacto", label: "Contacto" },
  { value: "presupuesto", label: "Presupuesto" },
  { value: "negociacion", label: "Negociación" },
] as const;
type Etapa = (typeof ETAPAS)[number]["value"];

// AIT-35 (Post-MVP): "Media" primero porque es el valor por defecto que
// también fija el servidor si no se manda priority (convex/opportunities.ts).
const PRIORIDADES = [
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "baja", label: "Baja" },
] as const;
type Prioridad = (typeof PRIORIDADES)[number]["value"];

// Dos diálogos distintos, no uno con condicionales por dentro: comparten el
// nombre de la etiqueta pero no los campos, ni la mutation, ni la validación.
// Se elige por prop y no cambia a mitad de vida (cada sitio que lo usa sabe
// desde el principio si tiene cliente o no).
export function AltaRapidaModal({
  open,
  onClose,
  customer,
}: AltaRapidaModalProps) {
  if (customer) {
    return (
      <NuevaOportunidadClienteModal
        open={open}
        onClose={onClose}
        customer={customer}
      />
    );
  }
  return <AltaRapidaBlancoModal open={open} onClose={onClose} />;
}

// El alta rápida de siempre: cliente nuevo + oportunidad + primer próximo
// paso. Sin cambios de comportamiento en AIT-74.
function AltaRapidaBlancoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const userInfo = useQuery(api.users.getCurrentUserInfo, open ? {} : "skip");
  const createQuick = useMutation(api.opportunities.createQuick);
  // AIT-80: el camino "usa el cliente que ya existe" es exactamente el que
  // construyó AIT-74 — permisos en servidor, idempotencia, titularidad
  // heredada. No se reimplementa aquí: se llama.
  const createForCustomer = useMutation(api.opportunities.createForCustomer);
  // AIT-88: la puerta que guarda a la persona sin inventarle una venta.
  const createContact = useMutation(api.customers.createContact);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<CustomerSource>(CUSTOMER_SOURCES[0]);
  const [priority, setPriority] = useState<Prioridad>("media");
  // AIT-88: la elección EXPLÍCITA entre guardar solo el contacto o abrir además
  // una venta. Explícita y no inferida: nada de "si dejas el importe vacío,
  // adivino que no hay venta" — una decisión implícita es la que nadie recuerda
  // haber tomado. Va DENTRO del formulario, no antes de abrirlo (decisión del
  // PM): cuando Carlos apunta un teléfono en el mostrador, muchas veces no sabe
  // todavía si hay venta al pulsar el botón, y sí lo sabe mientras rellena.
  const [conVenta, setConVenta] = useState(true);
  const [interest, setInterest] = useState("");
  const [amount, setAmount] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  // AIT-82: antes este formulario no tenía error de email — no lo validaba.
  const [emailError, setEmailError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  // AIT-80: resultado de la detección de duplicado. `matches` son los
  // clientes que ESTE usuario puede ver (puede haber varios: la tabla
  // contiene duplicados anteriores a la issue); `otherOwnerMatch` dice solo
  // que existe alguno que no puede ver, sin decir cuántos ni de quién.
  const [duplicate, setDuplicate] = useState<{
    matches: { customerId: Id<"customers">; name: string }[];
    otherOwnerMatch: boolean;
  } | null>(null);
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

  // AIT-88: contacto y venta escriben en tablas de idempotencia distintas
  // (`customerRequests` vs `opportunityRequests`), así que son DOMINIOS
  // INDEPENDIENTES: la misma clave no cruza de uno a otro. Cambiar de intención
  // es OTRO envío, no un reintento del mismo, así que se regenera la clave.
  function cambiarModo(nuevoConVenta: boolean) {
    setConVenta(nuevoConVenta);
    setClientRequestId(crypto.randomUUID());
    setDuplicate(null);
  }

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setSource(CUSTOMER_SOURCES[0]);
    setPriority("media");
    setConVenta(true);
    setInterest("");
    setAmount("");
    setNameError("");
    setPhoneError("");
    setEmailError("");
    setAmountError("");
    setFormError("");
    setDuplicate(null);
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
    // AIT-82: las reglas salen de lib/customerValidation.ts, las mismas que
    // aplica el servidor.
    const nameError = validateCustomerName(name);
    setNameError(nameError ?? "");
    if (nameError) hasError = true;

    const phoneError = validateCustomerPhone(phone);
    setPhoneError(phoneError ?? "");
    if (phoneError) hasError = true;

    // AIT-82: este formulario NO validaba el email en cliente y el de edición
    // sí. Los dos lo rechazaban —manda el servidor— pero solo uno avisaba antes
    // de enviar; aquí volvía como error genérico del formulario, sin decir qué
    // campo era. Cambio de comportamiento declarado en el plan.
    const emailError = validateCustomerEmail(email);
    setEmailError(emailError ?? "");
    if (emailError) hasError = true;

    // AIT-88: el importe es de la venta. En modo contacto el campo no se
    // muestra, así que validarlo bloquearía por un valor que nadie puede ver
    // ni corregir.
    const parsedAmount = parseEuroAmount(amount);
    if (conVenta && parsedAmount === null) {
      setAmountError("Importe no válido. Usa un formato como 1250,50 o 1250.50.");
      hasError = true;
    } else {
      setAmountError("");
    }
    if (hasError) return;

    if (conVenta) {
      await submitQuick(parsedAmount ?? undefined, false);
    } else {
      await submitContacto(false);
    }
  }

  // AIT-88: guardar SOLO a la persona. No crea oportunidad, ni próximo paso, ni
  // registro de idempotencia de oportunidad — dos filas y solo dos.
  async function submitContacto(confirmDuplicate: boolean) {
    setFormError("");
    setLoading(true);
    try {
      const result = await createContact({
        clientRequestId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        source,
        confirmDuplicate,
      });
      if (result.status === "duplicate") {
        setDuplicate({
          matches: result.matches,
          otherOwnerMatch: result.otherOwnerMatch,
        });
        return;
      }
      reset();
      onClose();
      router.push(`/clientes/${result.customerId}`);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo creando el contacto:", err);
      }
      setFormError("No se ha podido guardar el contacto. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // AIT-88: en modo contacto, aceptar una coincidencia NO escribe nada. La
  // persona ya está guardada, que es lo que se quería: se abre su ficha. Es el
  // resultado útil y es explícitamente no mutante — a diferencia de "Usar este
  // cliente" en modo venta, que llama a `createForCustomer` y CREA una
  // oportunidad. Reutilizar aquel botón habría hecho que la vía creada para no
  // meter ventas en el pipeline metiera una.
  function abrirFichaExistente(customerId: Id<"customers">) {
    reset();
    onClose();
    router.push(`/clientes/${customerId}`);
  }

  // AIT-80. `confirmDuplicate` viaja al servidor: si la comprobación viviera
  // solo aquí, una llamada directa a la mutation crearía el duplicado
  // igualmente. La decisión la toma el backend; esto solo la muestra.
  async function submitQuick(
    estimatedAmount: number | undefined,
    confirmDuplicate: boolean,
  ) {
    setFormError("");
    setLoading(true);
    try {
      const result = await createQuick({
        clientRequestId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        source,
        priority,
        interest: interest.trim() || undefined,
        estimatedAmount,
        confirmDuplicate: confirmDuplicate ? true : undefined,
      });
      if (result.status === "duplicate") {
        setDuplicate({
          matches: result.matches,
          otherOwnerMatch: result.otherOwnerMatch,
        });
        return;
      }
      reset();
      onClose();
      router.push(`/oportunidades/${result.opportunityId}`);
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

  // "Usar este cliente": la oportunidad se cuelga del cliente que ya existe y
  // NO se toca la tabla de clientes. Reutiliza el mismo `clientRequestId`
  // porque el intento anterior no llegó a escribir nada (createQuick devolvió
  // el aviso antes de insertar), así que la clave sigue libre y este camino
  // hereda la misma idempotencia.
  async function createOnExistingCustomer(customerId: Id<"customers">) {
    if (loading) return;
    setFormError("");
    setLoading(true);
    try {
      const opportunityId = await createForCustomer({
        clientRequestId,
        customerId,
        interest: interest.trim() || undefined,
        estimatedAmount: parseEuroAmount(amount) ?? undefined,
        priority,
      });
      reset();
      onClose();
      router.push(`/oportunidades/${opportunityId}`);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo creando oportunidad sobre cliente existente:", err);
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
        {/* AIT-78 dejó dicho que la etiqueta describe el RESULTADO. AIT-88
                  lo mantiene: según el modo, lo que se produce es una
                  oportunidad o solo el contacto, y el botón lo dice. */}
              {loading
                ? conVenta
                  ? "Creando…"
                  : "Guardando…"
                : conVenta
                  ? "Crear oportunidad"
                  : "Guardar contacto"}
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

        {/* AIT-80: aviso INLINE, no un diálogo encima de otro. Es un aviso y
            nunca un bloqueo — dos personas pueden compartir teléfono (una
            pareja, una centralita), así que siempre queda la salida de crear
            uno nuevo igualmente. */}
        {duplicate && (
          <div className="flex flex-col gap-2.5 rounded-md bg-[var(--color-warning-subtle)] p-3 text-sm">
            <p className="font-semibold text-[#B45309]">
              Ya hay un cliente con este teléfono
            </p>

            {duplicate.matches.length > 0 && (
              <>
                <p className="text-text-secondary">
                  {conVenta
                    ? "Si es la misma persona, añade la oportunidad a su ficha en vez de crear otra: así su historial no queda partido en dos."
                    : "Esta persona ya está guardada. Puedes abrir su ficha en vez de crear otra igual."}
                </p>
                {/* Se listan TODOS los accesibles, del más antiguo al más
                    reciente. El orden es una ayuda visual, no una elección
                    hecha por nosotros: quien sabe cuál es la ficha buena para
                    seguir el historial es quien conoce el caso. */}
                <ul className="flex flex-col gap-1.5">
                  {duplicate.matches.map((match) => (
                    <li
                      key={match.customerId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-3 py-2"
                    >
                      <span className="font-medium text-text-primary">
                        {match.name}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          conVenta
                            ? createOnExistingCustomer(match.customerId)
                            : abrirFichaExistente(match.customerId)
                        }
                        disabled={loading}
                      >
                        {conVenta ? "Usar este cliente" : "Abrir su ficha"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Texto CONSTANTE: ni plural, ni recuento, ni de quién es. Un
                comercial no puede ver los clientes de otro, así que de un
                match ajeno no sale nada más que su existencia — y ese
                teléfono ya lo conocía, lo acaba de teclear. Sin este aviso,
                dos comerciales trabajarían al mismo cliente sin saberlo. */}
            {duplicate.otherOwnerMatch && (
              <p className="text-text-secondary">
                Ese teléfono ya está registrado en la tienda, en una ficha que
                no gestionas tú. No podemos mostrártela ni asignarte su
                oportunidad. Si crees que es la misma persona, coméntalo con la
                dueña antes de seguir.
              </p>
            )}

            <div>
              {/* AIT-88 — EL BOTÓN VA POR MODO, como el envío principal. Este
                  aviso es el mismo para las dos vías, pero lo que ejecuta al
                  aceptarlo NO: `submitQuick` crea cliente + oportunidad +
                  próximo paso, y en modo contacto eso es precisamente lo que
                  la issue viene a evitar. Llamarlo aquí metería en el pipeline
                  la venta inventada por la única puerta que había prometido no
                  inventarla — y encima solo a quien tropieza con un duplicado,
                  que es el camino menos mirado. */}
              <Button
                variant="secondary"
                onClick={() =>
                  conVenta
                    ? submitQuick(parseEuroAmount(amount) ?? undefined, true)
                    : submitContacto(true)
                }
                disabled={loading}
              >
                Crear uno nuevo igualmente
              </Button>
            </div>
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
              onChange={(e) => {
                setPhone(e.target.value);
                // El aviso es sobre el teléfono anterior: al cambiarlo deja
                // de ser cierto, y dejarlo puesto haría que el usuario
                // decidiera sobre datos viejos.
                setDuplicate(null);
              }}
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <Input
              type="email"
              label="Email (opcional)"
              placeholder="nombre@correo.com"
              leftIcon={<Mail size={16} />}
              error={emailError}
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
              onChange={(e) => setSource(e.target.value as CustomerSource)}
            >
              {CUSTOMER_SOURCES.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </Select>
          </div>
          {conVenta && (
          <div className="min-w-[160px] flex-1">
            <Input
              label="Importe estimado (opcional)"
              placeholder="0,00"
              error={amountError}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          )}
        </div>

        {/* AIT-88: el control explícito. Va aquí, después de los datos de la
            persona y antes de los de la venta, porque es lo que decide si esos
            de abajo tienen sentido. Un `Select` y no un interruptor: dice en
            palabras qué hace cada opción, y "guardar solo el contacto" tiene
            que poder leerse, no deducirse de una casilla apagada. */}
        <Select
          label="¿Hay una venta en marcha?"
          value={conVenta ? "si" : "no"}
          onChange={(e) => cambiarModo(e.target.value === "si")}
        >
          <option value="si">Sí, abre una oportunidad</option>
          <option value="no">No, guarda solo el contacto</option>
        </Select>

        {conVenta && (
          <>
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
          </>
        )}

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

// AIT-74: alta contextualizada a un cliente que ya existe
// (Design/pantallas/Ficha de cliente.dc.html:113). No pide nombre, teléfono,
// email ni canal — se heredan del cliente — y llama a createForCustomer, que
// NO inserta ningún cliente.
function NuevaOportunidadClienteModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer: { id: Id<"customers">; name: string };
}) {
  const router = useRouter();
  const createForCustomer = useMutation(api.opportunities.createForCustomer);

  const [interest, setInterest] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Etapa>("contacto");
  const [interestError, setInterestError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  // Misma clave de idempotencia por apertura del modal que el alta rápida:
  // un reintento de red del mismo envío no duplica la oportunidad.
  const [clientRequestId, setClientRequestId] = useState(() =>
    crypto.randomUUID(),
  );
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setClientRequestId(crypto.randomUUID());
  }

  function reset() {
    setInterest("");
    setAmount("");
    setStage("contacto");
    setInterestError("");
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
    // Obligatorio aquí (el diseño lo marca `required` en este diálogo) y
    // opcional en el alta rápida: allí el dato que identifica la oportunidad
    // es el cliente recién capturado; aquí el cliente ya se conoce, y sin
    // interés la oportunidad nueva sería indistinguible de las que ya tiene.
    if (!interest.trim()) {
      setInterestError("El producto o interés es obligatorio.");
      hasError = true;
    } else {
      setInterestError("");
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
      const opportunityId = await createForCustomer({
        clientRequestId,
        customerId: customer.id,
        interest: interest.trim(),
        estimatedAmount: parsedAmount ?? undefined,
        stage,
      });
      reset();
      onClose();
      router.push(`/oportunidades/${opportunityId}`);
    } catch (err) {
      // Mensaje genérico a propósito, igual que en el alta rápida: no
      // exponer err.message, que puede filtrar detalles internos.
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo creando oportunidad para el cliente:", err);
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
      <Button
        type="submit"
        form="nueva-oportunidad-cliente-form"
        disabled={loading}
      >
        {loading ? "Creando…" : "Crear oportunidad"}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva oportunidad"
      description={`Para ${customer.name}. Se creará con su primer próximo paso.`}
      width={460}
      footer={footer}
    >
      <form
        id="nueva-oportunidad-cliente-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5"
      >
        {formError && (
          <div className="rounded-md bg-error-subtle p-3 text-sm text-error">
            {formError}
          </div>
        )}

        <div className="flex items-center gap-2.5 rounded-md border border-border bg-neutral-50 px-3.5 py-2.5">
          <Building2 size={16} className="flex-none text-neutral-400" />
          <span className="min-w-0 truncate text-sm font-semibold">
            {customer.name}
          </span>
        </div>

        <Input
          label="Producto / interés"
          placeholder="p.ej. Mantenimiento anual"
          error={interestError}
          required
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[150px] flex-1">
            <Input
              label="Importe estimado (opcional)"
              placeholder="0,00"
              leftIcon={<Euro size={16} />}
              error={amountError}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="min-w-[150px] flex-1">
            <Select
              label="Etapa"
              value={stage}
              onChange={(e) => setStage(e.target.value as Etapa)}
            >
              {ETAPAS.map((etapa) => (
                <option key={etapa.value} value={etapa.value}>
                  {etapa.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
