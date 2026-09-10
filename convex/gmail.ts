import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./model/access";
import {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_TOKEN_ENCRYPTION_KEY,
} from "./model/gmailCrypto";
import { resolverUpsert, validarState } from "./model/gmailFlow";

// AIT-92 (Ola 2) · Conectar una cuenta de Gmail. Acaba en "hay un token de
// refresco válido guardado y la pantalla lo dice". La sincronización de correo
// es AIT-98, y la PRUEBA de consentimiento real es AIT-144 (solo la puede
// ejecutar Aitor: exige una cuenta del dominio).

/** Un solo permiso, y de solo lectura. Nada de `gmail.send`. */
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const RUTA_CALLBACK = "/gmail/oauth/callback";
/** El `state` caduca pronto: es un ida y vuelta por el navegador, no una sesión. */
const VIDA_DEL_STATE_MS = 10 * 60 * 1000;

// ───────────────────────────────────────────────────────────────────────────
// PRECONDICIONES · Los tres ejes, y NO tienen el mismo contrato
// ───────────────────────────────────────────────────────────────────────────
// Se comprueban ANTES de mandar a nadie a Google, no en el callback. Si el CRM
// no está en condiciones de guardar el resultado, el botón lo dice y no se sale
// de la app: el eje de la clave falla AL GUARDAR, o sea DESPUÉS del
// consentimiento — en el único punto del recorrido donde el usuario ya ha hecho
// su parte. Comprobar antes convierte el fallo más caro en el más barato.

export type FaltaPrecondicion = {
  variable: string;
  deployment: string;
  queHacer: string;
};

function urlDelSitio(): string {
  // `CONVEX_SITE_URL` la pone Convex: es el dominio .convex.site de ESTE
  // deployment, que es el que tiene que estar registrado en el cliente OAuth.
  return process.env.CONVEX_SITE_URL ?? "";
}

export function nombreDelDeployment(): string {
  const sitio = urlDelSitio();
  const m = sitio.match(/^https?:\/\/([^.]+)\./);
  return m ? m[1] : sitio || "(deployment desconocido)";
}

/** Faltantes de los ejes 2 y 3, que SÍ son comprobables en servidor. */
function precondicionesQueFaltan(): FaltaPrecondicion[] {
  const deployment = nombreDelDeployment();
  const faltan: FaltaPrecondicion[] = [];
  for (const variable of [
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_TOKEN_ENCRYPTION_KEY,
  ]) {
    if (!process.env[variable]) {
      faltan.push({
        variable,
        deployment,
        queHacer: `npx convex env set ${variable} <valor> --deployment ${deployment}`,
      });
    }
  }
  return faltan;
}

/** Estado de la conexión + lo que falta para poder conectar.
 *  ⛔ NO devuelve el token, ni cifrado. No hay función que lo devuelva. */
export const getConnectionState = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const cuentas = await ctx.db
      .query("gmailAccounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      accounts: cuentas
        .filter((c) => c.status === "connected")
        .map((c) => ({
          id: c._id,
          emailAddress: c.emailAddress,
          connectedAt: c.connectedAt,
        })),
      faltan: precondicionesQueFaltan(),
      // EJE 1 · La URI que ESTE deployment va a usar. No se afirma que esté
      // registrada ni que falte: eso vive en la consola de Google y el
      // servidor no puede saberlo. Se presenta para que quien lea un error de
      // Google pueda compararla sin adivinar. Prometer más sería el falso
      // verde de esta ficha: un "la URI no está registrada" afirmado sin poder
      // saberlo manda a alguien a buscar donde quizá no está el problema.
      uriDeRedireccion: `${urlDelSitio()}${RUTA_CALLBACK}`,
    };
  },
});

// ───────────────────────────────────────────────────────────────────────────
// INICIO DEL FLUJO
// ───────────────────────────────────────────────────────────────────────────

export const crearState = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Impredecible: 32 bytes del generador criptográfico, no `Math.random`.
    const bytes = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)));
    const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    await ctx.db.insert("gmailOauthStates", {
      state,
      userId,
      expiresAt: Date.now() + VIDA_DEL_STATE_MS,
    });
    return state;
  },
});

export const startConnect = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const userId = await ctx.runQuery(internal.gmail.usuarioActual, {});

    // GATE: si falta cualquiera de los ejes comprobables, NO se navega.
    const faltan: FaltaPrecondicion[] = await ctx.runQuery(
      internal.gmail.faltantes,
      {},
    );
    if (faltan.length > 0) {
      const lista = faltan
        .map((f) => `${f.variable} (deployment ${f.deployment})`)
        .join(", ");
      throw new Error(
        `No se puede conectar Gmail desde este deployment: falta ${lista}. ` +
          `No te he mandado a Google porque el CRM no podría guardar el ` +
          `resultado: darías tu permiso para nada.`,
      );
    }

    const state = await ctx.runMutation(internal.gmail.crearState, { userId });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env[GMAIL_CLIENT_ID]!);
    url.searchParams.set("redirect_uri", `${urlDelSitio()}${RUTA_CALLBACK}`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPE);
    // Sin `offline` Google no devuelve refresh token; sin `consent` deja de
    // devolverlo en las reautorizaciones — y ese fallo aparecería semanas
    // después, en la reconexión de alguien.
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  },
});

export const usuarioActual = internalQuery({
  args: {},
  handler: async (ctx) => (await requireUser(ctx))._id,
});

export const faltantes = internalQuery({
  args: {},
  handler: async (): Promise<FaltaPrecondicion[]> => precondicionesQueFaltan(),
});

// ───────────────────────────────────────────────────────────────────────────
// CALLBACK · fail-closed: ninguna validación fallida escribe nada
// ───────────────────────────────────────────────────────────────────────────

/** Consume el `state`: comprueba existencia, caducidad, consumo previo, y
 *  devuelve a quién pertenece. Es una mutation para que la comprobación y el
 *  consumo ocurran en la MISMA transacción — si fueran dos pasos, dos llegadas
 *  simultáneas del mismo `state` pasarían las dos. */
export const consumirState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const fila = await ctx.db
      .query("gmailOauthStates")
      .withIndex("by_state", (q) => q.eq("state", state))
      .unique();
    const veredicto = validarState(fila, Date.now());
    if (!veredicto.ok) return { ok: false as const, motivo: veredicto.motivo };
    await ctx.db.patch(fila!._id, { consumedAt: Date.now() });
    return { ok: true as const, userId: fila!.userId };
  },
});

/** Escribe la conexión. La unicidad la impone AQUÍ la escritura, no el índice:
 *  se consulta por (userId, emailAddress) dentro de la misma mutation y se
 *  reutiliza la fila si existe. Devuelve su desenlace —`creada` o
 *  `reutilizada`— porque es el observable de que un segundo flujo llegó a
 *  escribir, y `writeCount` lo corrobora sin depender del cifrado. */
export const guardarConexion = internalMutation({
  args: {
    userId: v.id("users"),
    emailAddress: v.string(),
    refreshTokenCipher: v.string(),
  },
  handler: async (ctx, { userId, emailAddress, refreshTokenCipher }) => {
    const user = await ctx.db.get(userId);
    if (user === null) throw new Error("Usuario no encontrado.");
    const existente = await ctx.db
      .query("gmailAccounts")
      .withIndex("by_user_email", (q) =>
        q.eq("userId", userId).eq("emailAddress", emailAddress),
      )
      .unique();

    const upsert = resolverUpsert(existente);
    if (existente !== null) {
      await ctx.db.patch(existente._id, {
        refreshTokenCipher,
        status: "connected",
        writeCount: upsert.writeCount,
      });
      return upsert;
    }
    await ctx.db.insert("gmailAccounts", {
      userId,
      storeId: user.storeId,
      emailAddress,
      refreshTokenCipher,
      connectedAt: Date.now(),
      writeCount: upsert.writeCount,
      status: "connected",
    });
    return upsert;
  },
});

// ───────────────────────────────────────────────────────────────────────────
// DESCONECTAR
// ───────────────────────────────────────────────────────────────────────────

export const disconnect = mutation({
  args: { accountId: v.id("gmailAccounts") },
  handler: async (ctx, { accountId }) => {
    const user = await requireUser(ctx);
    const cuenta = await ctx.db.get(accountId);
    // Nadie desconecta la cuenta de otro, ni owner ni storeManager (PRD CU6).
    if (cuenta === null || cuenta.userId !== user._id) {
      throw new Error("Esa conexión no es tuya.");
    }
    // Se borra la fila entera: el token no se conserva "por si acaso".
    // ⚠️ Los correos ya guardados NO se borran — son historial de la
    // oportunidad, no del vendedor, y sobreviven a la rotación de comerciales
    // (decisión de producto, PRD). Hoy no hay correos todavía.
    await ctx.db.delete(accountId);
    return { ok: true };
  },
});
