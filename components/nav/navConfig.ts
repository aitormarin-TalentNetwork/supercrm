import {
  LayoutDashboard,
  Package,
  Repeat,
  Settings,
  TrendingUp,
  UserCheck,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// AIT-50: fuente única de navegación para las dos variantes (sidebar de
// escritorio para owner/storeManager, bottom-nav de móvil para sales) —
// evita que cada pantalla improvise sus propios enlaces sueltos, que era
// el problema original (ver Notion "Correcciones para cerrar V1").
//
// "Clientes" queda fuera a propósito: el mockup de Panel.dc.html la
// incluye en su navItems, pero esa pantalla (listado de clientes) nunca
// se construyó — solo existe "Ficha de cliente" individual, sin ruta de
// listado a la que enlazar. Añadirla habría sido un enlace roto.
export const OWNER_NAV_ITEMS: NavItem[] = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: TrendingUp },
  { href: "/supervision", label: "Supervisión", icon: UserCheck },
  { href: "/catalogo", label: "Catálogo", icon: Package },
  { href: "/reactivar", label: "Reactivar", icon: Repeat },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export const SALES_NAV_ITEMS: NavItem[] = [
  { href: "/hoy", label: "Hoy", icon: CalendarDays },
  { href: "/pipeline", label: "Pipeline", icon: TrendingUp },
  { href: "/catalogo", label: "Catálogo", icon: Package },
  { href: "/reactivar", label: "Reactivar", icon: Repeat },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

// Mismas etiquetas que ya usa Design/pantallas/Login.dc.html para cada
// cuenta de prueba ("Dueña · entra al Panel", "Vendedor · entra a Hoy") —
// "Encargada de tienda" para storeManager (AIT-31) sigue el mismo criterio
// que ya usa el propio código en convex/model/access.ts.
export const ROLE_LABEL: Record<string, string> = {
  owner: "Dueña",
  storeManager: "Encargada de tienda",
  sales: "Vendedor",
};
