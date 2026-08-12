import { Badge } from "@/components/ui/Badge";

export type BillingStatus = "listo_para_facturar" | "facturado" | "cobrado";

// AIT-33: sin diseño de referencia para este indicador — el brief apunta
// al "StatusBadge" del design system (Design/design-system), pero esa
// librería no está integrada en la app (es material de prototipado, no un
// paquete importable aquí); se reutiliza el Badge propio de la app
// (components/ui/Badge.tsx) con la misma progresión de color que ya usa
// el resto del proyecto para estados con varios pasos: neutral (pendiente
// de acción) → info (en curso) → success (completado).
const BILLING_META: Record<
  BillingStatus,
  { label: string; variant: "neutral" | "info" | "success" }
> = {
  listo_para_facturar: { label: "Listo para facturar", variant: "neutral" },
  facturado: { label: "Facturado", variant: "info" },
  cobrado: { label: "Cobrado", variant: "success" },
};

export function BillingStatusBadge({ status }: { status: BillingStatus }) {
  const meta = BILLING_META[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}
