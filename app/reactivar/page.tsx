"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Clock, Phone, RefreshCw, Repeat } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { BUSINESS_TIME_ZONE } from "@/lib/businessTime";

// No se reutiliza lib/format.ts:formatDate: esa función formatea en la
// zona horaria local del navegador (pensada para fechas introducidas por
// el usuario en un <input type="date">, que ya nacen en su propia zona).
// dueDate aquí es un instante calculado a propósito a medianoche de
// Europe/Madrid (addBusinessMonths, convex/opportunities.ts) — formatearlo
// en la zona del navegador puede mostrar el día anterior o siguiente para
// quien mire la pantalla desde otro huso horario (visto en pruebas reales:
// un navegador en America/Sao_Paulo mostraba un día antes).
function formatReminderDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: BUSINESS_TIME_ZONE,
  });
}

type ReminderItem = {
  id: Id<"repurchaseReminders">;
  customerId: Id<"customers">;
  customerName: string;
  customerPhone: string;
  dueDate: number;
  isOverdue: boolean;
};

// Misma tarjeta con "área navegable + botones por encima" que
// app/hoy/page.tsx:NextStepCard — no se reutiliza el componente porque
// esta tarjeta enlaza a la Ficha de cliente (historial de compras), no a
// una oportunidad, y sus acciones son otras (contactado/posponer, no
// hecho/posponer/registrar).
function ReminderCard({ item }: { item: ReminderItem }) {
  const markContacted = useMutation(api.repurchaseReminders.markContacted);
  const postpone = useMutation(api.repurchaseReminders.postpone);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");

  async function handleContacted() {
    if (acting) return;
    setActing(true);
    setActionError("");
    try {
      await markContacted({ reminderId: item.id });
    } catch {
      setActionError(
        "No se ha podido marcar como contactado. Inténtalo de nuevo.",
      );
    } finally {
      setActing(false);
    }
  }

  async function handlePostpone() {
    if (acting) return;
    setActing(true);
    setActionError("");
    try {
      await postpone({ reminderId: item.id });
    } catch {
      setActionError("No se ha podido posponer. Inténtalo de nuevo.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div
      className={`relative rounded-lg border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md ${
        item.isOverdue
          ? "border-l-[3px] border-l-error border-border"
          : "border-border"
      }`}
    >
      <Link
        href={`/clientes/${item.customerId}`}
        aria-label={`Ver ficha de ${item.customerName}`}
        className="absolute inset-0 z-0 rounded-lg"
      />
      <div className="min-w-0">
        <span className="truncate text-[15px] font-semibold text-text">
          {item.customerName}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
              item.isOverdue ? "text-error" : "text-text-muted"
            }`}
          >
            <Clock size={14} />
            {formatReminderDate(item.dueDate)}
          </span>
          {item.isOverdue && (
            <Badge variant="error" dot>
              Recompra vencida
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Phone size={14} />}
          onClick={handleContacted}
          disabled={acting}
          className="relative z-10"
        >
          Contactado
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={handlePostpone}
          disabled={acting}
          className="relative z-10"
        >
          Posponer
        </Button>
      </div>
      {actionError && (
        <p className="relative z-10 mt-2 text-xs font-medium text-error">
          {actionError}
        </p>
      )}
    </div>
  );
}

// AIT-30: pantalla propia en vez de una sección más dentro de "Hoy"
// (app/hoy/page.tsx). Decisión documentada en el export para el auditor:
// Hoy es un fichero con mucho tráfico de cambios entre terminales en este
// proyecto (AIT-16/18/19/25/27...) y es exclusivo de sales (redirige a
// Marta a /panel) — pero un recordatorio de recompra interesa también a
// Marta (fidelización es una métrica de negocio, no solo una tarea de
// comercial). Una pantalla propia, accesible desde ambas, evita acoplar
// esta feature al ciclo de vida de Hoy y sirve a los dos roles con la
// misma query (listToReactivate ya filtra por rol). Se sigue el patrón
// visual de la lista de próximos pasos de Hoy (tarjeta con área navegable
// + botones de acción superpuestos), tal como pide el brief.
export default function ReactivarPage() {
  const router = useRouter();
  const role = useQuery(api.users.getCurrentUserRole);
  const items = useQuery(api.repurchaseReminders.listToReactivate);
  const isStoreWide = role === "owner" || role === "storeManager";

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const vencidos = items?.filter((item) => item.isOverdue) ?? [];
  const proximos = items?.filter((item) => !item.isOverdue) ?? [];

  if (role === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text lg:flex-row">
      {isStoreWide && <AppSidebar />}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-none items-center gap-3 border-b border-border bg-surface px-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100"
          >
            <RefreshCw size={18} />
          </button>
          <div>
            <h1 className="m-0 text-[17px] font-bold tracking-tight">
              Clientes a reactivar
            </h1>
            <p className="text-[12px] text-text-muted">
              Recordatorios de recompra tras una venta ganada
            </p>
          </div>
        </header>

        <div
          className={`flex-1 overflow-y-auto px-4 py-5 ${isStoreWide ? "pb-10" : "pb-24"}`}
        >
          {items === undefined && (
            <p className="text-text-secondary">Cargando…</p>
          )}

          {items !== undefined && items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Repeat size={32} className="text-text-muted" />
              <div>
                <p className="text-base font-semibold text-text">
                  Sin clientes pendientes de reactivar
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Cuando ganes una oportunidad, se programa aquí su recordatorio
                  de recompra.
                </p>
              </div>
            </div>
          )}

          {vencidos.length > 0 && (
            <section className="mb-6">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[13px] font-bold uppercase tracking-wide text-error">
                  Vencidos
                </span>
                <span className="rounded-pill bg-error-subtle px-2.5 py-0.5 text-xs font-bold text-error">
                  {vencidos.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {vencidos.map((item) => (
                  <ReminderCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {proximos.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[13px] font-bold uppercase tracking-wide text-text-secondary">
                  Próximos
                </span>
                <span className="rounded-pill bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-text-secondary">
                  {proximos.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {proximos.map((item) => (
                  <ReminderCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {!isStoreWide && <BottomTabBar />}
    </div>
  );
}
