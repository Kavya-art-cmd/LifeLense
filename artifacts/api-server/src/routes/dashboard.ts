import { Router, type IRouter } from "express";
import { db, memoriesTable, decisionsTable, timelineEventsTable, insightsTable, callsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [memoriesCount] = await db.select({ count: sql<number>`count(*)` }).from(memoriesTable);
  const [decisionsCount] = await db.select({ count: sql<number>`count(*)` }).from(decisionsTable);
  const [timelineCount] = await db.select({ count: sql<number>`count(*)` }).from(timelineEventsTable);
  const [insightsCount] = await db.select({ count: sql<number>`count(*)` }).from(insightsTable);
  const [callsCount] = await db.select({ count: sql<number>`count(*)` }).from(callsTable);

  const recentInsights = await db
    .select()
    .from(insightsTable)
    .orderBy(desc(insightsTable.createdAt))
    .limit(3);

  const recentMemories = await db
    .select()
    .from(memoriesTable)
    .orderBy(desc(memoriesTable.createdAt))
    .limit(5);

  const totalMemories = Number(memoriesCount.count);
  const totalDecisions = Number(decisionsCount.count);
  const totalTimeline = Number(timelineCount.count);
  const totalInsights = Number(insightsCount.count);
  const totalCalls = Number(callsCount.count);

  // Simple growth score based on activity
  const growthScore = Math.min(
    100,
    Math.round(
      totalMemories * 2 + totalDecisions * 5 + totalTimeline * 3 + totalInsights * 8 + totalCalls * 4
    )
  );

  res.json({
    totalMemories,
    totalDecisions,
    totalTimelineEvents: totalTimeline,
    totalInsights,
    totalCalls,
    growthScore,
    recentInsights: recentInsights.map((i) => ({ ...i, relatedMemories: i.relatedMemories ?? [] })),
    recentMemories: recentMemories.map((m) => ({ ...m, tags: m.tags ?? [] })),
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const memories = await db.select().from(memoriesTable).orderBy(desc(memoriesTable.createdAt)).limit(5);
  const decisions = await db.select().from(decisionsTable).orderBy(desc(decisionsTable.createdAt)).limit(3);
  const insights = await db.select().from(insightsTable).orderBy(desc(insightsTable.createdAt)).limit(3);
  const calls = await db.select().from(callsTable).orderBy(desc(callsTable.createdAt)).limit(3);

  const activity = [
    ...memories.map((m) => ({
      id: `memory-${m.id}`,
      type: "memory",
      title: m.title,
      description: m.content.substring(0, 100),
      createdAt: m.createdAt,
    })),
    ...decisions.map((d) => ({
      id: `decision-${d.id}`,
      type: "decision",
      title: d.title,
      description: d.description.substring(0, 100),
      createdAt: d.createdAt,
    })),
    ...insights.map((i) => ({
      id: `insight-${i.id}`,
      type: "insight",
      title: i.title,
      description: i.content.substring(0, 100),
      createdAt: i.createdAt,
    })),
    ...calls.map((c) => ({
      id: `call-${c.id}`,
      type: "call",
      title: "Voice Session",
      description: c.summary?.substring(0, 100) ?? "Voice conversation recorded",
      createdAt: c.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json(activity);
});

router.get("/dashboard/growth", async (_req, res): Promise<void> => {
  // Generate last 6 months of data
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });

    const [memCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memoriesTable)
      .where(sql`EXTRACT(MONTH FROM created_at) = ${date.getMonth() + 1} AND EXTRACT(YEAR FROM created_at) = ${date.getFullYear()}`);

    const [decCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(decisionsTable)
      .where(sql`EXTRACT(MONTH FROM created_at) = ${date.getMonth() + 1} AND EXTRACT(YEAR FROM created_at) = ${date.getFullYear()}`);

    const [insCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(insightsTable)
      .where(sql`EXTRACT(MONTH FROM created_at) = ${date.getMonth() + 1} AND EXTRACT(YEAR FROM created_at) = ${date.getFullYear()}`);

    months.push({
      month: monthName,
      memories: Number(memCount.count),
      decisions: Number(decCount.count),
      insights: Number(insCount.count),
    });
  }

  res.json(months);
});

export default router;
