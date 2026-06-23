---
name: Gemini free-tier model quotas
description: Which Gemini models work on the free tier for this project and their daily limits
---

## Rule
- `gemini-2.5-flash`: **20 req/day** on free tier (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). Exhausted quickly by voice loop (fires every 4-7s).
- `gemini-2.0-flash`: Shows `limit: 0` — appears to have **no free-tier access** on this API key type. Do not use.
- `gemini-1.5-flash` (bare name): returns **NOT_FOUND** on `@google/genai` v1.52 (uses v1beta API). Invalid model name.

**Current setup:** all routes use `gemini-2.0-flash`. Will need to revisit if quota remains 0.

**Why:** The voice transcription loop fired every 4 seconds, exhausting the 20 req/day limit for gemini-2.5-flash in under 2 minutes.

**How to apply:** If quota issues return, either: (a) add billing to the Gemini API key at ai.google.dev, or (b) investigate `gemini-2.5-flash-lite` or `gemini-1.5-flash-002` model names for v1beta API.
