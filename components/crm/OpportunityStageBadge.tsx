type Stage = "contacto" | "presupuesto" | "negociacion";
type Status = "open" | "won" | "lost";

// Mapea (stage, status) del schema real a la paleta de pipeline del design
// system (Design/design-system/tokens/colors.css). El prototipo usa 6
// nombres de etapa ("contactado", "propuesta", "negociacion", "nuevo",
// "ganado", "perdido"); el schema solo tiene 3 etapas + status, según quedó
// resuelto en docs/02-modelo-de-datos.md §2 (opportunities). Won/lost no son
// etapas, son status — se muestran aparte de "negociacion".
const APPEARANCE: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  contacto: { label: "Contacto", bg: "#ECFEFF", fg: "#0E7490", dot: "var(--pipeline-contactado)" },
  presupuesto: { label: "Presupuesto", bg: "#EEF2FF", fg: "#4F46E5", dot: "var(--pipeline-propuesta)" },
  negociacion: {
    label: "Negociación",
    bg: "var(--color-warning-subtle)",
    fg: "#B45309",
    dot: "var(--pipeline-negociacion)",
  },
  won: {
    label: "Ganada",
    bg: "var(--color-success-subtle)",
    fg: "#15803D",
    dot: "var(--pipeline-ganado)",
  },
  lost: {
    label: "Perdida",
    bg: "var(--color-error-subtle)",
    fg: "#B91C1C",
    dot: "var(--pipeline-perdido)",
  },
};

export function OpportunityStageBadge({ stage, status }: { stage: Stage; status: Status }) {
  const appearance = APPEARANCE[status === "open" ? stage : status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-[3px] font-sans text-xs font-semibold leading-[1.4]"
      style={{ background: appearance.bg, color: appearance.fg }}
    >
      <span className="h-2 w-2 flex-none rounded-full" style={{ background: appearance.dot }} />
      {appearance.label}
    </span>
  );
}
