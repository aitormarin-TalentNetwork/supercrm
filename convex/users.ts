import { v } from "convex/values";
import { getAuthUserId, invalidateSessions } from "@convex-dev/auth/server";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner, requireUser } from "./model/access";
import type { Id } from "./_generated/dataModel";

async function ensureDefaultStoreCore(
  ctx: MutationCtx,
  name: string,
): Promise<Id<"stores">> {
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
}

export const ensureDefaultStore = internalMutation({
  args: { name: v.string() },
  handler: (ctx, { name }) => ensureDefaultStoreCore(ctx, name),
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
async function ensureStoreCore(
  ctx: MutationCtx,
  name: string,
): Promise<Id<"stores">> {
  const existing = await ctx.db
    .query("stores")
    .filter((q) => q.eq(q.field("name"), name))
    .first();
  if (existing) return existing._id;
  return await ctx.db.insert("stores", { name });
}

export const ensureStore = internalMutation({
  args: { name: v.string() },
  handler: (ctx, { name }) => ensureStoreCore(ctx, name),
});

// AIT-60: aprovisiona cuentas Google-only (sin contraseña) — para las
// cuentas por contraseña, sigue existiendo el flujo original de
// `createAccount` (ver convex/auth.ts:Password, sin tocar). Para Google,
// la fila en `users` ES el alta: no hay `createAccount` ni secreto de por
// medio, así que cabe entera en una mutation — atómica por construcción
// (OCC de Convex), sin necesitar ninguna reserva manual. Ver
// convex/auth.ts:createOrUpdateUser para cómo se enlaza con Google la
// primera vez que esa persona inicia sesión.
async function provisionUserCore(
  ctx: MutationCtx,
  email: string,
  data: { name: string; role: "owner" | "storeManager" | "sales" },
  storeId: Id<"stores">,
) {
  const trimmedEmail = email.trim().toLowerCase();
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", trimmedEmail))
    .unique();
  if (existing) {
    console.warn(
      `bootstrapInitialAccounts: ${trimmedEmail} ya existe; no se crea de nuevo.`,
    );
    return existing._id;
  }
  return await ctx.db.insert("users", {
    email: trimmedEmail,
    name: data.name.trim(),
    role: data.role,
    storeId,
    active: true,
  });
}

// AIT-31 (multi-tienda): generalizada para poder crear más de una tienda y
// más de las 2 cuentas originales — sin argumentos (o `{}`), crea la
// tienda por defecto y las 2 cuentas reales del negocio (ver AIT-60 más
// abajo). Con `stores`, crea cada tienda (vía ensureStoreCore) y sus
// cuentas, con el rol `storeManager` disponible.
export const bootstrapInitialAccounts = internalMutation({
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
            }),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    if (args.stores === undefined) {
      const storeId = await ensureDefaultStoreCore(ctx, "Tienda principal");
      // AIT-60 (Google en paralelo a Password, no en sustitución — cambio
      // de alcance del PM, 2026-08-24): estas 2 cuentas conviven con las
      // semillas marta@supercrm.es/carlos@supercrm.es (Password, sin
      // tocar) — entran por Google porque no tienen contraseña asignada.
      // admin@talent-network.org como owner, aitor.marin@talent-network.org
      // como sales.
      await provisionUserCore(
        ctx,
        "admin@talent-network.org",
        { name: "Admin", role: "owner" },
        storeId,
      );
      await provisionUserCore(
        ctx,
        "aitor.marin@talent-network.org",
        { name: "Aitor Marín", role: "sales" },
        storeId,
      );
      return;
    }

    for (const storeDef of args.stores) {
      const storeId = await ensureStoreCore(ctx, storeDef.storeName);
      for (const account of storeDef.accounts) {
        await provisionUserCore(
          ctx,
          account.email,
          { name: account.name, role: account.role },
          storeId,
        );
      }
    }
  },
});

// AIT-62: distingue, para la pantalla de Acceso (AIT-63), si un email tiene
// login por contraseña, por Google, ambos o ninguno — sin sesión previa
// (igual que `signIn` mismo no exige sesión previa). Anti-enumeración: un
// email inexistente da el mismo resultado que "sin providers", nunca un
// error ni un `null` que delate si existe (mismo criterio que ADR-003).
export const getLoginMethodsForEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", trimmedEmail))
      .unique();
    if (user === null) return { hasPassword: false, hasGoogle: false };

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
      .collect();

    if (accounts.length === 0) {
      // Invariante de este proyecto (ver docs/01-arquitectura.md,
      // "Consecuencia técnica" de ADR-003, y docs/02-modelo-de-datos.md):
      // solo hay dos caminos que crean una fila en `users`, y son mutuamente
      // excluyentes — Password (`createAccount`) crea su fila de
      // `authAccounts` en el mismo acto que crea el usuario; Google
      // (`createUser`/`bootstrapInitialAccounts`) inserta directamente en
      // `users` y la fila de `authAccounts` no existe hasta el primer login
      // OAuth real. Una fila `users` con CERO filas en `authAccounts` solo
      // puede ser una cuenta Google todavía sin su primer login.
      return { hasPassword: false, hasGoogle: true };
    }
    return {
      hasPassword: accounts.some((a) => a.provider === "password"),
      hasGoogle: accounts.some((a) => a.provider === "google"),
    };
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

// Auxiliares internas, para funciones que no tienen QueryCtx propio
// (actions, u otras internalMutation/internalQuery de otros ficheros —
// ver convex/storesLogo.ts). Mismo criterio que getCurrentUserRole: un
// usuario desactivado se trata como si no tuviera rol.
export const getCurrentUserRoleInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
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
// la propia dueña y a cualquier otra cuenta owner que pudiera existir en
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

// AIT-60: alta de usuario por la dueña desde /ajustes, sin contraseña —
// Google es quien verifica identidad (convex/auth.ts:createOrUpdateUser).
// Antes de esta tarea era una `action` porque necesitaba `createAccount`
// (ActionCtx); ahora es una `mutation` normal, insertando directamente en
// `users`. La fila creada aquí actúa como lista blanca: la primera vez
// que ese email inicie sesión con Google, se enlaza solo.
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    // Nunca "owner" — no se puede crear otra dueña desde aquí (ni el
    // propio schema de authTables lo distingue del resto: es una
    // decisión de producto, impuesta en el union de args, no en el
    // schema de la tabla).
    role: v.union(v.literal("sales"), v.literal("storeManager")),
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);

    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error("El email es obligatorio.");
    const name = args.name.trim();
    if (!name) throw new Error("El nombre es obligatorio.");

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      throw new Error("Ya existe un usuario con ese email.");
    }
    if ((await ctx.db.get(args.storeId)) === null) {
      throw new Error("La tienda indicada no existe.");
    }

    await ctx.db.insert("users", {
      email,
      name,
      role: args.role,
      storeId: args.storeId,
      active: true,
    });
  },
});

// AIT-52 (Post-MVP): editar nombre/rol/tienda de un usuario existente.
// No permite editar a una cuenta owner (ni convertir a alguien EN owner,
// ni tocar a la propia dueña desde aquí) — mismo criterio de "nunca
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
// convex/model/access.ts:requireUser + getCurrentUserRole (cortan el
// acceso de una sesión ya abierta en su siguiente llamada — hallazgo de
// auditoría NO-GO loop2: requireUser en la práctica no era el único
// punto de control, esa query de rol tampoco comprobaba `active`).
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
// Es `action` (no mutation) porque `invalidateSessions` de @convex-dev/auth
// necesita ActionCtx — la comprobación de rol y el patch en sí viven en
// `setUserActiveInternal` de abajo, invocada vía runMutation.
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
