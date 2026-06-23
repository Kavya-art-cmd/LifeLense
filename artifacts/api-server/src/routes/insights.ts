import { Router, type IRouter } from "express";
import { db, insightsTable, memoriesTable, decisionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GenerateInsightBody } from "@workspace/api-zod";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

router.get("/insights", async (_req, res): Promise<void> => {
  const insights = await db
    .select()
    .from(insightsTable)
    .orderBy(desc(insightsTable.createdAt));

  res.json(insights.map((i) => ({ ...i, relatedMemories: i.relatedMemories ?? [] })));
});

router.post("/insights", async (req, res): Promise<void> => {
  const parsed = GenerateInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const memories = await db.select().from(memoriesTable).limit(20).orderBy(desc(memoriesTable.createdAt));
  const decisions = await db.select().from(decisionsTable).limit(10).orderBy(desc(decisionsTable.createdAt));

  const memoriesSummary = memories
    .map((m) => `- [${m.category}] ${m.title}: ${m.content.substring(0, 200)}`)
    .join("\n");
  const decisionsSummary = decisions
    .map((d) => `- ${d.title}: ${d.reasoning.substring(0, 150)}`)
    .join("\n");

  const prompt = `You are a personal life analyst AI. Based on the following memories and decisions, generate a ${parsed.data.insightType} insight for the ${parsed.data.period} period.

Memories:
${memoriesSummary || "No memories yet."}

Decisions:
${decisionsSummary || "No decisions yet."}

Generate a JSON response with:
{
  "title": "short insight title",
  "content": "detailed insight paragraph (2-4 sentences)",
  "relatedMemoryIds": [array of memory IDs that are most relevant, max 5]
}

Be specific, actionable, and encouraging. Focus on patterns, growth, and learning.`;

  let title = "Personal Growth Insight";
  let content = "Keep recording your memories and decisions to receive personalized insights.";
  let relatedIds: number[] = [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
    });

    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);
    title = data.title ?? title;
    content = data.content ?? content;
    relatedIds = Array.isArray(data.relatedMemoryIds) ? data.relatedMemoryIds.slice(0, 5) : [];
  } catch (_err) {
    // fallback to defaults
  }

  const [insight] = await db
    .insert(insightsTable)
    .values({
      title,
      content,
      insightType: parsed.data.insightType,
      period: parsed.data.period,
      relatedMemories: relatedIds,
    })
    .returning();

  res.status(201).json({ ...insight, relatedMemories: insight.relatedMemories ?? [] });
});

export default router;
