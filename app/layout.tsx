import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { NavProvider } from "@/components/nav/NavContext";
import { AppNav } from "@/components/nav/AppNav";
import { PushSubscriptionSync } from "@/components/push/PushSubscriptionSync";

export const metadata: Metadata = {
  title: "SuperCRM",
  description: "CRM de ventas para pequeños negocios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="es" className="h-full antialiased">
        <body className="min-h-full flex flex-col">
          <ConvexClientProvider>
            {/* AIT-51: montado una sola vez para toda la app — el panel de
                navegación (AppNav) y su estado abierto/cerrado (NavProvider)
                no dependen de qué pantalla está activa. Cada pantalla solo
                coloca <NavToggleButton /> en su cabecera para abrirlo. */}
            <NavProvider>
              {children}
              <AppNav />
              {/* AIT-57 (hallazgo de auditoría NO-GO ronda 2): igual que
                  AppNav, montada una sola vez para toda la app — no puede
                  depender de qué pantalla está activa, tiene que
                  sincronizar la suscripción de push en cualquier cambio
                  de sesión, no solo al visitar /ajustes. */}
              <PushSubscriptionSync />
            </NavProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
