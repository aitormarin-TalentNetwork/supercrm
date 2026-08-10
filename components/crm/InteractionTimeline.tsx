import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
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
}

export function InteractionTimeline({ interactions, emptyMessage }: InteractionTimelineProps) {
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
            <div className="min-w-0 pb-4">
              <div className="text-sm font-semibold">{meta.label}</div>
              <div className="mt-0.5 text-[13px] text-text-secondary">{h.note}</div>
              <div className="mt-1 font-mono text-xs text-text-muted">
                {formatDateTime(h.occurredAt)} · {h.author}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
