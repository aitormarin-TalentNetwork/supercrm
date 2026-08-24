import { convexAuth } from "@convex-dev/auth/server";
// La versión exacta instalada (0.0.94) exporta `Password` como named export,
// no default, aunque la JSDoc de la propia librería muestre un import por
// defecto (comprobado al fallar el build con esbuild).
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// AIT-60 (cambio de alcance del PM, 2026-08-24): Google se AÑADE EN
// PARALELO al provider Password — no lo sustituye. Las cuentas semilla
// (marta@supercrm.es/carlos@supercrm.es) siguen entrando por contraseña
// exactamente igual que antes; admin@talent-network.org y
// aitor.marin@talent-network.org se dan de alta desde Ajustes para entrar
// por Google, conviviendo con las anteriores.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // Rechazo explícito del registro público: no hay alta desde el
      // formulario de login (PRD: "los accesos los crea la dueña de tu
      // empresa"). No depende de que falten role/storeId más abajo —
      // esta es la política en sí misma.
      profile(params) {
        if (params.flow === "signUp") {
          throw new Error(
            "Registro público deshabilitado. Los accesos los crea la dueña de tu empresa.",
          );
        }
        if (
          typeof params.email !== "string" ||
          params.email.trim().length === 0
        ) {
          throw new Error("Email inválido o ausente.");
        }
        return { email: params.email.trim().toLowerCase() };
      },
    }),
    Google,
  ],
  callbacks: {
    // AIT-52 (Post-MVP, corrección tras hallazgo propio en verificación):
    // este es el único punto que se ejecuta en TODO signIn, con
    // independencia del provider, justo antes de persistir la sesión —
    // bloquea una sesión ya abierta antes de desactivarla, y corta
    // cualquier login nuevo de una cuenta desactivada.
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (user !== null && user.active === false) {
        throw new Error(
          "Esta cuenta está desactivada. Contacta con la dueña de tu empresa.",
        );
      }
    },
    async createOrUpdateUser(ctx, { existingUserId, type, profile }) {
      if (existingUserId !== null) {
        return existingUserId;
      }

      // El tipo público de este callback recibe `ctx` genérico
      // (GenericMutationCtx<AnyDataModel>), sin conocer nuestro schema —
      // `.withIndex` no tipa sin este cast. En runtime es el MutationCtx
      // real generado a partir de convex/schema.ts, como en cualquier
      // otra función de este proyecto.
      const db = (ctx as MutationCtx).db;

      if (type === "credentials") {
        // Solo se alcanza mediante createAccount llamado directamente
        // (hoy nada del proyecto lo hace — el alta real, con o sin
        // Google, pasa por inserción directa en `users` vía
        // convex/users.ts:createUser/bootstrapInitialAccounts). Defensa
        // en profundidad, mismo comportamiento que tenía este provider
        // antes de AIT-60, no la política principal.
        const { email, name, role, storeId } = profile as {
          email: string;
          name: string;
          role: "owner" | "storeManager" | "sales";
          storeId: Id<"stores">;
        };
        if (typeof email !== "string" || email.trim().length === 0) {
          throw new Error("No se puede crear un usuario sin un email válido.");
        }
        if (typeof name !== "string" || name.trim().length === 0) {
          throw new Error("No se puede crear un usuario sin un name válido.");
        }
        if (role !== "owner" && role !== "storeManager" && role !== "sales") {
          throw new Error(
            `Role inválido: "${role}". Debe ser "owner", "storeManager" o "sales".`,
          );
        }
        if (!storeId || (await db.get(storeId)) === null) {
          throw new Error(
            `storeId "${storeId}" no corresponde a ninguna tienda existente.`,
          );
        }
        return await db.insert("users", {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role,
          storeId,
          active: true,
        });
      }

      // Google (oauth): lista blanca, nunca alta automática. Solo enlaza
      // si ya existe una fila en `users` con ese email (dada de alta
      // desde Ajustes o por el bootstrap inicial) y está activa.
      const email =
        typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
      if (!email) {
        throw new Error("Google no ha devuelto ningún email para esta cuenta.");
      }
      const user = await db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .unique();
      if (user === null) {
        throw new Error(
          `La cuenta de Google "${email}" no tiene acceso. Pide a la dueña de tu empresa que te dé de alta desde Ajustes.`,
        );
      }
      if (user.active === false) {
        throw new Error(
          `La cuenta "${email}" está desactivada. Contacta con la dueña de tu empresa.`,
        );
      }
      return user._id;
    },
  },
});
