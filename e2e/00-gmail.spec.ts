import { test, expect } from "@playwright/test";
import {
  cifrarToken,
  descifrarToken,
  versionDelFormato,
} from "../convex/model/gmailCrypto";
import {
  mensajeDeErrorDeGoogle,
  paginaHtml,
  urlDeVuelta,
} from "../convex/model/gmailRespuesta";
import {
  debeEscribirse,
  resolverUpsert,
  validarState,
} from "../convex/model/gmailFlow";

// AIT-92 — pruebas UNITARIAS de los contratos de seguridad de la conexión de
// Gmail. No abren navegador, no tocan Convex y no hablan con Google: importan
// las MISMAS funciones que ejecutan `convex/gmail.ts` y `convex/http.ts`, no
// una copia. Van aquí, con prefijo `00-`, porque `PATRON_PRUEBAS_PURAS` las
// manda a `npm run test:unit`.
//
// ⚠️ CADA BLOQUE LLEVA SU CONTROL POSITIVO, y no es ceremonia: casi todos son
// PRUEBAS DE RECHAZO, y una implementación rota en la dirección contraria —que
// rechace siempre— las pasaría todas. El control positivo es lo único que
// distingue «sabe decir que no» de «no sabe decir que sí».

/** Clave de 32 bytes en base64, solo para estas pruebas. No es un secreto de
 *  ningún deployment: se genera aquí y muere aquí. */
function claveDePrueba(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

test.describe("validarState — un solo uso, con caducidad y su dueño", () => {
  const AHORA = 1_000_000;

  test("CONTROL POSITIVO: un state íntegro, vigente y sin usar SÍ vale", () => {
    const v = validarState({ userId: "u1", expiresAt: AHORA + 1 }, AHORA);
    expect(v.ok).toBe(true);
    expect(v.ok && v.userId).toBe("u1");
  });

  test("un state desconocido no vale", () => {
    expect(validarState(null, AHORA)).toEqual({
      ok: false,
      motivo: "desconocido",
    });
  });

  test("un state YA CONSUMIDO no vale una segunda vez", () => {
    const fila = { userId: "u1", expiresAt: AHORA + 1, consumedAt: AHORA - 1 };
    expect(validarState(fila, AHORA)).toEqual({ ok: false, motivo: "ya usado" });
  });

  test("un state caducado no vale", () => {
    expect(validarState({ userId: "u1", expiresAt: AHORA - 1 }, AHORA)).toEqual({
      ok: false,
      motivo: "caducado",
    });
  });

  test("el usuario sale del state, no de la petición", () => {
    // Quien recorre el callback no puede decir de quién es la conexión: se
    // deriva de la fila del `state`. Un parámetro de la URL no puede cambiarlo.
    const v = validarState({ userId: "u2", expiresAt: AHORA + 1 }, AHORA);
    expect(v.ok && v.userId).toBe("u2");
  });
});

test.describe("debeEscribirse — sin refresh token no se escribe", () => {
  test("CONTROL POSITIVO: con los dos tokens, se escribe", () => {
    const d = debeEscribirse({ access_token: "a", refresh_token: "r" });
    expect(d.escribir).toBe(true);
  });

  test("sin refresh_token NO se escribe", () => {
    expect(debeEscribirse({ access_token: "a" })).toEqual({
      escribir: false,
      motivo: "sin token de refresco",
    });
  });

  test("sin access_token tampoco", () => {
    expect(debeEscribirse({ refresh_token: "r" })).toEqual({
      escribir: false,
      motivo: "sin token de acceso",
    });
  });
});

test.describe("resolverUpsert — la unicidad la impone la escritura", () => {
  test("la primera vez CREA, con contador 1", () => {
    expect(resolverUpsert(null)).toEqual({ desenlace: "creada", writeCount: 1 });
  });

  test("un segundo flujo REUTILIZA y el contador sube: llegó a escribir", () => {
    // Es el observable de C15: `reutilizada` acredita que la segunda pasada
    // alcanzó la escritura y no se quedó en un rechazo anterior. Y el contador
    // se puede leer con el cifrado roto, a diferencia de mirar si el cipher
    // cambió — así este criterio no puede ponerse rojo por un fallo del cifrado.
    expect(resolverUpsert({ writeCount: 1 })).toEqual({
      desenlace: "reutilizada",
      writeCount: 2,
    });
  });
});

test.describe("cifrado del token de refresco", () => {
  test("CONTROL POSITIVO: un cifrado íntegro descifra al valor original", async () => {
    const clave = claveDePrueba();
    const guardado = await cifrarToken("token-de-prueba", clave);
    expect(await descifrarToken(guardado, clave)).toBe("token-de-prueba");
  });

  test("cifrar dos veces el MISMO valor da cifrados distintos (nonce nuevo)", async () => {
    const clave = claveDePrueba();
    const a = await cifrarToken("mismo-valor", clave);
    const b = await cifrarToken("mismo-valor", clave);
    expect(a).not.toBe(b);
  });

  test("un byte alterado hace que el descifrado RECHACE, no que devuelva basura", async () => {
    const clave = claveDePrueba();
    const guardado = await cifrarToken("token-de-prueba", clave);
    const partes = guardado.split(".");
    const datos = partes[2];
    // Cambio un carácter del cuerpo cifrado.
    const alterado = `${partes[0]}.${partes[1]}.${
      datos[0] === "A" ? "B" : "A"
    }${datos.slice(1)}`;
    await expect(descifrarToken(alterado, clave)).rejects.toThrow();
  });

  test("con OTRA clave tampoco descifra", async () => {
    const guardado = await cifrarToken("token-de-prueba", claveDePrueba());
    await expect(descifrarToken(guardado, claveDePrueba())).rejects.toThrow();
  });

  test("la versión del formato se lee SIN descifrar", async () => {
    const guardado = await cifrarToken("token-de-prueba", claveDePrueba());
    expect(versionDelFormato(guardado)).toBe("v1");
  });

  test("una clave que no mide 32 bytes se rechaza al nombrarla", async () => {
    await expect(cifrarToken("x", btoa("corta"))).rejects.toThrow(
      /GMAIL_TOKEN_ENCRYPTION_KEY/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AIT-92 ronda 2 · M1 — XSS REFLEJADO EN LA PÁGINA DEL CALLBACK
// El auditor lo demostró EJECUTÁNDOLO: un valor que cierra `<p>` e introduce
// `<script>` producía `scriptTags: 1` y `escapedLt: 0`. La puerta era la rama de
// manejo de errores, la que existe para ser amable cuando algo falla.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("la página del callback no refleja HTML del solicitante", () => {
  const PAYLOAD = '</p><script>alert(1)</script><p x="';

  test("CONTROL POSITIVO: el instrumento SÍ ve una etiqueta cuando la hay", () => {
    // Sin esto, «no encontré <script>» no distingue «está escapado» de «mi
    // búsqueda no sabía buscarlo».
    const conEtiqueta = `<p>${PAYLOAD}</p>`;
    expect(conEtiqueta).toContain("<script>");
  });

  test("un payload en el detalle sale escapado, no interpretado", () => {
    const html = paginaHtml("Título", PAYLOAD, "https://app.example/ajustes");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("un payload en el título tampoco pasa", () => {
    const html = paginaHtml(PAYLOAD, "detalle", "https://app.example/ajustes");
    expect(html).not.toContain("<script>");
  });

  test("un payload en la URL de vuelta no rompe el atributo", () => {
    const html = paginaHtml("t", "d", '"><script>alert(1)</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&quot;");
  });

  test("el código de error de Google NO se refleja: se traduce", () => {
    // La lista cerrada no depende de que el escapado sea perfecto.
    expect(mensajeDeErrorDeGoogle(PAYLOAD)).not.toContain("<");
    expect(mensajeDeErrorDeGoogle(PAYLOAD)).toBe(
      "Google no ha concedido el permiso. No se ha guardado nada.",
    );
  });

  test("CONTROL POSITIVO: un código conocido sí da su mensaje propio", () => {
    expect(mensajeDeErrorDeGoogle("access_denied")).toContain("Rechazaste");
  });
});

test.describe("M3 · la vuelta a Ajustes apunta a la app, no al host de Convex", () => {
  test("con SITE_URL, la URL es absoluta al origen de la app", () => {
    expect(urlDeVuelta("https://app.example")).toBe("https://app.example/ajustes");
    expect(urlDeVuelta("https://app.example/")).toBe("https://app.example/ajustes");
  });

  test("sin SITE_URL cae a la relativa, que es lo único que queda", () => {
    // Se declara: en ese caso el enlace sigue aterrizando en el host de Convex.
    // No se inventa un dominio.
    expect(urlDeVuelta(undefined)).toBe("/ajustes");
  });
});
