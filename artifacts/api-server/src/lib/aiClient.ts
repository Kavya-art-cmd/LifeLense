import OpenAI from "openai";

// Supports any OpenAI-compatible endpoint:
//   OpenAI (default):  no extra env vars needed
//   Groq:             OPENAI_BASE_URL=https://api.groq.com/openai/v1  OPENAI_API_KEY=gsk_...
//   Ollama (tunnel):  OPENAI_BASE_URL=https://<your-tunnel>.ngrok.io/v1  OPENAI_API_KEY=ollama
//   Together.ai:      OPENAI_BASE_URL=https://api.together.xyz/v1  OPENAI_API_KEY=<key>

const baseURL = process.env.OPENAI_BASE_URL ?? undefined;
const apiKey = process.env.OPENAI_API_KEY ?? "ollama";

export const openai = new OpenAI({ apiKey, baseURL });

// Default model — override with OPENAI_MODEL env var
// Groq free tier: llama-3.3-70b-versatile or llama3-8b-8192
// OpenAI: gpt-4o-mini
// Ollama: llama3
export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
