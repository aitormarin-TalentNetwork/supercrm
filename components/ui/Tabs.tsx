import { KeyboardEvent, ReactNode, useRef } from "react";

interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string | null;
  onChange: (value: string) => void;
}

// Navegación con flechas (ronda de auditoría 2, sugerencia #1): patrón
// ARIA de "tablist" con foco itinerante (roving tabindex) — solo la
// pestaña seleccionada (o la primera si aún no hay ninguna) es alcanzable
// con Tab; ← → Inicio Fin mueven el foco Y la selección entre pestañas
// ("activación automática", igual que ya hace un click). Sin
// aria-controls/tabpanel: en los usos actuales (p.ej. el tipo de
// interacción en RegistrarInteraccionModal) Tabs se usa como selector de
// una sola opción, no para mostrar paneles de contenido distintos por
// pestaña — fabricar un tabpanel vacío sería más confuso que útil.
export function Tabs({ items, value, onChange }: TabsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = items.length - 1;
    if (nextIndex === null) return;

    e.preventDefault();
    onChange(items[nextIndex].value);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div role="tablist" className="flex gap-1 border-b border-border font-sans">
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
