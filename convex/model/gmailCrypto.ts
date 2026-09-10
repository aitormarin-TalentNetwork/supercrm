// AIT-92 · Cifrado del token de refresco de Gmail.
//
// El token de refresco es EL secreto de la Ola 2: con él se lee el buzón de
// una persona. Se guarda cifrado con `GMAIL_TOKEN_ENCRYPTION_KEY`, que vive en
// el entorno del deployment y NO en la base de datos — la clave al lado del
// dato que protege no protege de nada: quien alcance la base tendría las dos
// cosas y cifrar sería un adorno con coste.
//
// La clave es DISTINTA POR DEPLOYMENT a propósito: un token cifrado en dev no
// debe poder leerse en producción, porque son buzones de personas distintas.
// ⚠️ Y la consecuencia, escrita también en docs/03-setup.md: si esa clave se
// pierde o se rota, los tokens guardados dejan de poder descifrarse y los
// usuarios tienen que RECONECTAR su Gmail. No se pierde correo: se pierde la
// conexión.

/** Nombre canónico. Se declara UNA vez para que fijarlo sea cambiar una línea
 *  y no una búsqueda por el repositorio (AIT-92, M3). */
export const GMAIL_TOKEN_ENCRYPTION_KEY = "GMAIL_TOKEN_ENCRYPTION_KEY";
export const GMAIL_CLIENT_ID = "GMAIL_CLIENT_ID";
export const GMAIL_CLIENT_SECRET = "GMAIL_CLIENT_SECRET";

/** Versión del formato, DENTRO del dato. Sin ella, el día de una rotación no
 *  habría forma de distinguir las filas viejas de las nuevas sin descifrarlas
 *  —que es justo lo que no se puede hacer si la clave cambió. */
const FORMATO = "v1";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function aBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function deBase64(texto: string): Uint8Array<ArrayBuffer> {
  const bin = atob(texto);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importarClave(claveBase64: string): Promise<CryptoKey> {
  const bruta = deBase64(claveBase64);
  if (bruta.length !== 32) {
    throw new Error(
      `${GMAIL_TOKEN_ENCRYPTION_KEY} tiene ${bruta.length} bytes y se esperan 32 ` +
        `(AES-256 en base64). Genérala de nuevo y vuelve a darla de alta.`,
    );
  }
  return crypto.subtle.importKey("raw", bruta, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Cifra con AES-GCM (autenticado) y NONCE NUEVO en cada llamada.
 *  Nonce nuevo por escritura no es un detalle: con nonce fijo, dos cifrados del
 *  mismo valor son idénticos y el propio dato delata que no cambió. */
export async function cifrarToken(
  claro: string,
  claveBase64: string,
): Promise<string> {
  const clave = await importarClave(claveBase64);
  const nonce = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      clave,
      encoder.encode(claro),
    ),
  );
  return `${FORMATO}.${aBase64(nonce)}.${aBase64(cifrado)}`;
}

/** Descifra y RECHAZA si el dato fue manipulado. AES-GCM es cifrado
 *  autenticado: un byte alterado hace fallar `decrypt`, no devuelve basura.
 *  Un cifrado sin autenticar dejaría entrar en el sistema un valor manipulado
 *  como si fuera bueno. */
export async function descifrarToken(
  guardado: string,
  claveBase64: string,
): Promise<string> {
  const partes = guardado.split(".");
  if (partes.length !== 3 || partes[0] !== FORMATO) {
    throw new Error(
      `Formato de token cifrado no reconocido (se esperaba "${FORMATO}.<nonce>.<datos>").`,
    );
  }
  const clave = await importarClave(claveBase64);
  const claro = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: deBase64(partes[1]) },
    clave,
    deBase64(partes[2]),
  );
  return decoder.decode(claro);
}

/** La versión de formato se puede leer SIN descifrar. */
export function versionDelFormato(guardado: string): string | null {
  const v = guardado.split(".")[0];
  return v === "" ? null : v;
}
