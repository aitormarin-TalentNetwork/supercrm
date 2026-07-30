import type { QueryCtx, MutationCtx } from "../_generated/server";
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
