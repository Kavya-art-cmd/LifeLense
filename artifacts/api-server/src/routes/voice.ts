import { Router, type IRouter } from "express";
import multer from "multer";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { callsTable, memoriesTable, decisionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { Readable } from "stream";
import { extractAndSave } from "../lib/extractMemories";
import { openai, AI_MODEL } from "../lib/aiClient";

const router: IRouter = Router();

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY ?? "" });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

interface SessionEntry {
  transcript: Array<{ role: "user" | "assistant"; text: string }>;
  startedAt: Date;
}

const sessions = new Map<string, SessionEntry>();

// Minimum audio size — blobs smaller than this are silence/noise, skip Gemini call
const MIN_AUDIO_BYTES = 1500;

// POST /api/voice/transcribe — audio blob → Gemini transcription
router.post("/voice/transcribe", upload.single("audio"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No audio file provided" });
    return;
  }

  // Too small → definitely silence, return empty immediately (no Gemini call)
  if (req.file.size < MIN_AUDIO_BYTES) {
    res.json({ transcript: "" });
    return;
  }

  try {
    const audioBase64 = req.file.buffer.toString("base64");
    const mimeType = (req.file.mimetype || "audio/webm") as "audio/webm" | "audio/mp4" | "audio/mpeg" | "audio/ogg" | "audio/wav";

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [
          { text: "Transcribe exactly what is spoken in this audio clip. Return ONLY the spoken words with no commentary. If there is only silence or noise, return an empty string." },
          { inlineData: { mimeType, data: audioBase64 } },
        ],
      }],
      config: { maxOutputTokens: 256 },
    });

    const transcript = result.text?.trim() ?? "";
    res.json({ transcript });
  } catch (err: unknown) {
    req.log.warn({ err }, "Gemini transcription failed");
    // Signal quota exhaustion so the frontend can stop looping and show a clear error
    const isQuota = err instanceof Error && err.message.includes("429");
    res.json({ transcript: "", quotaExceeded: isQuota });
  }
});

// POST /api/voice/respond — user text → Gemini AI response text
router.post("/voice/respond", async (req, res): Promise<void> => {
  const { userText, sessionId } = req.body as { userText?: string; sessionId?: string };

  if (!userText || !sessionId) {
    res.status(400).json({ error: "userText and sessionId are required" });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  session.transcript.push({ role: "user", text: userText });

  try {
    const recentMemories = await db.select().from(memoriesTable).limit(8).orderBy(desc(memoriesTable.createdAt));
    const recentDecisions = await db.select().from(decisionsTable).limit(4).orderBy(desc(decisionsTable.createdAt));

    const memCtx = recentMemories
      .map((m) => `[${m.category}] ${m.title}: ${m.content.substring(0, 150)}`)
      .join("\n");
    const decCtx = recentDecisions
      .map((d) => `${d.title}: ${d.reasoning.substring(0, 100)}`)
      .join("\n");

    const systemPrompt = `You are LifeLens Core, an AI personal life companion communicating via voice. Be warm, empathetic, insightful and concise — voice responses must be 2-4 sentences max, completely natural and conversational. No markdown, no lists, no bullet points. Speak like a thoughtful friend who remembers everything.

USER'S MEMORIES:
${memCtx || "No memories stored yet."}

USER'S DECISIONS:
${decCtx || "No decisions stored yet."}

Keep responses SHORT and natural for voice.`;

    const history = session.transcript.map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.text,
    }));

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
      max_tokens: 256,
    });

    const responseText = completion.choices[0]?.message?.content ?? "I heard you. Tell me more.";
    session.transcript.push({ role: "assistant", text: responseText });

    res.json({ responseText });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI response failed";
    res.status(500).json({ error: msg });
  }
});

// POST /api/voice/synthesize — text → ElevenLabs mp3 audio
router.post("/voice/synthesize", async (req, res): Promise<void> => {
  const { text } = req.body as { text?: string };

  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  try {
    const response = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text,
      modelId: "eleven_turbo_v2_5",
      voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
      outputFormat: "mp3_44100_128",
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    // response is a ReadableStream<Uint8Array> — convert to Node Readable
    const nodeReadable = Readable.fromWeb(response as ReadableStream<Uint8Array>);
    nodeReadable.pipe(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Synthesis failed";
    res.status(500).json({ error: msg });
  }
});

// POST /api/voice/session/start — create new session
router.post("/voice/session/start", async (_req, res): Promise<void> => {
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessions.set(sessionId, { transcript: [], startedAt: new Date() });
  res.json({ sessionId });
});

// POST /api/voice/session/end — finalize session, save call record
router.post("/voice/session/end", async (req, res): Promise<void> => {
  const { sessionId } = req.body as { sessionId?: string };

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const durationSecs = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
  const fullTranscript = session.transcript
    .map((t) => `${t.role === "user" ? "User" : "LifeLens"}: ${t.text}`)
    .join("\n");

  sessions.delete(sessionId);

  if (session.transcript.length === 0) {
    res.json({ message: "Empty session, nothing saved" });
    return;
  }

  // Extract memories, decisions, timeline events using OpenAI and save to DB
  const extracted = await extractAndSave(fullTranscript);

  const summary = extracted?.summary ?? "Voice session completed.";
  const memoriesExtracted = extracted?.memories?.length ?? 0;
  const decisionsExtracted = extracted?.decisions?.length ?? 0;

  const [call] = await db
    .insert(callsTable)
    .values({ duration: durationSecs, transcript: fullTranscript, summary, memoriesExtracted, decisionsExtracted, status: "completed" })
    .returning();

  res.json({
    call,
    summary,
    durationSecs,
    saved: {
      memories: memoriesExtracted,
      decisions: decisionsExtracted,
      timelineEvents: extracted?.timelineEvents?.length ?? 0,
    },
  });
});

// ── Narration cache ──────────────────────────────────────────────────────────
const NARRATIONS: Record<number, string> = {
  0: "Your life has a story. Every moment, every decision, every memory matters. But who's truly listening?",
  1: "Speak naturally. LifeLens hears you in real time — transcribing your words and responding with a human voice powered by AI.",
  2: "Every conversation is remembered. Memories, decisions, and life milestones are automatically extracted — building your personal knowledge base, effortlessly.",
  3: "Patterns emerge. LifeLens maps connections across your career, health, family, and goals — revealing insights you would never find alone.",
  4: "LifeLens. Remember everything. Understand yourself.",
};

const narrationCache = new Map<number, Buffer>();

// GET /api/tts/narration?scene=N — returns ElevenLabs audio for that scene (cached)
router.get("/tts/narration", async (req, res): Promise<void> => {
  const scene = parseInt((req.query.scene as string) ?? "0", 10);
  const text = NARRATIONS[scene];
  if (!text) {
    res.status(400).json({ error: "Invalid scene index" });
    return;
  }

  if (narrationCache.has(scene)) {
    const buf = narrationCache.get(scene)!;
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", String(buf.byteLength));
    res.set("Cache-Control", "public, max-age=3600");
    res.end(buf);
    return;
  }

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text,
      modelId: "eleven_turbo_v2",
      voiceSettings: { stability: 0.5, similarityBoost: 0.85, style: 0.2 },
      outputFormat: "mp3_44100_128",
    });

    const chunks: Buffer[] = [];
    const readable = audioStream instanceof Readable ? audioStream : Readable.from(audioStream as AsyncIterable<Uint8Array>);
    for await (const chunk of readable) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buf = Buffer.concat(chunks);
    narrationCache.set(scene, buf);

    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", String(buf.byteLength));
    res.set("Cache-Control", "public, max-age=3600");
    res.end(buf);
  } catch (err) {
    req.log.error({ err }, "ElevenLabs narration TTS failed");
    res.status(502).json({ error: "TTS generation failed" });
  }
});

export default router;
