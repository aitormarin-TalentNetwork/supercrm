"use client";

import type { ReactNode } from "react";
import { useNav } from "./NavContext";

// AIT-127 (C2a): envuelve el contenido de la pantalla activa para poder
// sacarlo entero de alcance mientras un cierre de sesión está en vuelo.
//
// POR QUÉ UN ANCESTRO Y NO UNA LISTA DE SELECTORES: el criterio C2a exige
// cero elementos alcanzables capaces de navegar durante la ventana del
// cierre, y una lista se queda vieja el día que alguien añade un enlace.
// `inert` sobre el ancestro cubre a los descendientes que existen hoy y a
// los que se añadan mañana, sin que nadie tenga que acordarse. Es el mismo
// mecanismo que AppNav ya usa para su panel fuera de pantalla (AIT-51
// loop1): `aria-hidden` por sí solo no impide que Tab llegue.
//
// `display: contents` y no un div normal: <body> es `flex flex-col` y las
// pantallas son sus items flex. Un div intermedio con caja propia cambiaría
// el layout de las 10 pantallas a cambio de nada; `contents` no genera caja,
// así que los hijos siguen siendo items flex de <body>. `inert` no depende
// del display — se aplica al elemento y a su subárbol.
//
// SIEMPRE que hay un cierre en vuelo, venga del panel o de la pantalla.
//
// ⚠️ RONDA 4 (M3): antes se bloqueaba solo si venía del panel, para no
// silenciar al control de Ajustes que dice "Cerrando sesión…". El precio era
// que /ajustes quedaba viva, y eso solo estaba a salvo porque hoy no tiene
// enlaces — una propiedad de la pantalla de hoy, no del mecanismo. El auditor
// midió que la app ya navega con `button` + `router.push` (app/clientes,
// app/pipeline), así que un control nuevo ahí navegaría sin que nada lo
// impidiera. El anuncio se sacó fuera (<AvisoCierreSesion>, en el layout) y
// aquí se bloquea todo.
export function AreaBloqueable({ children }: { children: ReactNode }) {
  const { cerrandoSesion } = useNav();
  return (
    <div style={{ display: "contents" }} inert={cerrandoSesion !== null}>
      {children}
    </div>
  );
}
