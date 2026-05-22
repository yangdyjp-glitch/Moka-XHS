import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, leaderProcedure, router } from "../_core/trpc.js";
import { db } from "../db.js";
import { columns } from "../../drizzle/schema.js";

export const columnRouter = router({
  list: protectedProcedure
    .input(z.object({ accountId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.accountId) {
        return db
          .select()
          .from(columns)
          .where(eq(columns.accountId, input.accountId))
          .orderBy(columns.createdAt);
      }
      return db.select().from(columns).orderBy(columns.createdAt);
    }),

  create: leaderProcedure
    .input(
      z.object({
        name: z.string().min(1),
        accountId: z.number(),
        description: z.string().optional(),
        targetUserType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [col] = await db.insert(columns).values(input).returning();
      return col;
    }),

  update: leaderProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        targetUserType: z.string().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await db.update(columns).set(updates).where(eq(columns.id, id));
      return { success: true };
    }),
});
