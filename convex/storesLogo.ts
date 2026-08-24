"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
// AIT-61 (auditoría, plan ronda 6): además del límite de bytes
// comprimidos, un tope de píxeles totales — evita que un archivo pequeño
// en bytes declare unas dimensiones absurdas y fuerce un decode/memoria
// desproporcionados (bomba de descompresión).
const MAX_LOGO_MEGAPIXELS = 20;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function isPngSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)
  );
}

function isJpegSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

// Lectura barata del IHDR (bytes fijos 16-23) ANTES de invocar el decode
// completo — solo para descartar cuanto antes una bomba de
// descompresión declarada; NO es la validación de contenido en sí (esa
// la hace PNG.sync.read más abajo, que decodifica e infla los chunks
// IDAT de verdad).
function declaredPngMegapixels(bytes: Uint8Array): number | null {
  if (bytes.length < 24) return null;
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  if (width === 0 || height === 0) return null;
  return (width * height) / 1_000_000;
}

// AIT-61 (auditoría, plan rondas 4/5/6, M1 — tercer y último intento):
// en vez de un parser a medida que solo comprueba estructura superficial
// (cabecera + terminador, ronda 5 — seguía aceptando un cuerpo relleno
// de basura entre los dos), esto decodifica de verdad con una librería
// ya probada. `PNG.sync.read` con `checkCRC` (por defecto `true`)
// rechaza cualquier chunk cuyo CRC32 no cuadre, e infla de verdad el
// stream zlib de los chunks IDAT — basura entre cabecera y terminador ya
// no pasa.
function decodesAsValidPng(bytes: Uint8Array): boolean {
  if (!isPngSignature(bytes)) return false;
  const megapixels = declaredPngMegapixels(bytes);
  if (megapixels === null || megapixels > MAX_LOGO_MEGAPIXELS) return false;
  try {
    const png = PNG.sync.read(Buffer.from(bytes));
    return png.width > 0 && png.height > 0;
  } catch {
    return false;
  }
}

// `tolerantDecoding: false` (por defecto jpeg-js ES tolerante con JPEGs
// técnicamente inválidos — aquí se desactiva esa tolerancia a
// propósito, porque el objetivo es justo lo contrario: rechazar
// contenido inválido). `maxResolutionInMP`/`maxMemoryUsageInMB` son
// guardas nativas de la librería frente a bombas de descompresión.
function decodesAsValidJpeg(bytes: Uint8Array): boolean {
  if (!isJpegSignature(bytes)) return false;
  try {
    const decoded = jpeg.decode(Buffer.from(bytes), {
      tolerantDecoding: false,
      maxResolutionInMP: MAX_LOGO_MEGAPIXELS,
      maxMemoryUsageInMB: 128,
    });
    return decoded.width > 0 && decoded.height > 0;
  } catch {
    return false;
  }
}

// AIT-61 (auditoría, plan ronda 3 M1 / ronda 4 M1 / ronda 5 M2):
// `ctx.storage.get()` solo existe en actions (no en mutations) — mismo
// patrón que `convex/users.ts::createUser` (action sin `ctx.db` propio:
// valida rol vía runQuery a una internal query, delega el escrito de
// verdad a una internal mutation). La comprobación de rol es la PRIMERA
// operación — esa rama de rechazo no toca `ctx.storage` en ningún caso
// (M2): un llamante no autorizado nunca puede provocar el borrado de un
// `storageId`, sea cual sea el que aporte.
export const setLogo = action({
  args: { storeId: v.id("stores"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const role = await ctx.runQuery(
      internal.users.getCurrentUserRoleInternal,
      {},
    );
    if (role !== "owner") {
      throw new Error("Solo la dueña puede cambiar el logo.");
    }

    const store = await ctx.runQuery(internal.users.getStoreInternal, {
      storeId: args.storeId,
    });
    if (store === null) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Tienda no encontrada.");
    }

    const blob = await ctx.storage.get(args.storageId);
    if (blob === null) {
      throw new Error("El archivo subido no se encuentra.");
    }
    if (blob.size > MAX_LOGO_BYTES) {
      await ctx.storage.delete(args.storageId);
      throw new Error("El logo no puede superar los 2MB.");
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!decodesAsValidPng(bytes) && !decodesAsValidJpeg(bytes)) {
      await ctx.storage.delete(args.storageId);
      throw new Error("El logo debe ser una imagen PNG o JPEG válida.");
    }

    await ctx.runMutation(internal.stores.applyLogo, {
      storeId: args.storeId,
      storageId: args.storageId,
    });
  },
});
