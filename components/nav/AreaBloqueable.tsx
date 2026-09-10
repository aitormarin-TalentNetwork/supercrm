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
// SOLO cuando el cierre viene del panel. Si viene de la pantalla de Ajustes,
// el control que corre el cierre (y el aviso de fallo) están DENTRO de este
// subárbol: bloquearlo silenciaría al propio control que tiene que decir
// "Cerrando sesión…". Ese caso lo cubre el bloqueo del botón ☰ — la única
// vía de navegación que Ajustes ofrece — y lo vigila el enumerador de C2a,
// que se pondría rojo solo si alguien añadiera un enlace ahí.
export function AreaBloqueable({ children }: { children: ReactNode }) {
  const { cerrandoSesion } = useNav();
  return (
    <div style={{ display: "contents" }} inert={cerrandoSesion === "panel"}>
      {children}
    </div>
  );
}
