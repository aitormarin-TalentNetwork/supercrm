import { ReactNode, useEffect, useId, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Foco inicial al abrir + devolución del foco al elemento que abrió el
  // diálogo al cerrar (ronda de auditoría 1, sugerencia #9).
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? dialogRef.current)?.focus();
    return () => {
      previouslyFocused.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(15,23,42,.45)] p-4 font-sans"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        // flex-col + max-h (menos el p-4 del fondo) + scroll solo en el
        // cuerpo: en un viewport bajo, un formulario largo (p.ej. Registrar
        // interacción) dejaba el pie con Cancelar/Guardar fuera de la
        // pantalla y sin ningún scroll para alcanzarlo — bloqueaba guardar
        // con el puntero en un viewport válido (ronda de auditoría 1 de
        // AIT-25 ronda 2, mayor #1). El pie se queda siempre visible;
        // solo el cuerpo (título/descripción/contenido) hace scroll si no
        // cabe entero.
        className="flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-surface shadow-lg outline-none"
        style={{ maxWidth: width }}
      >
        <div className="overflow-y-auto p-6">
          {title && (
            <h2 id={titleId} className="m-0 text-xl font-bold text-text">
              {title}
            </h2>
          )}
          {description && (
            <p
              id={descriptionId}
              className="mt-2 text-sm leading-[1.55] text-text-secondary"
            >
              {description}
            </p>
          )}
          {children && (
            <div className={title || description ? "mt-5" : ""}>{children}</div>
          )}
        </div>
        {footer && (
          <div className="flex flex-none justify-end gap-3 border-t border-border bg-neutral-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
