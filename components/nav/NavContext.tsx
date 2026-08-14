"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type NavContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

// AIT-51: estado mínimo (solo abierto/cerrado) compartido entre el botón
// ☰ de la cabecera de cada pantalla (NavToggleButton) y el panel
// deslizante montado una sola vez en app/layout.tsx (AppNav) — así cada
// pantalla solo necesita colocar <NavToggleButton />, sin tener que
// montar ni pasarle estado al panel entero. Cerrado por defecto
// (useState(false)), tal como pide el brief.
export function NavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value: NavContextValue = {
    open,
    toggle: () => setOpen((o) => !o),
    close: () => setOpen(false),
  };
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (ctx === null) {
    throw new Error("useNav debe usarse dentro de <NavProvider>.");
  }
  return ctx;
}
