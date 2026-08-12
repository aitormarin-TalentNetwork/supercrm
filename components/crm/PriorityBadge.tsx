import { Flag } from "lucide-react";

type Priority = "alta" | "media" | "baja";

// AIT-35 (Post-MVP): indicador de PRIORIDAD manual (importancia decidida
// por el comercial/Marta), distinto del indicador de RIESGO automático
// (lib/risk.ts + AlertTriangle, por inactividad) — a propósito con icono
// (bandera) y paleta (azul/gris neutro) que no comparten nada con el
// ámbar/rojo de riesgo, para que nunca se confundan a simple vista aunque
// aparezcan juntos en el mismo encabezado.
const APPEARANCE: Record<Priority, { label: string; bg: string; fg: string }> = {
  alta: { label: "Prioridad alta", bg: "var(--color-primary-subtle)", fg: "var(--color-primary)" },
  media: { label: "Prioridad media", bg: "var(--color-neutral-100)", fg: "var(--color-neutral-600)" },
  // neutral-400 sobre neutral-50 daba ~2.45:1 (por debajo del mínimo AA de
  // 4.5:1 para texto normal, ronda de auditoría 1, mayor #2) — neutral-600
  // sobre el mismo fondo da ~7.25:1. Fondo sin cambios (no necesita
  // contraste); solo se oscurece el texto/icono.
  baja: { label: "Prioridad baja", bg: "var(--color-neutral-50)", fg: "var(--color-neutral-600)" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  // Defensivo: el servidor ya rellena "media" para oportunidades antiguas
  // sin priority guardado (getSummary/listOpen), pero este componente no
  // debe asumirlo — un despliegue en curso o un valor inesperado no puede
  // tumbar la página entera de Detalle de oportunidad.
  const appearance = APPEARANCE[priority] ?? APPEARANCE.media;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-[3px] font-sans text-xs font-semibold leading-[1.4]"
      style={{ background: appearance.bg, color: appearance.fg }}
    >
      <Flag size={11} className="flex-none" />
      {appearance.label}
    </span>
  );
}
