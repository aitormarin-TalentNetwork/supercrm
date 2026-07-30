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
        return { email: params.email as string };
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
      if (!role || !storeId) {
        throw new Error(
          "No se puede crear un usuario sin role/storeId; el registro público está deshabilitado.",
        );
      }
      return await ctx.db.insert("users", { email, name, role, storeId });
    },
  },
});
