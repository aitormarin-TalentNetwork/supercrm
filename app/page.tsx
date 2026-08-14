import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";

// proxy.ts ya garantiza que solo se llega aquí autenticado (rutas privadas
// redirigen a /login si no hay sesión) — el ?. es puramente defensivo.
export default async function Home() {
  const token = await convexAuthNextjsToken();
  const role = await fetchQuery(api.users.getCurrentUserRole, {}, { token });
  // AIT-50 (NO-GO ronda 2, mayor): storeManager es un rol de gestión de
  // tienda entera, igual que owner (isStoreWideRole en
  // convex/model/access.ts) — debe entrar directamente a /panel, no dar
  // un rodeo por /hoy (que además obligaba a app/hoy/page.tsx a manejar
  // el estado transitorio "role todavía no resuelto" solo para este
  // caso).
  redirect(role === "owner" || role === "storeManager" ? "/panel" : "/hoy");
}
