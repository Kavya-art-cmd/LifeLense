import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { startAmbient, stopAmbient } from '@/lib/video/ambient';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  hook:         6000,
  voice:        8000,
  memory:       8000,
  intelligence: 8000,
  closing:      7000,
};

const SCENE_COUNT = 5;

// Persistent orb positions per scene
const orbA = [
  { x: '10vw', y: '15vh', scale: 2.8, opacity: 0.18 },
  { x: '60vw', y: '5vh',  scale: 1.6, opacity: 0.22 },
  { x: '5vw',  y: '60vh', scale: 2.0, opacity: 0.15 },
  { x: '70vw', y: '30vh', scale: 3.0, opacity: 0.12 },
  { x: '30vw', y: '20vh', scale: 2.2, opacity: 0.20 },
];
const orbB = [
  { x: '70vw', y: '60vh', scale: 2.0, opacity: 0.14 },
  { x: '5vw',  y: '70vh', scale: 2.4, opacity: 0.18 },
  { x: '65vw', y: '20vh', scale: 1.8, opacity: 0.16 },
  { x: '15vw', y: '50vh', scale: 2.6, opacity: 0.20 },
  { x: '60vw', y: '65vh', scale: 1.4, opacity: 0.16 },
];
const linePos = [
  { left: '0%',  top: '48%', width: '35%' },
  { left: '50%', top: '8%',  width: '50%' },
  { left: '20%', top: '88%', width: '60%' },
  { left: '10%', top: '35%', width: '40%' },
  { left: '25%', top: '75%', width: '50%' },
];

export default function VideoTemplate() {
  // Pre-fetched audio blobs — index = scene number
  const audioBuffers = useRef<(AudioBuffer | null)[]>(Array(SCENE_COUNT).fill(null));
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const currentSrc   = useRef<AudioBufferSourceNode | null>(null);
  const ambientStarted = useRef(false);

  // Fetch and decode all narration audio up front
  useEffect(() => {
    const ac = new AudioContext();
    audioCtxRef.current = ac;

    const load = async () => {
      await Promise.all(
        Array.from({ length: SCENE_COUNT }, async (_, i) => {
          try {
            const res = await fetch(`/api/tts/narration?scene=${i}`);
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            audioBuffers.current[i] = await ac.decodeAudioData(buf);
          } catch {
            // fail silently — scene will just have no narration
          }
        })
      );
    };

    load();

    return () => {
      try { ac.close(); } catch { /* ignore */ }
    };
  }, []);

  const playNarration = useCallback((scene: number) => {
    const ac = audioCtxRef.current;
    const buf = audioBuffers.current[scene];
    if (!ac || !buf) return;

    // Stop any currently playing narration
    try { currentSrc.current?.stop(); } catch { /* ignore */ }

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ac.state === 'suspended') ac.resume();

    const src = ac.createBufferSource();
    src.buffer = buf;

    // Narration gain — sits above the ambient music
    const gain = ac.createGain();
    gain.gain.value = 1.0;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
    currentSrc.current = src;
  }, []);

  const onSceneChange = useCallback((scene: number) => {
    // Start ambient music on first scene change (requires user gesture already happened via click)
    if (!ambientStarted.current) {
      ambientStarted.current = true;
      startAmbient();
    }
    playNarration(scene);
  }, [playNarration]);

  // Stop ambient on unmount
  useEffect(() => () => stopAmbient(), []);

  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS, onSceneChange });
  const s = currentScene;

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#030712] text-white cursor-pointer"
      onClick={() => {
        // User click satisfies autoplay policy — resume AudioContext and start ambient
        audioCtxRef.current?.resume();
        if (!ambientStarted.current) {
          ambientStarted.current = true;
          startAmbient();
        }
      }}
    >
      {/* ── Persistent deep background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(ellipse 80% 60% at 20% 30%, #0f172a 0%, #030712 100%)',
              'radial-gradient(ellipse 80% 60% at 70% 60%, #0f1f3d 0%, #030712 100%)',
              'radial-gradient(ellipse 80% 60% at 30% 70%, #0f172a 0%, #030712 100%)',
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orb A — blue */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{ width: '40vw', height: '40vw', background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
          animate={{ x: orbA[s].x, y: orbA[s].y, scale: orbA[s].scale, opacity: orbA[s].opacity }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Orb B — indigo */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{ width: '35vw', height: '35vw', background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
          animate={{ x: orbB[s].x, y: orbB[s].y, scale: orbB[s].scale, opacity: orbB[s].opacity }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Micro floating particles */}
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 13 + 8) % 88}%`,
              background: i % 2 === 0 ? '#3b82f6' : '#818cf8',
              opacity: 0.25 + (i % 4) * 0.1,
            }}
            animate={{ y: [0, -(12 + i * 3), 0], opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}
      </div>

      {/* ── Persistent accent line ── */}
      <motion.div
        className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-blue-400 to-transparent pointer-events-none"
        animate={{ left: linePos[s].left, top: linePos[s].top, width: linePos[s].width, opacity: 0.6 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ── Click-to-start overlay (first visit only) ── */}
      <motion.div
        className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 1.0 }}
      >
        <motion.div
          className="px-6 py-3 rounded-full border border-white/20 text-white/50 text-sm tracking-widest uppercase"
          style={{ fontFamily: "'Space Grotesk', sans-serif", backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.4)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: 2 }}
        >
          Click anywhere for audio
        </motion.div>
      </motion.div>

      {/* ── Scene foreground ── */}
      <AnimatePresence mode="popLayout">
        {s === 0 && <Scene1 key="hook" />}
        {s === 1 && <Scene2 key="voice" />}
        {s === 2 && <Scene3 key="memory" />}
        {s === 3 && <Scene4 key="intelligence" />}
        {s === 4 && <Scene5 key="closing" />}
      </AnimatePresence>
    </div>
  );
}
