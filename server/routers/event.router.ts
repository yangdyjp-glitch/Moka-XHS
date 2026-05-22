import { z } from "zod";
import { eq, gte, lte, and, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc.js";
import { db } from "../db.js";
import { calendarEvents } from "../../drizzle/schema.js";

export const EVENT_CATEGORIES = {
  jlpt: "JLPT",
  eju: "EJU",
  undergraduate: "学部生",
  graduate: "研究生",
  other: "其他",
} as const;

const BUILTIN_EVENTS = [
  // JLPT
  { title: "JLPT 7月考试报名开始", eventDate: "2026-03-15", category: "jlpt" },
  { title: "JLPT 7月考试报名截止", eventDate: "2026-04-15", category: "jlpt" },
  { title: "JLPT 7月考试", eventDate: "2026-07-05", category: "jlpt" },
  { title: "JLPT 7月成绩发布", eventDate: "2026-08-25", category: "jlpt" },
  { title: "JLPT 12月考试报名开始", eventDate: "2026-08-20", category: "jlpt" },
  { title: "JLPT 12月考试报名截止", eventDate: "2026-09-20", category: "jlpt" },
  { title: "JLPT 12月考试", eventDate: "2026-12-06", category: "jlpt" },
  { title: "JLPT 12月成绩发布", eventDate: "2027-01-25", category: "jlpt" },

  // EJU
  { title: "EJU 第1回考试报名开始", eventDate: "2026-02-16", category: "eju" },
  { title: "EJU 第1回考试报名截止", eventDate: "2026-03-13", category: "eju" },
  { title: "EJU 第1回考试", eventDate: "2026-06-21", category: "eju" },
  { title: "EJU 第1回成绩发布", eventDate: "2026-07-23", category: "eju" },
  { title: "EJU 第2回考试报名开始", eventDate: "2026-07-06", category: "eju" },
  { title: "EJU 第2回考试报名截止", eventDate: "2026-07-31", category: "eju" },
  { title: "EJU 第2回考试", eventDate: "2026-11-08", category: "eju" },
  { title: "EJU 第2回成绩发布", eventDate: "2026-12-24", category: "eju" },

  // 学部生
  { title: "学部生 4月入学出愿截止（多数校）", eventDate: "2025-11-30", category: "undergraduate" },
  { title: "学部生 4月入学合格发表", eventDate: "2026-02-15", category: "undergraduate" },
  { title: "学部生 10月入学出愿截止（多数校）", eventDate: "2026-05-31", category: "undergraduate" },
  { title: "学部生 10月入学合格发表", eventDate: "2026-08-15", category: "undergraduate" },

  // 研究生
  { title: "研究生 4月入学 海外申请截止", eventDate: "2025-10-31", category: "graduate" },
  { title: "研究生 4月入学 日本国内申请截止", eventDate: "2025-12-15", category: "graduate" },
  { title: "研究生 4月入学 合格发表", eventDate: "2026-01-31", category: "graduate" },
  { title: "研究生 10月入学 海外申请截止", eventDate: "2026-04-30", category: "graduate" },
  { title: "研究生 10月入学 日本国内申请截止", eventDate: "2026-06-15", category: "graduate" },
  { title: "研究生 10月入学 合格发表", eventDate: "2026-07-31", category: "graduate" },
];

export const eventRouter = router({
  list: protectedProcedure
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      if (input?.from) conditions.push(gte(calendarEvents.eventDate, input.from));
      if (input?.to) conditions.push(lte(calendarEvents.eventDate, input.to));
      if (input?.category) conditions.push(eq(calendarEvents.category, input.category));
      return db
        .select()
        .from(calendarEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(calendarEvents.eventDate));
    }),

  upcoming: protectedProcedure
    .input(z.object({ days: z.number().default(60) }).optional())
    .query(async ({ input }) => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const future = new Date(now);
      future.setDate(now.getDate() + (input?.days || 60));
      const futureStr = future.toISOString().split("T")[0];
      return db
        .select()
        .from(calendarEvents)
        .where(and(gte(calendarEvents.eventDate, today), lte(calendarEvents.eventDate, futureStr)))
        .orderBy(asc(calendarEvents.eventDate));
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      eventDate: z.string().min(1),
      category: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const [event] = await db
        .insert(calendarEvents)
        .values({ ...input, isBuiltin: false, createdBy: ctx.user.id })
        .returning();
      return event;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, input.id)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "事件不存在" });
      if (event.isBuiltin) throw new TRPCError({ code: "FORBIDDEN", message: "内置事件不可删除" });
      await db.delete(calendarEvents).where(eq(calendarEvents.id, input.id));
      return { success: true };
    }),

  seedBuiltin: protectedProcedure.mutation(async () => {
    const existing = await db
      .select({ id: calendarEvents.id })
      .from(calendarEvents)
      .where(eq(calendarEvents.isBuiltin, true))
      .limit(1);
    if (existing.length > 0) return { seeded: false, message: "内置事件已存在" };

    await db.insert(calendarEvents).values(
      BUILTIN_EVENTS.map((e) => ({ ...e, isBuiltin: true }))
    );
    return { seeded: true, count: BUILTIN_EVENTS.length };
  }),
});
