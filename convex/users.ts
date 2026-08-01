import { v } from "convex/values";
import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";

export const ensureDefaultStore = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    // El esquema no puede imponer unicidad en `appConfig.key` (Convex no
    // tiene índices únicos); se comprueba aquí a mano para fallar con un
    // mensaje claro en vez del error genérico que lanzaría `.unique()`
    // si alguna vez hubiera dos documentos "default_store".
    const matches = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", "default_store"))
      .collect();
    if (matches.length > 1) {
      throw new Error(
        `appConfig tiene ${matches.length} documentos con key="default_store"; debería haber como mucho 1.`,
      );
    }
    const existing = matches[0];
    if (existing?.storeId !== undefined) {
      console.warn(
        `ensureDefaultStore: ya existe (storeId=${existing.storeId}); no se crea de nuevo.`,
      );
      return existing.storeId;
    }
    const storeId = await ctx.db.insert("stores", { name });
    if (existing) await ctx.db.patch(existing._id, { storeId });
    else await ctx.db.insert("appConfig", { key: "default_store", storeId });
    return storeId;
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
  },
});

// Reserva atómica de un slot de bootstrap: al ser una única mutation, Convex
// serializa (OCC) las ejecuciones concurrentes que compiten por la misma
// `claimKey` — como mucho una consigue `true`. Cierra la carrera de
// bootstrapInitialAccounts entre "comprobar si existe" y "crear la cuenta",
// que al vivir en un internalAction no tiene esa garantía por sí sola.
export const claimBootstrapSlot = internalMutation({
  args: { claimKey: v.string() },
  handler: async (ctx, { claimKey }) => {
    const existing = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", claimKey))
      .unique();
    if (existing) return false;
    await ctx.db.insert("appConfig", { key: claimKey });
    return true;
  },
});

// Contraparte de claimBootstrapSlot: se llama siempre que createAccount
// termina (éxito o fallo) para que un claim nunca quede huérfano bloqueando
// reintentos futuros. No cubre un proceso que muere en seco a mitad (fuera
// de alcance para un script manual de un solo operador).
export const releaseBootstrapSlot = internalMutation({
  args: { claimKey: v.string() },
  handler: async (ctx, { claimKey }) => {
    const existing = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", claimKey))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const bootstrapInitialAccounts = internalAction({
  args: {},
  handler: async (ctx) => {
    const ownerPassword = process.env.SEED_OWNER_PASSWORD;
    const salesPassword = process.env.SEED_SALES_PASSWORD;
    if (!ownerPassword || !salesPassword) {
      throw new Error(
        "Faltan SEED_OWNER_PASSWORD / SEED_SALES_PASSWORD en el deployment de Convex.",
      );
    }
    const storeId = await ctx.runMutation(internal.users.ensureDefaultStore, {
      name: "Tienda principal",
    });

    // Idempotencia comprobada a mano en 2 pasos: 1) si el usuario ya existe
    // en la tabla `users`, no se toca (re-ejecución secuencial tras un
    // bootstrap anterior completado). 2) si no existe, se reclama un slot
    // vía claimBootstrapSlot antes de crear la cuenta — al ser una mutation
    // atómica, dos ejecuciones concurrentes no pueden ganar la misma clave,
    // así que como mucho una de ellas llega a llamar a `createAccount`.
    async function provisionAccount(
      email: string,
      secret: string,
      profile: { name: string; role: "owner" | "sales" },
    ) {
      if (await ctx.runQuery(internal.users.getUserByEmail, { email })) {
        console.warn(`bootstrapInitialAccounts: ${email} ya existe; no se crea de nuevo.`);
        return;
      }
      const claimed = await ctx.runMutation(internal.users.claimBootstrapSlot, {
        claimKey: `bootstrap_claim:${email}`,
      });
      if (!claimed) {
        console.warn(
          `bootstrapInitialAccounts: otra ejecución concurrente ya está creando ${email} ahora mismo; se omite aquí para evitar duplicados.`,
        );
        return;
      }
      let creationError: unknown = null;
      try {
        await createAccount(ctx, {
          provider: "password",
          account: { id: email, secret },
          profile: { email, ...profile, storeId },
        });
      } catch (err) {
        creationError = err;
      }

      // Comprobación explícita, no solo el try/catch: si ya existe una cuenta
      // huérfana en `authAccounts` para este email (users borrado a mano sin
      // borrar authAccounts), createAccount no lanza ninguna excepción
      // capturable — simplemente no crea nada, en silencio (comprobado
      // contra el deployment real en la ronda de auditoría 4). Sin este
      // chequeo, ese caso pasaría desapercibido y el claim se quedaría
      // reservado para siempre.
      const created = await ctx.runQuery(internal.users.getUserByEmail, { email });
      if (!created) {
        await ctx.runMutation(internal.users.releaseBootstrapSlot, {
          claimKey: `bootstrap_claim:${email}`,
        });
        throw new Error(
          `Fallo creando la cuenta ${email}. Antes de reintentar, revisa a mano las tablas "authAccounts" y "users" en el dashboard de Convex.` +
            (creationError
              ? ` Error original: ${creationError}`
              : " createAccount no lanzó ningún error explícito; probablemente ya existe una cuenta huérfana en authAccounts para este email."),
        );
      }
    }

    // Direcciones exactamente como en Design/pantallas/Login.dc.html.
    await provisionAccount("marta@supercrm.es", ownerPassword, {
      name: "Marta",
      role: "owner",
    });
    await provisionAccount("carlos@supercrm.es", salesPassword, {
      name: "Carlos",
      role: "sales",
    });
  },
});

export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return (await ctx.db.get(userId))?.role ?? null;
  },
});
