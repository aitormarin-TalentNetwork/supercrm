"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// AIT-127: desde dónde se pulsó "Cerrar sesión", no solo "si se pulsó".
//
// Hace falta el ORIGEN y no un booleano porque el control que corre el cierre
// tiene que seguir siendo perceptible mientras dura (es él quien dice
// "Cerrando sesión…"), y los dos controles viven en árboles distintos: el del
// panel dentro de <AppNav>, el de Ajustes dentro de {children}. Con un
// booleano solo se puede bloquear "todo", y "todo" incluye al control que
// enseña el estado — que quedaría fuera del árbol de accesibilidad justo
// cuando tiene algo que anunciar.
export type OrigenCierre = "panel" | "pagina";

type NavContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  // null = no hay cierre en vuelo.
  cerrandoSesion: OrigenCierre | null;
  setCerrandoSesion: (origen: OrigenCierre | null) => void;
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
  const [cerrandoSesion, setCerrandoSesion] = useState<OrigenCierre | null>(
    null,
  );
  const value: NavContextValue = {
    open,
    // AIT-127: la guarda va AQUÍ y no solo en el `disabled` del botón ☰.
    // El `disabled` protege al único botón que existe hoy; esto protege a
    // cualquier otro que se añada mañana, porque abrir el panel es la vía
    // por la que se llega a los enlaces de navegación y el panel no puede
    // abrirse mientras el cierre está en vuelo.
    toggle: () => setOpen((o) => (cerrandoSesion !== null ? o : !o)),
    close: () => setOpen(false),
    cerrandoSesion,
    setCerrandoSesion,
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
