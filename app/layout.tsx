import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { NavProvider } from "@/components/nav/NavContext";
import { AppNav } from "@/components/nav/AppNav";
import { AreaBloqueable } from "@/components/nav/AreaBloqueable";
import { AvisoCierreSesion } from "@/components/nav/AvisoCierreSesion";
import { PushSubscriptionSync } from "@/components/push/PushSubscriptionSync";
import { NewVersionNotice } from "@/components/version/NewVersionNotice";
import { getDeployedVersion } from "@/lib/version";
import { FETCH_GATE_BOOTSTRAP } from "@/components/version/fetchGateBootstrap";

export const metadata: Metadata = {
  title: "SuperCRM",
  description: "CRM de ventas para pequeños negocios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // AIT-83: el commit lo inyecta el SERVIDOR, no lo pide el cliente al montar.
  // Si lo pidiera, un despliegue que entrara entre el HTML servido y ese primer
  // fetch dejaría la referencia siendo la versión NUEVA — y la pestaña, con el
  // bundle viejo, se creería al día para siempre. Así la referencia es, por
  // construcción, la versión que sirvió ESTA página.
  const { commit } = getDeployedVersion();

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="es" className="h-full antialiased">
        <head>
          {/* AIT-83: tiene que correr ANTES del bundle del framework. Next
              captura su referencia a `fetch` al cargar su módulo, así que
              sustituirlo desde un efecto de React llega tarde y la server
              action real pasa de largo (comprobado: el POST llevaba
              `next-action` y no entraba por el envoltorio). Solo captura el
              original y delega en un enganche que instala React después. */}
          <script dangerouslySetInnerHTML={{ __html: FETCH_GATE_BOOTSTRAP }} />
        </head>
        <body className="min-h-full flex flex-col">
          <ConvexClientProvider>
            {/* AIT-51: montado una sola vez para toda la app — el panel de
                navegación (AppNav) y su estado abierto/cerrado (NavProvider)
                no dependen de qué pantalla está activa. Cada pantalla solo
                coloca <NavToggleButton /> en su cabecera para abrirlo. */}
            <NavProvider>
              {/* AIT-127 (C2a): la pantalla activa entera, para poder sacarla
                  de alcance mientras un cierre de sesión está en vuelo. No
                  genera caja (display:contents), así que el layout de las 10
                  pantallas no cambia. Ver AreaBloqueable.tsx. */}
              <AreaBloqueable>{children}</AreaBloqueable>
              <AppNav />
              {/* AIT-127: hermano de lo que se bloquea, no hijo — durante el
                  cierre la pantalla y el panel van `inert`, y un aviso dentro
                  de ellos no se podría leer.

                  🔴 ES LO ÚNICO QUE QUEDA FUERA DEL BLOQUEO, y la lista de
                  abajo es de PERMITIDOS, no de prohibidos: cualquier cosa que
                  se monte a nivel de layout va DENTRO de <AreaBloqueable>
                  salvo que alguien argumente por qué no. Al revés —enumerar lo
                  que hay que bloquear— es como se coló el caso de la ronda 4
                  (ver justo debajo). */}
              <AvisoCierreSesion />
              {/* AIT-127 (ronda 4): TODO lo demás del layout va dentro del área
                  bloqueable, no solo la pantalla activa y el panel.

                  🔴 POR QUÉ, Y ES UN DEFECTO QUE ESTUVO VIVO: <NewVersionNotice>
                  era hermano de <AreaBloqueable>, así que el `inert` no lo
                  alcanzaba. Cuando se activa pinta DOS controles —«Recargar»,
                  que llama a `window.location.reload()`, y el «Cerrar» del
                  Toast—, y durante la ventana de cierre quedaban los dos
                  alcanzables. Eso es exactamente lo que C2a prohíbe: CERO
                  controles, y un recargar es navegación que la app ofrece.
                  No era teórico ni sólo de producción — el arnés inyecta
                  `RAILWAY_GIT_COMMIT_SHA` (playwright.config.ts, AIT-93), así
                  que el aviso está vivo también en la suite. El rojo está
                  fabricado en `08-cierre-de-sesion.spec.ts` («C2a · control
                  positivo con un componente REAL del layout»).

                  El comentario del control positivo ya nombraba la CLASE del
                  hueco («cualquier cosa montada a nivel de layout») y no el
                  ejemplar que existía. Nombrar la clase no lo cerró.

                  AIT-57 / AIT-83: las dos siguen montadas una sola vez para
                  toda la app, que es lo que exigían sus fichas — envolverlas no
                  cambia dónde viven ni cuántas veces se montan, y
                  <AreaBloqueable> no genera caja (display:contents). */}
              <AreaBloqueable>
                <PushSubscriptionSync />
                <NewVersionNotice loadedCommit={commit} />
              </AreaBloqueable>
            </NavProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
