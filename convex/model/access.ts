import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
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

// AIT-31 (multi-tienda, hallazgo de auditoría ronda 1): antes de esto,
// todo el proyecto distinguía acceso a un registro individual (oportunidad,
// cliente, interacción, recordatorio de recompra...) con
// `user.role !== "owner" && doc.ownerId !== user._id` — "owner ve todo,
// cualquier otro rol solo lo suyo". Con `storeManager` en medio, esa
// condición lo trataba como sales (solo lo suyo), contradiciendo el
// contrato del rol (ve TODA su tienda, como owner, pero acotado a ella).
// Centralizado aquí para no repetir la comprobación tri-estado en cada
// sitio — sustituye el antiguo `user.role !== "owner"` en esos checks.
export function isStoreWideRole(user: Doc<"users">) {
  return user.role === "owner" || user.role === "storeManager";
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
