import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";

// proxy.ts ya garantiza que solo se llega aquí autenticado (rutas privadas
// redirigen a /login si no hay sesión) — el ?. es puramente defensivo.
export default async function Home() {
  const token = await convexAuthNextjsToken();
  const role = await fetchQuery(api.users.getCurrentUserRole, {}, { token });
  redirect(role === "owner" ? "/panel" : "/hoy");
}
