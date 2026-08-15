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
        if (
          typeof params.email !== "string" ||
          params.email.trim().length === 0
        ) {
          throw new Error("Email inválido o ausente.");
        }
        return { email: params.email.trim().toLowerCase() };
      },
    }),
  ],
  callbacks: {
    // AIT-52 (Post-MVP, corrección tras hallazgo propio en verificación):
    // este es el único punto que se ejecuta en TODO signIn (credenciales,
    // reintentos incluidos) justo antes de persistir la sesión — a
    // diferencia de createOrUpdateUser de abajo, que para el provider
    // Password SOLO se llama cuando se crea la cuenta (createAccount),
    // nunca en un signIn normal sobre una cuenta ya existente (confirmado
    // leyendo node_modules/@convex-dev/auth/dist/providers/Password.js:
    // su rama flow==="signIn" llama a retrieveAccount y devuelve el
    // userId directamente, sin pasar por createOrUpdateUser). `active` es
    // opcional en el schema (?? true) porque los usuarios ya existentes
    // en el deployment compartido no lo tenían antes de esta tarea.
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (user !== null && user.active === false) {
        throw new Error(
          "Esta cuenta está desactivada. Contacta con la dueña de tu empresa.",
        );
      }
    },
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId !== null) {
        return existingUserId;
      }

      // Solo se alcanza mediante el bootstrap (createAccount en
      // convex/users.ts llama a este callback sin pasar por el profile()
      // del provider de arriba). Defensa en profundidad, no la política
      // principal.
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
      // AIT-31 (multi-tienda, hallazgo propio al probar en vivo): faltaba
      // "storeManager" aquí — sin este cambio, bootstrapInitialAccounts
      // (convex/users.ts) no podía crear ninguna cuenta de ese rol pese a
      // que su propio schema de argumentos ya lo admitía; fallaba en este
      // callback con "Role inválido".
      if (role !== "owner" && role !== "storeManager" && role !== "sales") {
        throw new Error(
          `Role inválido: "${role}". Debe ser "owner", "storeManager" o "sales".`,
        );
      }
      if (!storeId || (await ctx.db.get(storeId)) === null) {
        throw new Error(
          `storeId "${storeId}" no corresponde a ninguna tienda existente.`,
        );
      }
      return await ctx.db.insert("users", {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        storeId,
        // AIT-52: explícito en todo alta nueva (bootstrap o
        // users.createUser), igual que el resto de campos de este
        // insert — el fallback "?? true" de más abajo es solo para las
        // cuentas creadas antes de que este campo existiera.
        active: true,
      });
    },
  },
});
