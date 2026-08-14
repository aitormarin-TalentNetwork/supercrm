"use client";

import { Menu } from "lucide-react";
import { useNav } from "./NavContext";

// AIT-51: botón ☰ que abre el panel de navegación (AppNav) — el mismo
// componente en la cabecera de las 7 pantallas que antes montaban
// AppSidebar y/o BottomTabBar, para los dos roles y los dos tamaños de
// pantalla. Icono `Menu` de lucide-react en vez de las 3 barras dibujadas
// a mano del mockup del PM — incoherente con el resto de iconografía de
// la app (todo lucide-react) usar un icono custom aquí.
export function NavToggleButton() {
  const { open, toggle } = useNav();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="app-nav-panel"
      // Sugerencia de auditoría (AIT-51 loop1): "Abrir menú" dejaba de
      // describir la acción real una vez abierto (el clic entonces lo
      // cierra) — igual que aria-label ya distingue "Abrir"/"Cerrar" en
      // otros toggles del proyecto.
      aria-label={open ? "Cerrar menú" : "Abrir menú"}
      className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border bg-surface text-text-secondary hover:bg-neutral-100"
    >
      <Menu size={18} />
    </button>
  );
}
