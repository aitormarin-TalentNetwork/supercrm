import { convexAuth } from "@convex-dev/auth/server";
import {
  createAccount,
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
  signInViaProvider,
} from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import type { EmailConfig } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Scrypt } from "lucia";
import type { WithoutSystemFields } from "convex/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ResendOTPPasswordReset,
  checkPasswordResetRateLimit,
} from "./ResendOTPPasswordReset";

// AIT-62: `authorize` propio en vez de usar el provider `Password` de
// `@convex-dev/auth` tal cual (import por defecto de esa librería, ver nota
// que había aquí antes de esta tarea sobre el named export de 0.0.94 —
// sigue aplicando, no se usa `Password` en este fichero desde esta tarea).
// Motivo: la librería NO expone ningún punto de personalización que se
// ejecute ANTES de que persista el código de reseteo y que a la vez esté
// awaited y tenga acceso a ctx+email — comprobado leyendo
// node_modules/@convex-dev/auth@0.0.94/dist/providers/Password.js:
//   - `profile(params, ctx)` sí recibe ambos, pero la librería la llama SIN
//     `await` (`config.profile?.(params, ctx) ?? defaultProfile(params)`):
//     hacerla async rompe el flujo (profile pasa a ser una Promise sin
//     resolver, `email` sale undefined) y además un throw dentro no
//     interrumpe nada, porque nadie espera esa promesa.
//   - `generateVerificationToken` tiene la firma `() => Promise<string>`
//     (cero argumentos, sin ctx ni email) — no permite saber a qué cuenta
//     aplicar un límite.
//   - `authVerificationCodes` tiene como mucho 1 fila por cuenta
//     (`generateUniqueVerificationCode` en
//     .../mutations/createVerificationCode.ts borra la fila anterior sin
//     condición alguna) — cualquier punto de `config.reset` (incluido
//     `sendVerificationRequest`, ver ResendOTPPasswordReset.ts) se ejecuta
//     DESPUÉS de que el código ya se ha generado y persistido. Un rate-limit
//     puesto ahí deja sin enviar el código nuevo, pero YA ha borrado el
//     código anterior válido — bloqueo real: cualquiera que conozca un
//     email puede inutilizar su recuperación sin necesitar el código él
//     mismo (hallazgo de auditoría, AIT-62 ronda 2).
// La única vía real es sustituir el `authorize` completo: `Password()`
// termina su config con `...config`, así que un `authorize` propio en la
// llamada a `Password({...})` la sobreescribiría igualmente, PERO el tipo
// `PasswordConfig` no declara ese campo (exceso de propiedades en TS) — se
// usa `ConvexCredentials` directamente, que es la función que `Password()`
// llama por debajo, con el mismo `id: "password"`.
//
// Las ramas `signUp`/`signIn`/`reset-verification`/`email-verification` de
// abajo son una copia literal de Password.js 0.0.94 (mismas llamadas a
// createAccount/retrieveAccount/signInViaProvider/modifyAccountCredentials/
// invalidateSessions, todas exportadas por la librería para justo este uso,
// mismos mensajes de error, incluida la lista completa de flujos en el
// `else` final) — SIN cambio de comportamiento respecto a antes de esta
// tarea. `verifyProvider` se mantiene como `undefined` explícito (nunca se
// ha configurado `verify` en este proyecto) para conservar el mismo
// contrato exacto: con `flow: "email-verification"` sin verify configurado,
// la librería responde "Email verification is not enabled for password",
// no un error genérico distinto (hallazgo de auditoría de código, ronda 1 —
// la primera versión de este fork omitía esta rama). Solo la rama `reset`
// gana el chequeo de rate-limit, ANTES de `retrieveAccount`/
// `signInViaProvider`, para que un intento por encima del límite nunca
// llegue a persistir/borrar el código válido de un intento anterior.
//
// Si se actualiza `@convex-dev/auth` en el futuro: revisar si
// `Password.js` cambió su `authorize` y si este fork sigue reflejándolo
// fielmente (no se actualiza solo).
function validateDefaultPasswordRequirements(password: string | undefined) {
  if (!password || password.length < 8) {
    throw new Error("Invalid password");
  }
}

// Ver nota grande de arriba: siempre `undefined` en este proyecto, se
// mantiene declarado (en vez de eliminar la rama que lo usa) para
// conservar el mismo contrato que Password.js.
const verifyProvider: EmailConfig | undefined = undefined;

// AIT-60 (cambio de alcance del PM, 2026-08-24): Google se AÑADE EN
// PARALELO al provider Password — no lo sustituye. Las cuentas semilla
// (marta@supercrm.es/carlos@supercrm.es) siguen entrando por contraseña
// exactamente igual que antes; admin@talent-network.org y
// aitor.marin@talent-network.org se dan de alta desde Ajustes para entrar
// por Google, conviviendo con las anteriores.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials({
      id: "password",
      crypto: {
        async hashSecret(password: string) {
          return await new Scrypt().hash(password);
        },
        async verifySecret(password: string, hash: string) {
          return await new Scrypt().verify(hash, password);
        },
      },
      extraProviders: [ResendOTPPasswordReset],
      authorize: async (params, ctx) => {
        const flow = params.flow as string | undefined;
        const passwordToValidate =
          flow === "signUp"
            ? (params.password as string | undefined)
            : flow === "reset-verification"
              ? (params.newPassword as string | undefined)
              : null;
        if (passwordToValidate !== null) {
          validateDefaultPasswordRequirements(passwordToValidate);
        }

        // Rechazo explícito del registro público: no hay alta desde el
        // formulario de login (PRD: "los accesos los crea la dueña de tu
        // empresa"). No depende de que falten role/storeId más abajo —
        // esta es la política en sí misma. Mismo comportamiento que el
        // `profile` que tenía este provider antes de AIT-62.
        if (flow === "signUp") {
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
        const profile = { email: params.email.trim().toLowerCase() };
        const { email } = profile;
        const secret = params.password as string | undefined;
        let account;
        let user;

        if (flow === "signUp") {
          if (secret === undefined) {
            throw new Error("Missing `password` param for `signUp` flow");
          }
          const created = await createAccount(ctx, {
            provider: "password",
            account: { id: email, secret },
            profile: profile as WithoutSystemFields<Doc<"users">>,
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
          });
          ({ account, user } = created);
        } else if (flow === "signIn") {
          if (secret === undefined) {
            throw new Error("Missing `password` param for `signIn` flow");
          }
          const retrieved = await retrieveAccount(ctx, {
            provider: "password",
            account: { id: email, secret },
          });
          if (retrieved === null) {
            throw new Error("Invalid credentials");
          }
          ({ account, user } = retrieved);
        } else if (flow === "reset") {
          // AIT-62: chequeo de rate-limit ANTES de tocar la cuenta o de
          // generar/persistir ningún código — ver la nota grande de arriba
          // sobre por qué este es el único punto viable.
          await checkPasswordResetRateLimit(ctx, email);
          const { account: resetAccount } = await retrieveAccount(ctx, {
            provider: "password",
            account: { id: email },
          });
          return await signInViaProvider(ctx, ResendOTPPasswordReset, {
            accountId: resetAccount._id,
            params,
          });
        } else if (flow === "reset-verification") {
          if (params.newPassword === undefined) {
            throw new Error(
              "Missing `newPassword` param for `reset-verification` flow",
            );
          }
          const { account: resetAccount } = await retrieveAccount(ctx, {
            provider: "password",
            account: { id: email },
          });
          const result = await signInViaProvider(ctx, ResendOTPPasswordReset, {
            params,
          });
          if (result === null) {
            throw new Error("Invalid code");
          }
          const { userId, sessionId } = result;
          if (resetAccount.userId !== userId) {
            throw new Error("Invalid code");
          }
          const newSecret = params.newPassword as string;
          await modifyAccountCredentials(ctx, {
            provider: "password",
            account: { id: email, secret: newSecret },
          });
          await invalidateSessions(ctx, { userId, except: [sessionId] });
          return { userId, sessionId };
        } else if (flow === "email-verification") {
          if (!verifyProvider) {
            throw new Error("Email verification is not enabled for password");
          }
          const { account: verifyAccount } = await retrieveAccount(ctx, {
            provider: "password",
            account: { id: email },
          });
          return await signInViaProvider(ctx, verifyProvider, {
            accountId: verifyAccount._id,
            params,
          });
        } else {
          throw new Error(
            "Missing `flow` param, it must be one of " +
              '"signUp", "signIn", "reset", "reset-verification" or ' +
              '"email-verification"!',
          );
        }

        // Paridad con Password.js: verificación de email opcional durante
        // signUp/signIn — `verifyProvider` siempre `undefined` en este
        // proyecto (ver nota grande de arriba), así que esta rama nunca se
        // ejecuta en la práctica, pero se conserva para el mismo contrato.
        if (verifyProvider && !account.emailVerified) {
          return await signInViaProvider(ctx, verifyProvider, {
            accountId: account._id,
            params,
          });
        }
        return { userId: user._id };
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
