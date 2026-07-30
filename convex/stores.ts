import { query } from "./_generated/server";
import { requireOwner } from "./model/access";

export const getStoreInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    const store = await ctx.db.get(user.storeId);
    if (store === null) throw new Error("Tienda no encontrada.");
    return { name: store.name };
  },
});
