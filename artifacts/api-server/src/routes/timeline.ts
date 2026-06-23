import { Router, type IRouter } from "express";
import { db, timelineEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateTimelineEventBody,
  DeleteTimelineEventParams,
  ListTimelineEventsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/timeline", async (req, res): Promise<void> => {
  const query = ListTimelineEventsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let whereClause = undefined;
  if (query.data.type) {
    whereClause = eq(timelineEventsTable.eventType, query.data.type);
  }

  const events = await db
    .select()
    .from(timelineEventsTable)
    .where(whereClause)
    .orderBy(timelineEventsTable.date);

  res.json(events);
});

router.post("/timeline", async (req, res): Promise<void> => {
  const parsed = CreateTimelineEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .insert(timelineEventsTable)
    .values({
      ...parsed.data,
      milestone: parsed.data.milestone ?? false,
    })
    .returning();

  res.status(201).json(event);
});

router.delete("/timeline/:id", async (req, res): Promise<void> => {
  const params = DeleteTimelineEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(timelineEventsTable)
    .where(eq(timelineEventsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Timeline event not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
