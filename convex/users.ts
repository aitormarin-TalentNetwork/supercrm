import { v } from "convex/values";
import {
  createAccount,
  getAuthUserId,
  invalidateSessions,
} from "@convex-dev/auth/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner, requireUser } from "./model/access";
import type { Id } from "./_generated/dataModel";

// AIT-52 (Post-MVP): el provider Password de convex/auth.ts no impone hoy
// ningún mínimo propio (comprobado en su código) — se fija aquí, en el
// único punto donde Marta introduce una contraseña nueva a mano (las
// cuentas de bootstrapInitialAccounts vienen de variables de entorno, sin
// pasar por esta validación).
const MIN_PASSWORD_LENGTH = 8;

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

// AIT-31 (multi-tienda): tienda genérica adicional, para cuando
// bootstrapInitialAccounts crea más de una. No reutiliza ensureDefaultStore
// — esa sigue ligada al singleton `appConfig.key = "default_store"`, que
// solo tiene sentido para "la" tienda por defecto original (no hay
// "default_store_2"). `stores` no tiene índice por `name` (tabla pequeña,
// unos pocos tenants) — mismo patrón que otras tablas pequeñas del
// proyecto (p.ej. nextSteps.ts:getSalesUsersForStore), collect + filtro en
// vez de un índice dedicado. Idempotente por nombre exacto, igual que
// ensureDefaultStore, para que bootstrapInitialAccounts se pueda
// re-ejecutar sin duplicar tiendas.
export const ensureStore = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const existing = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("stores", { name });
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

// AIT-31 (multi-tienda): generalizada para poder crear más de una tienda y
// más de las 2 cuentas originales — antes asumía una única tienda por
// defecto ("Tienda principal", marta owner + carlos sales) sin forma de
// pedir otra. `stores` es opcional a propósito: sin argumentos (o `{}`),
// el comportamiento es EXACTAMENTE el de siempre — no rompe el flujo ya
// documentado en docs/03-setup.md (`npx convex run
// users:bootstrapInitialAccounts '{}'`) ni los despliegues que ya
// dependen de él. Con `stores`, crea cada tienda (vía ensureStore, no
// ensureDefaultStore — esa sigue ligada al singleton de la tienda por
// defecto) y sus cuentas, con el nuevo rol `storeManager` disponible.
// Cada contraseña se lee de una variable de entorno indicada por nombre
// (`passwordEnvVar`), nunca en claro en el argumento — mismo criterio que
// las 2 cuentas originales con SEED_OWNER_PASSWORD/SEED_SALES_PASSWORD.
export const bootstrapInitialAccounts = internalAction({
  args: {
    stores: v.optional(
      v.array(
        v.object({
          storeName: v.string(),
          accounts: v.array(
            v.object({
              email: v.string(),
              name: v.string(),
              role: v.union(
                v.literal("owner"),
                v.literal("storeManager"),
                v.literal("sales"),
              ),
              passwordEnvVar: v.string(),
            }),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Idempotencia comprobada a mano en 2 pasos: 1) si el usuario ya existe
    // en la tabla `users`, no se toca (re-ejecución secuencial tras un
    // bootstrap anterior completado). 2) si no existe, se reclama un slot
    // vía claimBootstrapSlot antes de crear la cuenta — al ser una mutation
    // atómica, dos ejecuciones concurrentes no pueden ganar la misma clave,
    // así que como mucho una de ellas llega a llamar a `createAccount`.
    async function provisionAccount(
      email: string,
      secret: string,
      profile: { name: string; role: "owner" | "storeManager" | "sales" },
      storeId: Id<"stores">,
    ) {
      if (await ctx.runQuery(internal.users.getUserByEmail, { email })) {
        console.warn(
          `bootstrapInitialAccounts: ${email} ya existe; no se crea de nuevo.`,
        );
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
      const created = await ctx.runQuery(internal.users.getUserByEmail, {
        email,
      });
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

    if (args.stores === undefined) {
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
      // Direcciones exactamente como en Design/pantallas/Login.dc.html.
      await provisionAccount(
        "marta@supercrm.es",
        ownerPassword,
        { name: "Marta", role: "owner" },
        storeId,
      );
      await provisionAccount(
        "carlos@supercrm.es",
        salesPassword,
        { name: "Carlos", role: "sales" },
        storeId,
      );
      return;
    }

    for (const storeDef of args.stores) {
      const storeId = await ctx.runMutation(internal.users.ensureStore, {
        name: storeDef.storeName,
      });
      for (const account of storeDef.accounts) {
        const secret = process.env[account.passwordEnvVar];
        if (!secret) {
          throw new Error(
            `Falta la variable de entorno "${account.passwordEnvVar}" en el deployment de Convex (cuenta ${account.email}).`,
          );
        }
        await provisionAccount(
          account.email,
          secret,
          { name: account.name, role: account.role },
          storeId,
        );
      }
    }
  },
});

export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    // AIT-52 (Post-MVP, hallazgo de auditoría NO-GO loop2): esta query no
    // pasa por requireUser (proxy.ts la llama directamente para decidir
    // acceso a rutas owner-only, antes de que exista ningún QueryCtx de
    // una función normal) — sin este chequeo, un usuario desactivado
    // conservaba su rol aquí y proxy.ts lo seguía dejando entrar en
    // /panel y /supervision como si nada, aunque cualquier query de
    // datos real le fuera a rechazar después. Mismo criterio que
    // "usuario no encontrado": se trata como si no hubiera rol.
    if (user === null || user.active === false) return null;
    return user.role;
  },
});

export const getCurrentUserInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const store = await ctx.db.get(user.storeId);
    return {
      name: user.name ?? "",
      // AIT-50: pantalla Ajustes (solo lectura) — no había ningún
      // consumidor de email hasta ahora, por eso no estaba en esta query.
      email: user.email ?? "",
      storeName: store?.name ?? "",
    };
  },
});

// AIT-52 (Post-MVP): lista para la sección "Usuarios" de Ajustes — solo
// owner (ve el negocio entero, igual que stores.listStores). Incluye a
// la propia Marta y a cualquier otra cuenta owner que pudiera existir en
// el futuro: se filtra en la UI, no aquí, para que la lista sea la
// fuente de verdad completa. `active` con el mismo fallback `?? true`
// que el resto de lugares que lo leen (opcional en el schema).
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const users = await ctx.db.query("users").collect();
    const stores = await ctx.db.query("stores").collect();
    const storeNameById = new Map(
      stores.map((store) => [store._id, store.name]),
    );
    return users
      .filter((user) => user.email !== undefined)
      .map((user) => ({
        id: user._id,
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role,
        storeId: user.storeId,
        storeName: storeNameById.get(user.storeId) ?? "—",
        active: user.active ?? true,
      }));
  },
});

// AIT-52 (Post-MVP): alta de usuario por Marta desde /ajustes — mismo
// mecanismo que bootstrapInitialAccounts (createAccount +
// convex/auth.ts:createOrUpdateUser crea la fila en `users`), pero
// disparado en caliente por una persona en vez de un script. Es una
// `action` pública (no mutation): createAccount ya se usaba así en
// bootstrapInitialAccounts y necesita ese contexto — requireOwner no se
// puede llamar directamente aquí (necesita QueryCtx/MutationCtx, no
// ActionCtx), así que el chequeo de rol se hace vía runQuery contra
// getCurrentUserRole, mismo patrón que ya usa esta acción para
// getUserByEmail más abajo.
export const createUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    // Nunca "owner" — no se puede crear otra dueña desde aquí (ni el
    // propio schema de authTables lo distingue del resto: es una
    // decisión de producto, impuesta en el union de args, no en el
    // schema de la tabla).
    role: v.union(v.literal("sales"), v.literal("storeManager")),
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const role = await ctx.runQuery(
      internal.users.getCurrentUserRoleInternal,
      {},
    );
    if (role !== "owner") {
      throw new Error("Solo la dueña puede crear usuarios.");
    }

    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error("El email es obligatorio.");
    const name = args.name.trim();
    if (!name) throw new Error("El nombre es obligatorio.");
    if (args.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }

    const existing = await ctx.runQuery(internal.users.getUserByEmail, {
      email,
    });
    if (existing) {
      throw new Error("Ya existe un usuario con ese email.");
    }
    const store = await ctx.runQuery(internal.users.getStoreInternal, {
      storeId: args.storeId,
    });
    if (store === null) {
      throw new Error("La tienda indicada no existe.");
    }

    await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.password },
      profile: { email, name, role: args.role, storeId: args.storeId },
    });
  },
});

// Auxiliares internas para createUser (action, sin ctx.db propio).
export const getCurrentUserRoleInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    // AIT-52 (hallazgo de auditoría NO-GO loop2): mismo criterio que
    // getCurrentUserRole — un owner nunca puede quedar `active: false`
    // (setUserActive lo rechaza), así que hoy esto no es explotable vía
    // createUser, pero se corrige igualmente como defensa en profundidad
    // consistente en vez de dejar una variante interna con un criterio
    // distinto al de la pública.
    if (user === null || user.active === false) return null;
    return user.role;
  },
});

export const getStoreInternal = internalQuery({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    return await ctx.db.get(storeId);
  },
});

// AIT-52 (Post-MVP): editar nombre/rol/tienda de un usuario existente.
// No permite editar a una cuenta owner (ni convertir a alguien EN owner,
// ni tocar a la propia Marta desde aquí) — mismo criterio de "nunca
// owner" que createUser.
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    role: v.union(v.literal("sales"), v.literal("storeManager")),
    storeId: v.id("stores"),
  },
  handler: async (ctx, { userId, name, role, storeId }) => {
    await requireOwner(ctx);
    const target = await ctx.db.get(userId);
    if (target === null) throw new Error("Usuario no encontrado.");
    if (target.role === "owner") {
      throw new Error("No se puede editar a la dueña desde aquí.");
    }
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("El nombre es obligatorio.");
    if ((await ctx.db.get(storeId)) === null) {
      throw new Error("La tienda indicada no existe.");
    }
    await ctx.db.patch(userId, { name: trimmedName, role, storeId });
  },
});

// AIT-52 (Post-MVP): desactivar/reactivar acceso sin borrar el
// historial del usuario — el campo `active` es lo único que cambia,
// oportunidades/interacciones/nextSteps ya creados por este usuario no
// se tocan (siguen apuntando a su mismo ownerId/authorId/assigneeId de
// siempre). El bloqueo real de acceso vive en varios sitios, no aquí
// (esta action solo marca el estado y dispara la invalidación):
// convex/auth.ts:beforeSessionCreation (bloquea logins nuevos),
// convex/model/access.ts:requireUser + getCurrentUserRole/
// getCurrentUserRoleInternal (cortan el acceso de una sesión ya abierta
// en su siguiente llamada — hallazgo de auditoría NO-GO loop2:
// requireUser en la práctica no era el único punto de control, esas dos
// queries de rol tampoco comprobaban `active`).
//
// La invalidación de sesiones de abajo (`invalidateSessions`) borra la
// fila de `authSessions` y su refresh token — impide que el cliente
// obtenga un access token NUEVO una vez caduque el que ya tenía (por
// defecto, hasta 1h), y fuerza un re-login real para volver a entrar.
// OJO (comprobado en verificación en vivo, no asumido): NO revoca al
// instante un access token JWT ya emitido y todavía vigente — es
// stateless, Convex solo comprueba firma + `exp`, sin consultar
// `authSessions` en cada llamada. Mientras ese JWT no caduque, sigue
// siendo "válido" a nivel de autenticación; lo que impide que haga nada
// útil son los chequeos explícitos de `active` de arriba, no esta
// invalidación. Cerrar ese hueco residual del todo requeriría acortar
// jwt.durationMs globalmente — decisión de producto más amplia, fuera
// de alcance de esta tarea, documentada aquí para que quede explícita.
//
// Es `action` (no mutation, a diferencia del loop1) porque
// `invalidateSessions` de @convex-dev/auth necesita ActionCtx — la
// comprobación de rol y el patch en sí viven en `setUserActiveInternal`
// de abajo, invocada vía runMutation (mismo patrón que ya usa
// `createUser` para `createAccount`).
export const setUserActive = action({
  args: { userId: v.id("users"), active: v.boolean() },
  handler: async (ctx, { userId, active }) => {
    await ctx.runMutation(internal.users.setUserActiveInternal, {
      userId,
      active,
    });
    if (!active) {
      await invalidateSessions(ctx, { userId });
    }
  },
});

export const setUserActiveInternal = internalMutation({
  args: { userId: v.id("users"), active: v.boolean() },
  handler: async (ctx, { userId, active }) => {
    // requireOwner ya garantiza que quien llama es owner — como esta
    // función bloquea target.role === "owner" justo debajo, nunca puede
    // coincidir con quien llama (no hace falta comparar _id aparte).
    await requireOwner(ctx);
    const target = await ctx.db.get(userId);
    if (target === null) throw new Error("Usuario no encontrado.");
    if (target.role === "owner") {
      throw new Error("No se puede desactivar a la dueña.");
    }
    await ctx.db.patch(userId, { active });
  },
});
