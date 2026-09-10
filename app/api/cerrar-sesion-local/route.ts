import { NextResponse } from "next/server";

// AIT-134: la única vía que puede quitarle la credencial al navegador cuando el
// cierre normal NO se completa.
//
// EL DEFECTO QUE CIERRA, medido por efecto y no leído: si el POST a `/api/auth`
// no llega a completarse —lo aborta nuestro propio `AbortController` a los
// LIMITE_CIERRE_MS, o no hay respuesta— nadie emite el `Set-Cookie` que borra
// las cookies, y **el servidor sigue dejando entrar**. Medido con la sonda de la
// fase de plan: con la petición abortada, `/pipeline` seguía sirviendo.
//
// 🔴 POR QUÉ ESTA RUTA NO PUEDE HABLAR CON CONVEX, Y POR QUÉ NO BASTA CON NO
//    LLAMARLO DESDE AQUÍ. El handler no llama a Convex, pero eso no es una
//    propiedad de este fichero: es una propiedad del RECORRIDO de la petición.
//    `proxy.ts` corre `convexAuth.isAuthenticated()` en toda ruta de su matcher,
//    y eso es un `fetchQuery` a Convex SIN LÍMITE. Si Convex está lento, la
//    petición no llega aquí y la ruta hereda exactamente la dependencia que
//    venía a rodear. Tampoco vale un `return` temprano dentro del middleware:
//    `convexAuthNextjsMiddleware` ENVUELVE a nuestro handler y puede intentar
//    renovar tokens antes de que corra nuestro código.
//    ⛔ Por eso esta ruta está EXCLUIDA DEL MATCHER en `proxy.ts`. Si alguien la
//    devuelve al matcher, deja de servir para lo único que existe.
//
// SE BORRAN LAS DOS VARIANTES DEL NOMBRE, con prefijo y sin él, a propósito.
// La librería elige el prefijo `__Host-` según si el Host es localhost
// (`cookies.js`, `getCookieStore`), y esa lógica no es importable: replicarla
// sería una suposición más. Borrar una cookie que no existe no hace nada, así
// que cubrir las dos es estrictamente más seguro que acertar el prefijo.
//
// ⚠️ Y ESTO NO REVOCA NADA EN EL SERVIDOR. Quien ya tuviera el token capturado
// sigue entrando hasta que expire — eso es AIT-133 y no esta ficha. Lo que esto
// garantiza es que ESTE navegador deja de tener credencial utilizable.
const NOMBRES = [
  "__convexAuthJWT",
  "__convexAuthRefreshToken",
  "__convexAuthOAuthVerifier",
] as const;

export const dynamic = "force-dynamic";

export async function POST() {
  const respuesta = NextResponse.json(
    { cerrado: true },
    { headers: { "Cache-Control": "no-store" } },
  );

  for (const nombre of NOMBRES) {
    // Mismo mecanismo que usa la librería para borrar (`cookies.js`): valor
    // vacío con `expires: 0`, NO `.delete()`. El comentario del paquete explica
    // por qué —vercel/next.js#56632— y aquí se replica en vez de improvisar.
    for (const { clave, secure } of [
      { clave: nombre, secure: false },
      { clave: `__Host-${nombre}`, secure: true },
    ]) {
      respuesta.cookies.set(clave, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
        expires: 0,
      });
    }
  }

  return respuesta;
}
