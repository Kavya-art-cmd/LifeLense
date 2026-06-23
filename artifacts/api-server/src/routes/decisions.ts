import { Router, type IRouter } from "express";
import { db, decisionsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  CreateDecisionBody,
  DeleteDecisionParams,
  ListDecisionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/decisions", async (req, res): Promise<void> => {
  const query = ListDecisionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let whereClause = undefined;
  if (query.data.search) {
    whereClause = or(
      ilike(decisionsTable.title, `%${query.data.search}%`),
      ilike(decisionsTable.description, `%${query.data.search}%`)
    );
  }

  const decisions = await db
    .select()
    .from(decisionsTable)
    .where(whereClause)
    .orderBy(decisionsTable.createdAt);

  res.json(decisions);
});

router.post("/decisions", async (req, res): Promise<void> => {
  const parsed = CreateDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [decision] = await db
    .insert(decisionsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(decision);
});

router.delete("/decisions/:id", async (req, res): Promise<void> => {
  const params = DeleteDecisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(decisionsTable)
    .where(eq(decisionsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
