import { Router, type IRouter } from "express";
import { db, callsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCallBody, GetCallParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calls", async (_req, res): Promise<void> => {
  const calls = await db.select().from(callsTable).orderBy(desc(callsTable.createdAt));
  res.json(calls);
});

router.post("/calls", async (req, res): Promise<void> => {
  const parsed = CreateCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [call] = await db.insert(callsTable).values(parsed.data).returning();
  res.status(201).json(call);
});

router.get("/calls/:id", async (req, res): Promise<void> => {
  const params = GetCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [call] = await db.select().from(callsTable).where(eq(callsTable.id, params.data.id));

  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  res.json(call);
});

export default router;
