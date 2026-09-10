"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// AIT-127: desde dónde se pulsó "Cerrar sesión", no solo "si se pulsó".
//
// ⚠️ EL ORIGEN YA NO DECIDE QUÉ SE BLOQUEA (ronda 4, M3): durante el cierre se
// bloquea TODO, venga de donde venga. Se conserva porque decide qué botón
// enseña "Cerrando sesión…" y porque `close()` del panel solo procede si el
// cierre salió de ahí.
//
// La versión anterior bloqueaba solo el árbol contrario para no silenciar al
// control que anuncia el estado. Eso dejaba viva la pantalla que corría el
// cierre — y el auditor midió que ahí ya hay navegación por `router.push`
// (app/clientes, app/pipeline), no solo enlaces. La salida no era afinar el
// bloqueo sino SACAR EL ANUNCIO FUERA: lo pinta <AvisoCierreSesion>, montado
// en el layout y por tanto fuera de todo lo que se bloquea.
export type OrigenCierre = "panel" | "pagina";

type NavContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  // null = no hay cierre en vuelo.
  cerrandoSesion: OrigenCierre | null;
  setCerrandoSesion: (origen: OrigenCierre | null) => void;
  // AIT-127: el fallo del último cierre. Compartido y no local a cada pantalla
  // porque quien lo pinta es <AvisoCierreSesion>, que vive en el layout.
  errorCierre: boolean;
  setErrorCierre: (hay: boolean) => void;
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
  const [errorCierre, setErrorCierre] = useState(false);
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
    errorCierre,
    setErrorCierre,
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
