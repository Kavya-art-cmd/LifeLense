import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable, memoriesTable, decisionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import { extractAndSave } from "../lib/extractMemories";
import { openai, AI_MODEL } from "../lib/aiClient";

const router: IRouter = Router();

router.get("/chat/conversations", async (_req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.createdAt));
  res.json(conversations);
});

router.post("/chat/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db.insert(conversationsTable).values(parsed.data).returning();
  res.status(201).json(conversation);
});

router.get("/chat/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...conversation, messages: msgs });
});

router.delete("/chat/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/chat/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messagesTable).values({
    conversationId: params.data.id,
    role: "user",
    content: parsed.data.content,
  });

  // Load memory context
  const recentMemories = await db
    .select()
    .from(memoriesTable)
    .limit(10)
    .orderBy(desc(memoriesTable.createdAt));
  const recentDecisions = await db
    .select()
    .from(decisionsTable)
    .limit(5)
    .orderBy(desc(decisionsTable.createdAt));

  const memoryContext = recentMemories
    .map((m) => `[${m.category}] ${m.title}: ${m.content.substring(0, 200)}`)
    .join("\n");
  const decisionContext = recentDecisions
    .map((d) => `${d.title}: ${d.reasoning.substring(0, 150)}`)
    .join("\n");

  // Load conversation history
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  const systemPrompt = `You are LifeLens, an AI personal memory and insight companion. You help users understand their life patterns, recall memories, and grow as individuals.

You have access to the user's personal memories and decisions:

MEMORIES:
${memoryContext || "No memories stored yet."}

DECISIONS:
${decisionContext || "No decisions stored yet."}

Be warm, insightful, and specific. Reference their actual memories when relevant. Help them find patterns and meaning in their experiences. You are like a thoughtful friend who remembers everything they've shared with you.`;

  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages,
      ],
      stream: true,
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
  } catch (err) {
    req.log.warn({ err }, "OpenAI chat stream failed");
    fullResponse = "I'm having trouble connecting right now. Please try again in a moment.";
    res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
  }

  // Save assistant message
  await db.insert(messagesTable).values({
    conversationId: params.data.id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  // Auto-extract memories, decisions, timeline events in the background (non-blocking)
  // Build a transcript from the latest user message + assistant response
  const latestTranscript = `User: ${parsed.data.content}\nLifeLens: ${fullResponse}`;
  extractAndSave(latestTranscript).catch(() => {
    // Silently ignore extraction failures — main chat flow already completed
  });
});

export default router;
