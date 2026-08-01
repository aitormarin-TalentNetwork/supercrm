import { convexAuth } from "@convex-dev/auth/server";
// La versión exacta instalada (0.0.94) exporta `Password` como named export,
// no default, aunque la JSDoc de la propia librería muestre un import por
// defecto (comprobado al fallar el build con esbuild).
import { Password } from "@convex-dev/auth/providers/Password";
import { Id } from "./_generated/dataModel";

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
        if (typeof params.email !== "string" || params.email.trim().length === 0) {
          throw new Error("Email inválido o ausente.");
        }
        return { email: params.email.trim().toLowerCase() };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId !== null) return existingUserId;

      // Solo se alcanza mediante el bootstrap (createAccount en
      // convex/users.ts llama a este callback sin pasar por el profile()
      // del provider de arriba). Defensa en profundidad, no la política
      // principal.
      const { email, name, role, storeId } = profile as {
        email: string;
        name: string;
        role: "owner" | "sales";
        storeId: Id<"stores">;
      };
      if (typeof email !== "string" || email.trim().length === 0) {
        throw new Error("No se puede crear un usuario sin un email válido.");
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        throw new Error("No se puede crear un usuario sin un name válido.");
      }
      if (role !== "owner" && role !== "sales") {
        throw new Error(`Role inválido: "${role}". Debe ser "owner" o "sales".`);
      }
      if (!storeId || (await ctx.db.get(storeId)) === null) {
        throw new Error(`storeId "${storeId}" no corresponde a ninguna tienda existente.`);
      }
      return await ctx.db.insert("users", {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        storeId,
      });
    },
  },
});
