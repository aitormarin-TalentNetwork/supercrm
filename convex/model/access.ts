import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("No autenticado.");
  const user = await ctx.db.get(userId);
  if (user === null) throw new Error("Usuario no encontrado.");
  return user;
}

export async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "owner") throw new Error("Solo la dueña puede ver esto.");
  return user;
}

// AIT-31 (multi-tienda, Opción B — docs/02-modelo-de-datos.md §4b): resuelve
// qué storeId usar para las consultas "de tienda entera" (hoy protegidas con
// requireOwner). `requestedStoreId` solo se respeta si quien pregunta es
// `owner` — para `storeManager` se ignora siempre y se usa su propio
// `user.storeId`, así ninguna función nueva puede filtrarse por olvidar
// comprobar el rol: falla cerrado (tienda propia) por defecto.
export async function requireStoreAccess(
  ctx: QueryCtx | MutationCtx,
  requestedStoreId?: Id<"stores">,
) {
  const user = await requireUser(ctx);
  if (user.role !== "owner" && user.role !== "storeManager") {
    throw new Error("Solo la dueña o la encargada de tienda pueden ver esto.");
  }
  const storeId =
    user.role === "owner" && requestedStoreId !== undefined
      ? requestedStoreId
      : user.storeId;
  return { user, storeId };
}
