import { afterEach, describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";

// AIT-92 ronda 3 · M2 — EL CALLBACK, EJERCITADO DE VERDAD.
//
// Las pruebas puras de `00-gmail.spec.ts` validan las DECISIONES
// (`validarState`, `debeEscribirse`, `resolverUpsert`) y no el ENCADENAMIENTO
// que las une. El auditor lo dijo y M1 lo demostró: el XSS vivía en el
// pegamento, no en las piezas. Aquí se recorre el handler HTTP entero contra un
// Google simulado.
//
// ⛔ ALCANCE, fijado por el PM: esto entra POR SU PROPÓSITO —ejecutar el
// callback y comprobar lo que de él depende—, NO como infraestructura de
// pruebas del proyecto. No se prueba aquí nada que no cuelgue del callback.
//
// El proveedor es simulado, y eso NO prueba que Google responda así: prueba que
// nuestro código maneja NUESTRA IDEA de lo que Google responde. La prueba de
// consentimiento real es AIT-144 y no la sustituye nada de aquí.

/** Mapa de módulos explícito: el runner de Playwright no tiene `import.meta.glob`
 *  de Vite, así que se declara a mano. Solo lo que el callback necesita. */
const modules = {
  // `convex-test` localiza la raíz de funciones a partir de `_generated`, así
  // que tiene que estar en el mapa aunque el callback no lo importe él mismo.
  "./_generated/api.ts": () => import("../convex/_generated/api"),
  "./_generated/server.ts": () => import("../convex/_generated/server"),
  "./auth.ts": () => import("../convex/auth"),
  "./gmail.ts": () => import("../convex/gmail"),
  "./http.ts": () => import("../convex/http"),
  "./users.ts": () => import("../convex/users"),
};

const CLAVE = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
const TOKEN = "REFRESH-DE-PRUEBA-no-es-un-secreto";
const BUZON = "vendedor@talent-network.org";

type Fetch = typeof globalThis.fetch;

/** Google simulado. `conRefresh` decide si el canje devuelve token de refresco. */
function googleFalso(conRefresh: boolean, buzon: string = BUZON): Fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("oauth2.googleapis.com/token")) {
      return new Response(
        JSON.stringify({
          access_token: "ACCESS-DE-PRUEBA",
          ...(conRefresh ? { refresh_token: TOKEN } : {}),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("gmail/v1/users/me/profile")) {
      return new Response(JSON.stringify({ emailAddress: buzon }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`El callback llamó a una URL inesperada: ${url}`);
  }) as Fetch;
}

async function montar() {
  const t = convexTest(schema, modules);
  const userId = await t.run(async (ctx) => {
    const storeId = await ctx.db.insert("stores", { name: "Tienda de prueba" });
    return await ctx.db.insert("users", {
      email: "vendedor@supercrm.es",
      role: "sales",
      storeId,
      active: true,
    });
  });
  return { t, userId };
}

/** Un flujo NUEVO cada vez: `state` propio, como en la vida real. */
async function nuevoState(t: Awaited<ReturnType<typeof montar>>["t"], userId: string) {
  return await t.mutation(internal.gmail.crearState, { userId: userId as never });
}

async function filas(t: Awaited<ReturnType<typeof montar>>["t"]) {
  return await t.run(async (ctx) => await ctx.db.query("gmailAccounts").collect());
}

describe("el callback de OAuth, recorrido entero", () => {
  const original = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = original;
    delete process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.GMAIL_CLIENT_SECRET;
  });

  function entorno() {
    process.env.GMAIL_TOKEN_ENCRYPTION_KEY = CLAVE;
    process.env.GMAIL_CLIENT_ID = "id-de-prueba";
    process.env.GMAIL_CLIENT_SECRET = "secreto-de-prueba";
  }

  test("CONTROL POSITIVO: el camino completo crea UNA fila", async () => {
    const { t, userId } = await montar();
    entorno();
    globalThis.fetch = googleFalso(true);
    const state = await nuevoState(t, userId);

    const r = await t.fetch(`/gmail/oauth/callback?code=abc&state=${state}`);
    expect(r.status).toBe(200);

    const f = await filas(t);
    expect(f).toHaveLength(1);
    expect(f[0].emailAddress).toBe(BUZON);
    expect(f[0].writeCount).toBe(1);
    // El token no se guarda en claro, y la versión se lee sin descifrar.
    expect(f[0].refreshTokenCipher).not.toContain(TOKEN);
    expect(f[0].refreshTokenCipher.startsWith("v1.")).toBe(true);
  });

  test("DOS flujos independientes sobre el mismo buzón dejan UNA fila", async () => {
    const { t, userId } = await montar();
    entorno();
    globalThis.fetch = googleFalso(true);

    await t.fetch(`/gmail/oauth/callback?code=a&state=${await nuevoState(t, userId)}`);
    await t.fetch(`/gmail/oauth/callback?code=b&state=${await nuevoState(t, userId)}`);

    const f = await filas(t);
    expect(f).toHaveLength(1);
    // El contador acredita que el SEGUNDO flujo llegó a escribir, y no que se
    // quedó en un rechazo anterior. Se lee con el cifrado roto.
    expect(f[0].writeCount).toBe(2);
  });

  test("el MISMO state dos veces: el segundo se rechaza y no escribe", async () => {
    const { t, userId } = await montar();
    entorno();
    globalThis.fetch = googleFalso(true);
    const state = await nuevoState(t, userId);

    await t.fetch(`/gmail/oauth/callback?code=a&state=${state}`);
    const segunda = await t.fetch(`/gmail/oauth/callback?code=b&state=${state}`);

    expect(segunda.status).toBe(400);
    expect(await filas(t)).toHaveLength(1);
  });

  test("state desconocido: 0 filas", async () => {
    const { t } = await montar();
    entorno();
    globalThis.fetch = googleFalso(true);
    const r = await t.fetch("/gmail/oauth/callback?code=a&state=inventado");
    expect(r.status).toBe(400);
    expect(await filas(t)).toHaveLength(0);
  });

  test("sin refresh_token NO se escribe nada", async () => {
    const { t, userId } = await montar();
    entorno();
    globalThis.fetch = googleFalso(false);
    const r = await t.fetch(
      `/gmail/oauth/callback?code=a&state=${await nuevoState(t, userId)}`,
    );
    expect(r.status).toBe(502);
    expect(await filas(t)).toHaveLength(0);
  });

  test("rechazo del consentimiento: 0 filas y lo explica", async () => {
    const { t } = await montar();
    entorno();
    const r = await t.fetch("/gmail/oauth/callback?error=access_denied");
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Rechazaste");
    expect(await filas(t)).toHaveLength(0);
  });

  // ⚠️ ESTE CASO SE LLAMABA «M1 · un payload en `error` NO llega interpretado» y
  // ESE NOMBRE ERA FALSO. Mide la CAPA 1 —que el código de error se traduce por
  // una lista cerrada en vez de reflejarse—, y por eso da verde aunque el
  // escapado (capa 2) esté roto: el payload no llega a la página, lo corta la
  // capa 1 antes. Se conserva porque prueba algo real; lo único que se cambia es
  // su nombre. Quien quiera ver la capa 2 en rojo, el caso de abajo.
  test("capa 1 · el código de error de Google se traduce, no se refleja", async () => {
    const { t } = await montar();
    entorno();
    const payload = encodeURIComponent('</p><script>alert(1)</script><p x="');
    const r = await t.fetch(`/gmail/oauth/callback?error=${payload}`);
    const html = await r.text();
    // Ni interpretado ni escapado: es que no está. Se comprueban las dos cosas
    // para que el caso distinga «traducido» de «escapado».
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("&lt;script&gt;");
    expect(html).toContain("Google no ha concedido el permiso");
    expect(await filas(t)).toHaveLength(0);
  });

  test("capa 2 · una dirección hostil de Google sale escapada (M1)", async () => {
    // 🔴 ESTE CASO EXISTE PORQUE EL ANTERIOR NO SERVÍA. Al fabricarle el rojo a
    // `paginaHtml` (romper el escapado a propósito), el spec seguía en verde: el
    // camino de `error` NO pasa texto del solicitante a la página —lo traduce por
    // una lista cerrada—, así que nunca ejercitaba el escapado.
    //
    // El único valor que SÍ llega a la página desde fuera es la dirección que
    // devuelve Google. Aquí es donde la segunda capa se puede incumplir, y por
    // tanto donde hay que probarla.
    const { t, userId } = await montar();
    entorno();
    globalThis.fetch = googleFalso(true, '</p><script>alert(1)</script><p x="');
    const r = await t.fetch(
      `/gmail/oauth/callback?code=a&state=${await nuevoState(t, userId)}`,
    );
    const html = await r.text();
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("sin clave de cifrado no se escribe, aunque Google conceda", async () => {
    const { t, userId } = await montar();
    entorno();
    delete process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
    globalThis.fetch = googleFalso(true);
    const r = await t.fetch(
      `/gmail/oauth/callback?code=a&state=${await nuevoState(t, userId)}`,
    );
    expect(r.status).toBe(500);
    expect(await filas(t)).toHaveLength(0);
  });
});
