import { router } from "../_core/trpc.js";
import { authRouter } from "./auth.router.js";
import { accountRouter } from "./account.router.js";
import { columnRouter } from "./column.router.js";
import { topicRouter } from "./topic.router.js";
import { noteRouter } from "./note.router.js";
import { metricRouter } from "./metric.router.js";
import { commentRouter } from "./comment.router.js";
import { reviewRouter } from "./review.router.js";
import { dashboardRouter } from "./dashboard.router.js";
import { eventRouter } from "./event.router.js";

export const appRouter = router({
  auth: authRouter,
  account: accountRouter,
  column: columnRouter,
  topic: topicRouter,
  note: noteRouter,
  metric: metricRouter,
  comment: commentRouter,
  review: reviewRouter,
  dashboard: dashboardRouter,
  event: eventRouter,
});

export type AppRouter = typeof appRouter;
