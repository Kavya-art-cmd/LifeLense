import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AICoreOrb } from "@/components/ui/AICoreOrb";
import { AgentOrb } from "@/components/ui/AgentOrb";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Browser SpeechRecognition (zero quota, runs locally in Chrome/Edge) ──────
// Using `any` because @types/dom-speech-recognition isn't in this tsconfig
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR: any = (typeof window !== "undefined")
  ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null)
  : null;

type CallState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "ending" | "completed";
type OrbState  = "idle" | "listening" | "thinking" | "speaking";
type AgentSt   = "idle" | "active" | "processing";
interface Line  { role: "user" | "assistant"; text: string }

export default function Voice() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [orbState,  setOrbState]  = useState<OrbState>("idle");
  const [mem,  setMem]  = useState<AgentSt>("idle");
  const [tl,   setTl]   = useState<AgentSt>("idle");
  const [dec,  setDec]  = useState<AgentSt>("idle");
  const [ins,  setIns]  = useState<AgentSt>("idle");
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [interimText, setInterimText] = useState("");
  const [timer, setTimer]   = useState(0);
  const [error, setError]   = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [srSupported] = useState(() => SR !== null);

  const sessionIdRef   = useRef<string | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const activeRef      = useRef(false);    // true while session is live
  const speakingRef    = useRef(false);    // true while ElevenLabs audio plays
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const live = !["idle","connecting","ending","completed"].includes(callState);
    if (live) {
      timerRef.current = setInterval(() => setTimer(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimText]);

  const fmt = (s: number) =>
    `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // ── Session helpers ───────────────────────────────────────────────────────
  const startSession = useCallback(async (): Promise<string | null> => {
    try {
      const r = await fetch("/api/voice/session/start", { method: "POST" });
      const d = await r.json() as { sessionId: string };
      return d.sessionId;
    } catch { return null; }
  }, []);

  // ── ElevenLabs TTS ────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string): Promise<void> => {
    setOrbState("speaking");
    setCallState("speaking");
    speakingRef.current = true;
    try {
      const r = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) return;
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      return new Promise(resolve => {
        const audio = new Audio(url);
        audioRef.current = audio;
        const done = () => { URL.revokeObjectURL(url); speakingRef.current = false; resolve(); };
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
    } catch { speakingRef.current = false; }
  }, []);

  // ── Ask OpenAI for a response to user speech ──────────────────────────────
  const getResponse = useCallback(async (userText: string): Promise<string> => {
    let sid = sessionIdRef.current;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!sid) { sid = await startSession(); sessionIdRef.current = sid; }
      if (!sid) break;
      try {
        const r = await fetch("/api/voice/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userText, sessionId: sid }),
        });
        if (r.status === 404 && attempt === 0) {
          sid = await startSession(); sessionIdRef.current = sid; continue;
        }
        if (!r.ok) break;
        const d = await r.json() as { responseText: string };
        return d.responseText;
      } catch { break; }
    }
    return "I heard you. Tell me more about that.";
  }, [startSession]);

  // ── Build and start SpeechRecognition ─────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SR || !activeRef.current || speakingRef.current || isMuted) return;

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang           = "en-US";
    rec.continuous     = false;   // one utterance at a time
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    setCallState("listening");
    setOrbState("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      const results: any[] = Array.from(ev.results);
      const interim = results.map((r: any) => r[0].transcript).join(" ");
      setInterimText(interim);
    };

    rec.onend = async () => {
      setInterimText("");
      if (!activeRef.current) return;

      // Grab the last final result from the recognition session
      // (onend fires after the last result has been delivered)
      const lastFinalRef = (rec as unknown as { _lastFinal?: string })._lastFinal;

      if (!lastFinalRef || lastFinalRef.trim().length < 2) {
        // Nothing meaningful spoken — restart immediately
        if (activeRef.current && !speakingRef.current) startListening();
        return;
      }

      const userText = lastFinalRef.trim();
      setTranscript(prev => [...prev, { role: "user", text: userText }]);
      setCallState("processing");
      setOrbState("thinking");
      setMem("processing"); setDec("processing");

      const aiText = await getResponse(userText);
      if (!activeRef.current) return;

      setMem("active"); setTl("processing"); setDec("active"); setIns("processing");
      setTranscript(prev => [...prev, { role: "assistant", text: aiText }]);

      await speak(aiText);
      if (!activeRef.current) return;

      setIns("active"); setTl("active");
      // Done speaking — start listening again
      startListening();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (ev: any) => {
      if (ev.error === "no-speech" || ev.error === "aborted") {
        if (activeRef.current && !speakingRef.current) startListening();
      } else if (ev.error === "not-allowed") {
        setError("Microphone permission was denied. Allow microphone access and try again.");
        activeRef.current = false;
        setCallState("completed"); setOrbState("idle");
      }
    };

    // Capture final result text before onend fires
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.addEventListener("result", (ev: any) => {
      const results: any[] = Array.from(ev.results);
      const finalText = results
        .filter((r: any) => r.isFinal)
        .map((r: any) => r[0].transcript)
        .join(" ");
      if (finalText) {
        (rec as unknown as { _lastFinal: string })._lastFinal = finalText;
      }
    });

    try { rec.start(); } catch { /* already started */ }
  }, [getResponse, isMuted, speak]);

  // ── Start call ────────────────────────────────────────────────────────────
  const startCall = async () => {
    if (!srSupported) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    setError(null);
    setCallState("connecting");
    setOrbState("thinking");
    setTranscript([]);
    setTimer(0);

    const sid = await startSession();
    if (!sid) {
      setError("Could not reach the API server. Please check it is running.");
      setCallState("idle"); setOrbState("idle");
      return;
    }
    sessionIdRef.current = sid;
    activeRef.current = true;

    setTimeout(() => setMem("active"),  300);
    setTimeout(() => setTl("active"),   600);
    setTimeout(() => setDec("active"),  900);
    setTimeout(() => setIns("active"),  1200);

    const greeting = "LifeLens Core is active. I'm listening — what's on your mind?";
    setTranscript([{ role: "assistant", text: greeting }]);

    await speak(greeting);
    if (activeRef.current) startListening();
  };

  // ── End call ──────────────────────────────────────────────────────────────
  const endCall = async () => {
    activeRef.current = false;
    setCallState("ending"); setOrbState("thinking");

    recognitionRef.current?.abort();
    recognitionRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    speakingRef.current = false;

    setMem("processing"); setTl("processing"); setDec("processing"); setIns("processing");

    if (sessionIdRef.current) {
      try {
        await fetch("/api/voice/session/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });
      } catch { /* ignore */ }
      sessionIdRef.current = null;
    }

    setCallState("completed"); setOrbState("idle");
    setMem("idle"); setTl("idle"); setDec("idle"); setIns("idle");
  };

  // ── Mute ──────────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      // Muted — stop current recognition
      recognitionRef.current?.abort();
      setCallState("listening"); // show as listening but not recording
    } else if (activeRef.current && !speakingRef.current) {
      startListening();
    }
  };

  const isLive = !["idle","connecting","ending","completed"].includes(callState);

  const statusText: Record<CallState, string> = {
    idle:       "System standby",
    connecting: "Initializing neural link...",
    listening:  isMuted ? "Muted — tap mic to resume" : "● Listening — speak now",
    processing: "Processing your words...",
    speaking:   "Speaking response",
    ending:     "Saving session...",
    completed:  "Session complete",
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col relative max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Neural Voice Interface
              {isLive && (
                <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-xs font-mono animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> LIVE
                </span>
              )}
            </h1>
            <p className={`mt-1 text-sm ${callState === "listening" && !isMuted ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {statusText[callState]}
            </p>
          </div>
          <div className="font-mono text-2xl text-primary drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]">
            {fmt(timer)}
          </div>
        </header>

        {/* Errors */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
            </motion.div>
          )}
          {!srSupported && callState === "idle" && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              Speech recognition requires Chrome or Edge. Other browsers are not supported.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">

          {/* ── Main Orb ── */}
          <div className="lg:col-span-2 glass-panel border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative z-10 flex flex-col items-center gap-12">
              <AICoreOrb state={orbState} size={280} />

              {/* Waveform when listening */}
              {callState === "listening" && !isMuted && (
                <div className="flex items-center gap-1 -mt-8">
                  {[0,1,2,3,4,5,6].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full bg-primary"
                      animate={{ height: ["8px","28px","8px"] }}
                      transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.065, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-4 items-center">
                {(callState === "idle" || callState === "completed") && (
                  <Button onClick={startCall} size="lg" disabled={!srSupported}
                    className="h-16 px-12 rounded-full text-lg bg-primary hover:bg-primary/80 text-white shadow-[0_0_30px_rgba(14,165,233,0.4)] disabled:opacity-40">
                    <Mic className="mr-3 w-6 h-6" />
                    {callState === "completed" ? "New Session" : "Begin Session"}
                  </Button>
                )}

                {isLive && (
                  <>
                    <Button onClick={toggleMute} size="lg" variant="outline"
                      className={`h-14 w-14 rounded-full p-0 border-white/20 ${isMuted ? "bg-red-500/20 border-red-500/50 text-red-400" : "hover:bg-white/10"}`}
                      title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button onClick={endCall} size="lg"
                      className="h-16 px-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                      <PhoneOff className="mr-3 w-6 h-6" /> End Session
                    </Button>
                  </>
                )}

                {(callState === "connecting" || callState === "ending") && (
                  <Button disabled size="lg" className="h-16 px-12 rounded-full bg-white/10 text-white">
                    <span className="animate-pulse">
                      {callState === "connecting" ? "Connecting..." : "Saving..."}
                    </span>
                  </Button>
                )}
              </div>

              {/* Browser info */}
              {callState === "idle" && srSupported && (
                <p className="text-xs text-muted-foreground/40 text-center max-w-xs">
                  Voice recognition runs locally in your browser — no quota needed.
                </p>
              )}
            </div>
          </div>

          {/* ── Side Panel ── */}
          <div className="flex flex-col gap-6 h-[500px] lg:h-auto">
            {/* Agents */}
            <div className="glass-panel p-6 rounded-2xl border-white/10">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Neural Coprocessors</h3>
              <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                <AgentOrb type="memory"   state={mem} label="Memory"   size={50} />
                <AgentOrb type="timeline" state={tl}  label="Timeline" size={50} />
                <AgentOrb type="decision" state={dec} label="Decision" size={50} />
                <AgentOrb type="insight"  state={ins} label="Insight"  size={50} />
              </div>
            </div>

            {/* Transcript */}
            <div className="glass-panel p-5 rounded-2xl border-white/10 flex-1 flex flex-col overflow-hidden min-h-[250px]">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                Live Transcript
                {callState === "listening" && !isMuted && (
                  <span className="flex items-center gap-1.5 text-primary text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> REC
                  </span>
                )}
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence initial={false}>
                  {transcript.length === 0 && !interimText && (
                    <p className="text-xs text-muted-foreground/40 text-center mt-8">
                      {callState === "idle" ? "Start a session to begin." : "Waiting for speech..."}
                    </p>
                  )}
                  {transcript.map((line, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`p-3 rounded-xl text-sm leading-relaxed ${
                        line.role === "user"
                          ? "bg-white/5 border border-white/10 text-white/85"
                          : "bg-primary/10 border border-primary/20 text-white"
                      }`}
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-1">
                        {line.role === "user" ? "You" : "LifeLens"}
                      </span>
                      {line.text}
                    </motion.div>
                  ))}

                  {/* Interim speech shown in real-time while user speaks */}
                  {interimText && (
                    <motion.div
                      key="interim"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-3 rounded-xl text-sm leading-relaxed bg-white/3 border border-white/5 text-white/50 italic"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-1">You (live)</span>
                      {interimText}
                      <span className="animate-pulse">▌</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
