"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  Store,
  UserCheck,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OpportunityStageBadge } from "@/components/crm/OpportunityStageBadge";
import { formatCurrency, formatDateTime } from "@/lib/format";

const INTERACTION_META: Record<
  "llamada" | "whatsapp" | "email" | "visita",
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

export default function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customerId = id as Id<"customers">;
  const ficha = useQuery(api.customers.getFicha, { customerId });
  const interactions = useQuery(api.interactions.listByCustomer, { customerId });

  if (ficha === undefined || interactions === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  if (ficha === null || interactions === null) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 font-sans">
        <p className="text-text-secondary">Cliente no encontrado o sin acceso.</p>
      </main>
    );
  }

  const { customer, opportunities } = ficha;

  return (
    <main className="flex flex-1 flex-col bg-bg font-sans text-text">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <Link
          href="/hoy"
          aria-label="Volver"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Ficha de cliente
        </div>
        <a
          href={`tel:${customer.phone}`}
          aria-label="Llamar"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-primary hover:bg-primary-subtle"
        >
          <Phone size={18} />
        </a>
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
              <span className="whitespace-nowrap font-mono">{customer.phone}</span>
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
            <Button leftIcon={<Plus size={16} />} disabled title="Disponible próximamente">
              Nueva oportunidad
            </Button>
            <Button
              variant="secondary"
              leftIcon={<MessageSquare size={16} />}
              disabled
              title="Disponible próximamente"
            >
              Registrar interacción
            </Button>
          </div>
          <p className="mt-2.5 text-xs text-text-muted">
            Muy pronto podrás crear oportunidades y registrar interacciones desde aquí.
          </p>
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
            {interactions.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin interacciones registradas todavía.</p>
            ) : (
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
                          {formatDateTime(h.occurredAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
