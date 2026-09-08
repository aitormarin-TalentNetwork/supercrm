import { getDeployedVersion } from "@/lib/version";

// AIT-79: la vía pública para saber qué commit sirve la app. Sin sesión, sin
// rol y sin CLI — el caso que la motivó es alguien mirando una pantalla rota
// que no puede distinguir "el deploy no está vivo" de "el deploy está vivo y
// esta pantalla falla".
//
// No está en isProtectedRoute ni en isOwnerOnlyRoute (proxy.ts), así que el
// proxy la deja pasar sin autenticar. Publica solo datos no sensibles: SHA del
// commit, id de despliegue y nombre de entorno. Nunca un volcado de
// process.env.
//
// Dos capas contra el valor viejo, que resuelven cosas distintas:
//   - force-dynamic: que no se prerenderice en tiempo de build.
//   - no-store: que ningún intermediario sirva una copia cacheada.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { ...getDeployedVersion(), servedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
