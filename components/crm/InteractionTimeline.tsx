import { Mail, MapPin, MessageCircle, Phone, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatDateTime } from "@/lib/format";

type InteractionType = "llamada" | "whatsapp" | "email" | "visita";

interface Interaction {
  id: Id<"interactions">;
  type: InteractionType;
  note: string;
  occurredAt: number;
  author: string;
}

const INTERACTION_META: Record<
  InteractionType,
  { label: string; icon: typeof Phone; bg: string; fg: string }
> = {
  llamada: { label: "Llamada", icon: Phone, bg: "var(--color-primary-subtle)", fg: "var(--color-primary)" },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    bg: "var(--color-secondary-subtle)",
    fg: "var(--color-secondary)",
  },
  email: { label: "Email", icon: Mail, bg: "var(--color-info-subtle)", fg: "var(--color-info)" },
  visita: { label: "Visita", icon: MapPin, bg: "var(--color-secondary-subtle)", fg: "var(--color-secondary)" },
};

interface InteractionTimelineProps {
  interactions: Interaction[];
  emptyMessage: string;
  // AIT-65: presentacional puro — no abre el diálogo de confirmación ni
  // llama a ninguna mutation. Cada página que usa este componente ya
  // conoce el rol y gestiona su propio diálogo de borrado; esto solo avisa
  // qué interacción se ha pedido borrar.
  canDelete?: boolean;
  onRequestDelete?: (interactionId: Id<"interactions">) => void;
}

export function InteractionTimeline({
  interactions,
  emptyMessage,
  canDelete = false,
  onRequestDelete,
}: InteractionTimelineProps) {
  if (interactions.length === 0) {
    return <p className="text-sm text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col">
      {interactions.map((h, i) => {
        const meta = INTERACTION_META[h.type];
        const Icon = meta.icon;
        const isLast = i === interactions.length - 1;
        return (
          <div key={h.id} className="flex gap-3">
            <div className="flex flex-none flex-col items-center">
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
                style={{ background: meta.bg, color: meta.fg }}
              >
                <Icon size={15} />
              </span>
              {!isLast && <span className="my-1 w-0.5 flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{meta.label}</div>
                  <div className="mt-0.5 text-[13px] text-text-secondary">{h.note}</div>
                  <div className="mt-1 font-mono text-xs text-text-muted">
                    {formatDateTime(h.occurredAt)} · {h.author}
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    aria-label="Eliminar interacción"
                    onClick={() => onRequestDelete?.(h.id)}
                    className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-error-subtle hover:text-error"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
