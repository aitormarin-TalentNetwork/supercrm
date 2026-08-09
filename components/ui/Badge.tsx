import { ReactNode } from "react";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "error" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  primary: "bg-primary-subtle text-primary-hover",
  success: "bg-[var(--color-success-subtle)] text-[#15803D]",
  warning: "bg-[var(--color-warning-subtle)] text-[#B45309]",
  error: "bg-error-subtle text-[#B91C1C]",
  info: "bg-[var(--color-info-subtle)] text-[#0369A1]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ variant = "neutral", dot = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-[3px] font-sans text-[11px] font-semibold leading-[1.4] ${VARIANT_CLASSES[variant]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
