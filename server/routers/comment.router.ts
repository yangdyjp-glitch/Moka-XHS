import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc.js";
import { db } from "../db.js";
import { comments, users } from "../../drizzle/schema.js";

export const commentRouter = router({
  listByTopic: protectedProcedure
    .input(z.object({ topicId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select({
          id: comments.id,
          topicId: comments.topicId,
          authorId: comments.authorId,
          authorName: users.name,
          content: comments.content,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.topicId, input.topicId))
        .orderBy(desc(comments.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        topicId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await db
        .insert(comments)
        .values({
          topicId: input.topicId,
          authorId: ctx.user.id,
          content: input.content,
        })
        .returning();
      return comment;
    }),
});
