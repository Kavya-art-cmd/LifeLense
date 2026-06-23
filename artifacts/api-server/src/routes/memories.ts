import { Router, type IRouter } from "express";
import { db, memoriesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  CreateMemoryBody,
  GetMemoryParams,
  DeleteMemoryParams,
  ListMemoriesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/memories", async (req, res): Promise<void> => {
  const query = ListMemoriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(memoriesTable);

  const conditions = [];
  if (query.data.category) {
    conditions.push(eq(memoriesTable.category, query.data.category));
  }
  if (query.data.search) {
    conditions.push(
      or(
        ilike(memoriesTable.title, `%${query.data.search}%`),
        ilike(memoriesTable.content, `%${query.data.search}%`)
      )!
    );
  }

  const memories = await db
    .select()
    .from(memoriesTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(memoriesTable.createdAt)
    .limit(query.data.limit ?? 100);

  res.json(memories.map((m) => ({ ...m, tags: m.tags ?? [] })));
});

router.post("/memories", async (req, res): Promise<void> => {
  const parsed = CreateMemoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [memory] = await db
    .insert(memoriesTable)
    .values({
      ...parsed.data,
      tags: parsed.data.tags ?? [],
      importance: parsed.data.importance ?? 5,
    })
    .returning();

  res.status(201).json({ ...memory, tags: memory.tags ?? [] });
});

router.get("/memories/:id", async (req, res): Promise<void> => {
  const params = GetMemoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [memory] = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.id, params.data.id));

  if (!memory) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }

  res.json({ ...memory, tags: memory.tags ?? [] });
});

router.delete("/memories/:id", async (req, res): Promise<void> => {
  const params = DeleteMemoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(memoriesTable)
    .where(eq(memoriesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
