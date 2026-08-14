"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/ui/Avatar";
import { OWNER_NAV_ITEMS, ROLE_LABEL } from "./navConfig";

// AIT-50: navegación para owner/storeManager, en dos variantes según
// ancho — se usan juntas envolviendo cada pantalla en
// `<div className="flex min-h-screen flex-col lg:flex-row">`:
//
// - `lg` (≥1024px, --bp-lg): sidebar vertical fijo de 240px, puerto a
//   Tailwind de Design/design-system/components/navigation/SidebarNav.jsx
//   (navegación real por ruta con Link/usePathname en vez del
//   value/onChange de vista-única del prototipo). Es la variante que pide
//   el brief de AIT-50 ("Sidebar de escritorio").
// - por debajo de `lg`: el brief no pide una variante móvil para este rol
//   (solo "Sidebar de escritorio"), pero quitar sin más los enlaces
//   sueltos que ya existían en Panel (Catálogo/Reactivar/Supervisión) sin
//   nada que los sustituya habría dejado a Marta sin forma de navegar en
//   móvil — peor que antes de esta tarea. En vez de inventar un drawer
//   completo (fuera de lo pedido), se añade esta franja horizontal con
//   scroll con los mismos ítems — mínimo suficiente para no perder
//   funcionalidad, documentado en el export como decisión propia.
export function AppSidebar() {
  const pathname = usePathname();
  const role = useQuery(api.users.getCurrentUserRole);
  const userInfo = useQuery(api.users.getCurrentUserInfo);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[240px] flex-none flex-col border-r border-border bg-surface p-3 lg:flex">
        <div className="flex items-center gap-2.5 px-2 pb-4 pt-1.5">
          <div className="h-[30px] w-[30px] flex-none rounded-lg bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#6366F1]" />
          <span className="text-base font-bold tracking-tight text-text">
            SuperCRM
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {OWNER_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
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

        <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pb-1 pt-3">
          <Avatar name={userInfo?.name ?? ""} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-text">
              {userInfo?.name ?? "…"}
            </div>
            <div className="text-[11.5px] text-text-muted">
              {role ? (ROLE_LABEL[role] ?? role) : "…"}
            </div>
          </div>
        </div>
      </aside>

      <nav
        className="flex flex-none items-center gap-1.5 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden"
        aria-label="Navegación principal"
      >
        {OWNER_NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-none items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold whitespace-nowrap ${
                active
                  ? "bg-primary-subtle text-primary"
                  : "text-text-secondary hover:bg-neutral-100"
              }`}
            >
              <Icon size={16} className="flex-none" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
