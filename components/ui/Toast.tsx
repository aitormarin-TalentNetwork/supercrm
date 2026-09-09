import { ReactNode } from "react";

// Portado de Design/design-system/components/feedback/Toast.jsx (AIT-83).
// Presentacional puro, como el original: no decide cuándo se muestra ni se
// cierra solo. Se traducen sus estilos inline a Tailwind + tokens, que es la
// convención del proyecto para los componentes ya portados (ver Badge.tsx).
//
// Única adición sobre el original: la ranura `action`. El design system define
// Toast con title/message/onClose y sin acción, pero AIT-83 exige "aviso
// discreto CON opción de recargar" como criterio de aceptación. Se añade como
// ranura opcional en vez de meter un botón dentro de `message`, para que el
// componente siga siendo reutilizable y la acción tenga su sitio.

type ToastVariant = "success" | "warning" | "error" | "info";

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
  error: "bg-error-subtle text-error",
  info: "bg-[var(--color-info-subtle)] text-[var(--color-info)]",
};

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: "M20 6 9 17l-5-5",
  warning: "M12 9v4m0 4h.01",
  error: "M18 6 6 18M6 6l12 12",
  info: "M12 16v-4m0-4h.01",
};

interface ToastProps {
  variant?: ToastVariant;
  title?: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
}

export function Toast({
  variant = "info",
  title,
  message,
  action,
  onClose,
}: ToastProps) {
  return (
    <div
      role="status"
      className="flex w-[360px] max-w-full items-start gap-3 rounded-lg border border-border bg-surface p-[12px_14px] font-sans shadow-[var(--shadow-e2)]"
    >
      <span
        className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-md ${VARIANT_CLASSES[variant]}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={VARIANT_ICON[variant]} />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        {title && (
          <div className="text-sm font-semibold text-text">{title}</div>
        )}
        {message && (
          <div
            className={`text-[13px] leading-[1.5] text-text-secondary ${title ? "mt-0.5" : ""}`}
          >
            {message}
          </div>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-m-2 flex-none p-2 text-neutral-400 hover:text-text-secondary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
