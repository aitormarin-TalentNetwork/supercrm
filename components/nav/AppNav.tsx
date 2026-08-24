"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { LogOut, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/ui/Avatar";
import { useSignOutAndUnlinkPush } from "@/components/push/useSignOutAndUnlinkPush";
import { useNav } from "./NavContext";
import { OWNER_NAV_ITEMS, SALES_NAV_ITEMS, ROLE_LABEL } from "./navConfig";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// AIT-51: sustituye AppSidebar (sidebar fijo de 240px + franja de
// pestañas con scroll en móvil) y BottomTabBar (fijo) por un único panel
// deslizante, cerrado por defecto, para los dos roles y los dos tamaños
// de pantalla — mismo comportamiento que el mockup interactivo del PM
// enlazado en el brief de la tarea: ☰ (NavToggleButton, en la cabecera de
// cada pantalla) abre el panel; se cierra al elegir una sección, al tocar
// fuera (scrim) o con Escape (mismo criterio de accesibilidad que
// components/ui/Dialog.tsx). Montado una sola vez en app/layout.tsx
// (dentro de NavProvider) — no en cada pantalla, a diferencia de
// AppSidebar/BottomTabBar antes — porque su estado abierto/cerrado vive
// en NavContext, compartido con el botón ☰ de cada pantalla.
export function AppNav() {
  const { open, close } = useNav();
  const pathname = usePathname();
  const signOut = useSignOutAndUnlinkPush();
  const role = useQuery(api.users.getCurrentUserRole);
  // getCurrentUserInfo (a diferencia de getCurrentUserRole) usa
  // requireUser y lanza si no hay sesión — al estar este componente
  // montado en todo momento (app/layout.tsx), sin el "skip" se rompía
  // cualquier pantalla sin sesión (p.ej. /login) en cuanto se cerraba
  // sesión. Mismo patrón "skip" que AltaRapidaModal/RegistrarInteraccionModal.
  const userInfo = useQuery(
    api.users.getCurrentUserInfo,
    role !== null && role !== undefined ? {} : "skip",
  );
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Foco inicial al abrir + devolución del foco al botón ☰ que lo abrió,
  // al cerrar — mismo patrón que components/ui/Dialog.tsx. Sin esto
  // (hallazgo de auditoría, AIT-51 loop1): el panel "cerrado" seguía
  // montado en el DOM (translateX fuera de pantalla, para poder animar
  // la apertura), así que con Tab se podía llegar a sus enlaces aunque
  // no fueran visibles; y al abrir, el foco no entraba en el panel.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const first =
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? panelRef.current)?.focus();
    return () => {
      previouslyFocused.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      // Atrapa el foco dentro del panel mientras está abierto — mismo
      // criterio que Dialog.tsx: sin esto, Tab desde el último enlace
      // se escapaba hacia el contenido tapado por el scrim.
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // AIT-31: storeManager ve el mismo menú que owner (Panel/Supervisión/
  // etc.), igual que ya hacía AppSidebar. Sin rol resuelto todavía (o sin
  // sesión), no hay ítems que mostrar — nada que renderizar, en vez de un
  // panel vacío si `open` llegara a ser true en ese instante.
  const items =
    role === "owner" || role === "storeManager"
      ? OWNER_NAV_ITEMS
      : role === "sales"
        ? SALES_NAV_ITEMS
        : null;

  if (items === null) return null;

  return (
    <>
      {open && (
        <div
          onClick={close}
          aria-hidden="true"
          // Mismo tono de scrim que components/ui/Dialog.tsx
          // (bg-[rgba(15,23,42,.45)]) — consistencia visual entre los dos
          // overlays de la app.
          className="fixed inset-0 z-[60] bg-[rgba(15,23,42,.45)]"
        />
      )}
      <aside
        ref={panelRef}
        id="app-nav-panel"
        aria-label="Navegación principal"
        aria-hidden={!open}
        // `inert` (no solo aria-hidden) saca sus botones/enlaces del
        // orden de tabulación mientras está fuera de pantalla — sin él,
        // aria-hidden por sí solo no impide que Tab los alcance (hallazgo
        // de auditoría, AIT-51 loop1). Se mantiene montado (no
        // `if (!open) return null`) para poder animar la entrada/salida
        // con translateX.
        inert={!open}
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 z-[70] flex w-[260px] flex-none flex-col border-r border-border bg-surface shadow-[var(--shadow-e3)] outline-none transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <Avatar name={userInfo?.name ?? ""} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-text">
              {userInfo?.name ?? "…"}
            </div>
            <div className="text-[11.5px] text-text-muted">
              {role ? (ROLE_LABEL[role] ?? role) : "…"}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={close}
                className={`flex min-h-[44px] items-center gap-[11px] rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary-subtle font-semibold text-primary"
                    : "font-medium text-text-secondary hover:bg-neutral-100"
                }`}
              >
                <Icon size={18} className="flex-none" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Notion "Correcciones para cerrar V1" (entrada 3, se nos había
            pasado en el brief original de AIT-51): "Cerrar sesión" al pie
            del panel, separado del resto (border-t), para no tener que
            entrar a Ajustes solo para salir. Sustituye AL botón que ya
            existía SOLO en Ajustes — ese se queda también (app/ajustes/
            page.tsx), mismo useSignOutAndUnlinkPush (AIT-57: desvincula la
            suscripción push del dispositivo antes de cerrar sesión de
            verdad). */}
        <div className="mt-auto flex-none border-t border-border p-3">
          <button
            type="button"
            onClick={() => {
              close();
              void signOut();
            }}
            className="flex min-h-[44px] w-full items-center gap-[11px] rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-100"
          >
            <LogOut size={18} className="flex-none" />
            <span className="flex-1 text-left">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
