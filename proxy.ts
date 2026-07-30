// Next.js 16 renombró la convención "middleware.ts" a "proxy.ts" — el
// contrato de la función (default export) no cambia.
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "./convex/_generated/api";

const isPanelRoute = createRouteMatcher(["/panel(.*)"]);
// "/" incluida explícitamente: sin ella, una visita sin sesión a "/" no la
// bloqueaba aquí (isProtectedRoute no la cubría), sino que app/page.tsx
// redirigía primero a "/hoy" y solo AHÍ actuaba este proxy — un salto de
// más, y contradecía el comentario de app/page.tsx de que "solo se llega
// aquí autenticado". Con "/" protegida, el salto extra desaparece.
const isProtectedRoute = createRouteMatcher(["/", "/panel(.*)", "/hoy(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  if (isPanelRoute(request) && isAuthed) {
    // Comprobación de rol real, consultada a Convex — no una cookie ni un
    // dato del cliente. Esto es capa de enrutado/UX: el control de acceso
    // real a los datos vive dentro de cada query/mutation vía
    // requireUser/requireOwner (convex/model/access.ts), nunca aquí.
    const token = await convexAuth.getToken();
    const role = await fetchQuery(api.users.getCurrentUserRole, {}, { token });
    if (role !== "owner") {
      return nextjsMiddlewareRedirect(request, "/hoy");
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
