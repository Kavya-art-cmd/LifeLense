import { db, memoriesTable, decisionsTable, timelineEventsTable } from "@workspace/db";
import { openai, AI_MODEL } from "./aiClient";

interface ExtractedMemory {
  title: string;
  content: string;
  category: string;
  emotionalTone?: string;
  importance: number;
  tags: string[];
}

interface ExtractedDecision {
  title: string;
  description: string;
  reasoning: string;
  outcome?: string;
  impact: string;
}

interface ExtractedTimelineEvent {
  title: string;
  description: string;
  eventType: string;
  date: string;
  milestone: boolean;
}

interface ExtractionResult {
  summary: string;
  memories: ExtractedMemory[];
  decisions: ExtractedDecision[];
  timelineEvents: ExtractedTimelineEvent[];
}

const SYSTEM_PROMPT = `You are a life data extractor for a personal AI companion app called LifeLens. 
Given a conversation transcript, extract meaningful life data and return ONLY a valid JSON object with no markdown fences.

The JSON must have this exact shape:
{
  "summary": "2-3 sentence summary of what was discussed",
  "memories": [
    {
      "title": "short title",
      "content": "detailed description of the memory/experience",
      "category": "one of: personal, work, health, relationships, travel, education, hobbies, general",
      "emotionalTone": "one of: positive, negative, neutral, mixed",
      "importance": 1-10 integer (10 = life-changing),
      "tags": ["array", "of", "relevant", "tags"]
    }
  ],
  "decisions": [
    {
      "title": "short title",
      "description": "what the decision is about",
      "reasoning": "why they made or are considering this decision",
      "outcome": "outcome if known, or null",
      "impact": "one of: low, medium, high"
    }
  ],
  "timelineEvents": [
    {
      "title": "short title",
      "description": "what happened",
      "eventType": "one of: milestone, achievement, experience, challenge, relationship, career, health, travel",
      "date": "ISO 8601 date string — use the exact date if mentioned, otherwise today's date",
      "milestone": true or false (true only for major life events)
    }
  ]
}

Rules:
- Only extract things that are genuinely meaningful — don't invent details not in the transcript
- memories: experiences, facts about the user's life, things they remember or share
- decisions: choices they've made or are considering
- timelineEvents: concrete events that happened (not ongoing thoughts/feelings)
- It's fine for any array to be empty if nothing of that type was mentioned
- Return ONLY the JSON, no explanation, no markdown`;

export async function extractAndSave(transcript: string, today: Date = new Date()): Promise<ExtractionResult | null> {
  if (!transcript.trim()) return null;

  let result: ExtractionResult;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Today's date is ${today.toISOString().split("T")[0]}. Extract life data from this conversation:\n\n${transcript}`,
        },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    });

    const raw = (completion.choices[0]?.message?.content ?? "{}").replace(/```json|```/g, "").trim();
    result = JSON.parse(raw) as ExtractionResult;
  } catch (err) {
    // AI failed or quota — return null so callers can handle gracefully
    console.error("extractAndSave: AI extraction failed", err instanceof Error ? err.message : err);
    return null;
  }

  const today8601 = today.toISOString();

  // Save memories
  if (result.memories?.length) {
    await db.insert(memoriesTable).values(
      result.memories.map((m) => ({
        title: m.title ?? "Untitled memory",
        content: m.content ?? "",
        category: m.category ?? "general",
        emotionalTone: m.emotionalTone ?? undefined,
        importance: typeof m.importance === "number" ? Math.min(10, Math.max(1, m.importance)) : 5,
        tags: Array.isArray(m.tags) ? m.tags : [],
      }))
    );
  }

  // Save decisions
  if (result.decisions?.length) {
    await db.insert(decisionsTable).values(
      result.decisions.map((d) => ({
        title: d.title ?? "Untitled decision",
        description: d.description ?? "",
        reasoning: d.reasoning ?? "",
        outcome: d.outcome ?? undefined,
        impact: ["low", "medium", "high"].includes(d.impact) ? d.impact : "medium",
      }))
    );
  }

  // Save timeline events
  if (result.timelineEvents?.length) {
    await db.insert(timelineEventsTable).values(
      result.timelineEvents.map((e) => ({
        title: e.title ?? "Untitled event",
        description: e.description ?? "",
        eventType: e.eventType ?? "experience",
        date: new Date(e.date ?? today8601),
        milestone: Boolean(e.milestone),
      }))
    );
  }

  return result;
}
