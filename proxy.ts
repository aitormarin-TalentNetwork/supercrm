// Next.js 16 renombró la convención "middleware.ts" a "proxy.ts" — el
// contrato de la función (default export) no cambia.
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "./convex/_generated/api";

// AIT-23: /supervision es owner-only igual que /panel — se añade al mismo
// matcher (renombrado de "isPanelRoute" porque ya cubre más de un sitio).
const isOwnerOnlyRoute = createRouteMatcher(["/panel(.*)", "/supervision(.*)"]);
// "/" incluida explícitamente: sin ella, una visita sin sesión a "/" no la
// bloqueaba aquí (isProtectedRoute no la cubría), sino que app/page.tsx
// redirigía primero a "/hoy" y solo AHÍ actuaba este proxy — un salto de
// más, y contradecía el comentario de app/page.tsx de que "solo se llega
// aquí autenticado". Con "/" protegida, el salto extra desaparece.
const isProtectedRoute = createRouteMatcher([
  "/",
  "/panel(.*)",
  "/hoy(.*)",
  "/oportunidades(.*)",
  "/pipeline(.*)",
  "/supervision(.*)",
  "/catalogo(.*)",
  // AIT-30 (hallazgo de auditoría, NO-GO ronda 1): sin esto, un usuario
  // anónimo podía cargar /reactivar directamente — la query de Convex
  // rechaza la petición ("No autenticado"), pero eso no sustituye el
  // contrato de enrutado que ya cumplen el resto de pantallas privadas.
  "/reactivar(.*)",
  // AIT-50: pantalla de Ajustes, accesible a cualquier usuario autenticado
  // (no es owner-only) — mismo criterio que /hoy o /pipeline.
  "/ajustes(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  if (isOwnerOnlyRoute(request) && isAuthed) {
    // Comprobación de rol real, consultada a Convex — no una cookie ni un
    // dato del cliente. Esto es capa de enrutado/UX: el control de acceso
    // real a los datos vive dentro de cada query/mutation vía
    // requireUser/requireStoreAccess (convex/model/access.ts), nunca aquí.
    const token = await convexAuth.getToken();
    const role = await fetchQuery(api.users.getCurrentUserRole, {}, { token });
    // AIT-31 (multi-tienda): storeManager ve su tienda igual que owner ve
    // todas — mismas rutas, el aislamiento por tienda ya lo resuelve
    // requireStoreAccess en cada query.
    if (role !== "owner" && role !== "storeManager") {
      return nextjsMiddlewareRedirect(request, "/hoy");
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
