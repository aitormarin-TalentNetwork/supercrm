// Next.js 16 renombró la convención "middleware.ts" a "proxy.ts" — el
// contrato de la función (default export) no cambia.
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "./convex/_generated/api";
import { getDeployedVersion } from "./lib/version";

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
  // AIT-67: faltaba en esta lista — era la única pantalla privada que no
  // pasaba por este redirect, así que sin sesión llegaba a montarse y sus
  // queries de Convex (customers.list, customers.getFicha) lanzaban "No
  // autenticado." sin ningún guard que lo capturase (pantalla de error
  // muerta en vez de /login).
  "/clientes(.*)",
  // AIT-30 (hallazgo de auditoría, NO-GO ronda 1): sin esto, un usuario
  // anónimo podía cargar /reactivar directamente — la query de Convex
  // rechaza la petición ("No autenticado"), pero eso no sustituye el
  // contrato de enrutado que ya cumplen el resto de pantallas privadas.
  "/reactivar(.*)",
  // AIT-50: pantalla de Ajustes, accesible a cualquier usuario autenticado
  // (no es owner-only) — mismo criterio que /hoy o /pipeline.
  "/ajustes(.*)",
]);

// AIT-79: el commit que sirve la respuesta, en la propia respuesta.
//
// Va aquí y no solo en /version por el caso que motivó la tarea: cuando lo que
// falla es una pantalla, la app puede estar demasiado rota como para renderizar
// un dato que viva dentro de React. La cabecera viaja en la MISMA respuesta que
// se está inspeccionando, incluidas las páginas de error de la app.
//
// COBERTURA REAL, sin generalizar: se emite en lo que pasa por este handler
// (navegación normal, redirects de ruta protegida, y páginas de error de la app
// como el 404). NO está garantizada en las rutas donde el proxy no corre
// (`_next`, ficheros con punto; ver el matcher de abajo), ni en las salidas
// tempranas de Convex Auth — el proxy de `/api/auth` y su propio redirect de
// refresco retornan antes de llamar a este handler. Para esos casos está
// /version, que es una vía independiente.
const VERSION_HEADER = "x-supercrm-commit";

function withVersionHeader<T extends Response>(response: T): T {
  try {
    const { commit } = getDeployedVersion();
    // Si no hay commit verificable no se emite nada. Una cabecera con un valor
    // inventado o viejo sería peor que su ausencia: es justo el fallo que
    // AIT-79 viene a cerrar.
    if (commit) {
      response.headers.set(VERSION_HEADER, commit);
    }
  } catch {
    // Un dato informativo no puede tumbar el sitio. Este handler corre en
    // TODAS las rutas, así que una excepción aquí sería una caída total a
    // cambio de nada.
  }
  return response;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (isProtectedRoute(request) && !isAuthed) {
    return withVersionHeader(nextjsMiddlewareRedirect(request, "/login"));
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
      return withVersionHeader(nextjsMiddlewareRedirect(request, "/hoy"));
    }
  }

  // Antes se devolvía undefined y el paquete de auth construía él mismo esta
  // misma respuesta. Se explicita para poder ponerle la cabecera, replicando
  // el reenvío de `request.headers`: ahí viajan las cookies ya refrescadas por
  // el middleware de auth, y omitirlo rompería el refresco de sesión.
  return withVersionHeader(
    NextResponse.next({ request: { headers: request.headers } }),
  );
});

// AIT-134: `/api/cerrar-sesion-local` queda FUERA del matcher, y es la pieza de
// la que depende que esa ruta sirva para algo.
//
// El handler de arriba llama a `convexAuth.isAuthenticated()` (línea 79) en toda
// ruta que el matcher capture, y eso es un `fetchQuery` a Convex SIN LÍMITE. La
// ruta de cierre local existe justamente para el caso en que Convex no responde:
// si pasara por aquí, se quedaría esperando a lo mismo que viene a rodear, y la
// respuesta que borra las cookies no llegaría nunca.
//
// ⛔ NO VALE UN `return` TEMPRANO EN EL HANDLER. `convexAuthNextjsMiddleware`
// ENVUELVE a nuestra función y puede intentar renovar tokens —otro `fetchAction`—
// antes de que nuestro código corra. Lo único que garantiza cero Convex es que la
// ruta no entre en el matcher.
//
// ⚠️ ESTE REGEX NO SE VERIFICA LEYÉNDOLO. Son tres patrones con negación
// anticipada y escapes dobles: es exactamente la clase de cosa que se lee
// correcta y no lo es. Se comprueba POR EFECTO —con Convex pendiente, la ruta
// tiene que responder dentro de su límite— y ese test existe en
// `e2e/08-cierre-de-sesion.spec.ts`. Si alguien toca esta línea, ese test es el
// que dice si sigue funcionando.
const RUTA_CIERRE_LOCAL = "api/cerrar-sesion-local";

export const config = {
  matcher: [
    `/((?!.*\\..*|_next|${RUTA_CIERRE_LOCAL}).*)`,
    "/",
    `/(api|trpc)(?!/cerrar-sesion-local)(.*)`,
  ],
};
