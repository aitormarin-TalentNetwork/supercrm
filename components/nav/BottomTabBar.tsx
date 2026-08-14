"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SALES_NAV_ITEMS } from "./navConfig";

// AIT-50: bottom-nav de móvil para sales — mismo patrón visual que ya
// especificaba Hoy.dc.html (nav fija al pie, 4-5 pestañas con icono+label
// apiladas), extendido a Pipeline/Catálogo/Reactivar/Ajustes (antes solo
// existía dibujado en el mockup, la app real no la había construido para
// ninguna pantalla). `fixed` + `pb-[env(safe-area-inset-bottom)]` para no
// quedar tapada por la barra de gestos en iOS.
export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      {SALES_NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold ${
              active ? "text-primary" : "text-text-muted"
            }`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
