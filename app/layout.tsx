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
                  de ellos no se podría leer. */}
              <AvisoCierreSesion />
              {/* AIT-57 (hallazgo de auditoría NO-GO ronda 2): igual que
                  AppNav, montada una sola vez para toda la app — no puede
                  depender de qué pantalla está activa, tiene que
                  sincronizar la suscripción de push en cualquier cambio
                  de sesión, no solo al visitar /ajustes. */}
              <PushSubscriptionSync />
              {/* AIT-83: mismo criterio que AppNav y PushSubscriptionSync —
                  montado una sola vez para toda la app, porque una pestaña
                  puede quedarse desfasada esté en la pantalla que esté, y
                  también sin sesión (login, 404). */}
              <NewVersionNotice loadedCommit={commit} />
            </NavProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
