import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BARS = [0.3, 0.55, 0.8, 0.6, 1.0, 0.75, 0.45, 0.9, 0.65, 0.4, 0.85, 0.5, 0.7, 0.35, 0.95];

export function Scene2() {
  const [phase, setPhase] = useState(0);
  const [activeBar, setActiveBar] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 2) return;
    const iv = setInterval(() => setActiveBar(b => (b + 1) % BARS.length), 120);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-between px-[8vw]"
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60, filter: 'blur(8px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left: text */}
      <div className="w-[44%]">
        <motion.p
          className="text-[1.1vw] font-medium tracking-[0.3em] text-blue-400/70 uppercase mb-5"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Voice Interface
        </motion.p>

        <motion.h2
          className="text-[4.5vw] font-black leading-[1.05] text-white mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Speak<br />
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #818cf8)' }}>
            naturally.
          </span>
        </motion.h2>

        <motion.p
          className="text-[1.5vw] text-white/50 leading-relaxed mb-8"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          Your AI companion listens in real time,<br />
          understands context, and responds<br />
          with a human voice.
        </motion.p>

        {['Real-time transcription', 'ElevenLabs voice', 'Session memory'].map((tag, i) => (
          <motion.div key={tag} className="flex items-center gap-3 mb-3"
            initial={{ opacity: 0, x: -16 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.12 }}
          >
            <motion.div className="w-2 h-2 rounded-full bg-blue-400"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.4 }}
            />
            <span className="text-[1.2vw] text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {tag}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Right: waveform orb */}
      <motion.div
        className="relative w-[36%] flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.3 }}
      >
        <motion.div className="absolute rounded-full border border-blue-500/20"
          style={{ width: '30vw', height: '30vw' }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div className="absolute rounded-full border border-indigo-500/15"
          style={{ width: '24vw', height: '24vw' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.div className="absolute rounded-full"
          style={{
            width: '14vw', height: '14vw',
            background: 'radial-gradient(circle at 40% 35%, #3b82f6, #4338ca 70%, #1e1b4b)',
            boxShadow: '0 0 60px 20px rgba(59,130,246,0.25)',
          }}
          animate={{ scale: [1, 1.04, 0.98, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Waveform bars */}
        <div className="absolute flex items-center gap-[0.4vw]" style={{ bottom: '18%' }}>
          {BARS.map((h, i) => (
            <motion.div key={i} className="rounded-full"
              style={{
                width: '0.35vw',
                background: i === activeBar || i === (activeBar + 1) % BARS.length ? '#60a5fa' : '#3b82f680',
              }}
              animate={{ height: phase >= 2 ? `${h * 4}vw` : '0.4vw' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.02 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
