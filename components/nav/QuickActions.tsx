"use client";

import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { AltaRapidaModal } from "@/components/crm/AltaRapidaModal";
import { RegistrarInteraccionModal } from "@/components/crm/RegistrarInteraccionModal";

interface QuickActionsProps {
  // Oportunidad en contexto en ESTA pantalla, si la hay. Con id real, "Registrar
  // interacción" abre RegistrarInteraccionModal con ella; undefined/null abre
  // el Dialog informativo en su lugar (decisión de producto AIT-66/PM: sin
  // selector, sin flujo nuevo — el botón nunca queda `disabled`, ver AIT-66
  // ronda 3 de auditoría: un `disabled` no comunica nada en táctil/teclado).
  registrarInteraccionOpportunityId?: Id<"opportunities"> | null;
}

const ICON_BUTTON_CLASS =
  "inline-flex h-11 w-11 flex-none items-center justify-center rounded-md border border-border bg-surface text-text-secondary hover:bg-neutral-100";

// AIT-66: "+ Nuevo" y "+ Registrar interacción" accesibles desde cualquier
// pantalla, reutilizando los mismos modales que ya usaban Hoy/Pipeline/Ficha
// de cliente/Detalle de oportunidad — sin construir ningún formulario nuevo.
// Icon-only y 44×44 siempre (sin variante con texto ni breakpoints): es el
// único diseño que cabe sin ambigüedad en las cabeceras `h-14` más
// apretadas a 390px (hallazgo de auditoría, ronda 2 — M4).
export function QuickActions({
  registrarInteraccionOpportunityId,
}: QuickActionsProps) {
  const [altaOpen, setAltaOpen] = useState(false);
  // Se fija al pulsar el botón, no se deriva en cada render de la prop —
  // si se leyera la prop directamente en el render del modal y la
  // oportunidad se cerrara desde otra pestaña/sesión mientras el modal
  // sigue abierto, el envío podría acabar registrando la interacción en
  // una oportunidad distinta a la que el usuario veía al abrirlo (mismo
  // hallazgo de auditoría ya corregido en AIT-25/Ficha de cliente y
  // Detalle de oportunidad — se preserva aquí al centralizar el botón).
  const [pinnedOpportunityId, setPinnedOpportunityId] =
    useState<Id<"opportunities"> | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  function handleRegistrarClick() {
    if (registrarInteraccionOpportunityId) {
      setPinnedOpportunityId(registrarInteraccionOpportunityId);
    } else {
      setInfoOpen(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAltaOpen(true)}
        aria-label="Nueva oportunidad"
        title="Nueva oportunidad"
        className={ICON_BUTTON_CLASS}
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        onClick={handleRegistrarClick}
        aria-label="Registrar interacción"
        title="Registrar interacción"
        className={ICON_BUTTON_CLASS}
      >
        <MessageSquare size={18} />
      </button>

      <AltaRapidaModal open={altaOpen} onClose={() => setAltaOpen(false)} />

      {pinnedOpportunityId && (
        <RegistrarInteraccionModal
          open={pinnedOpportunityId !== null}
          onClose={() => setPinnedOpportunityId(null)}
          opportunityId={pinnedOpportunityId}
        />
      )}

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Registrar interacción"
        footer={
          <Button onClick={() => setInfoOpen(false)}>Entendido</Button>
        }
      >
        <p className="text-sm text-text-secondary">
          Para registrar una interacción hace falta una oportunidad abierta.
          Ábrela desde la ficha del cliente o la propia oportunidad.
        </p>
      </Dialog>
    </>
  );
}
