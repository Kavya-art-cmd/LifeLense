import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CARDS = [
  { label: 'Memory', tag: 'Career', text: 'Promoted to Senior Engineer', color: '#3b82f6' },
  { label: 'Decision', tag: 'Life', text: 'Move to Barcelona in Q3', color: '#818cf8' },
  { label: 'Timeline', tag: 'Milestone', text: 'Ran first marathon — 4h 12m', color: '#60a5fa' },
];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 5500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-between px-[8vw]"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -60, filter: 'blur(10px)' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left: cards stack */}
      <div className="relative w-[42%] h-[55vh] flex items-center justify-center">
        {CARDS.map((card, i) => (
          <motion.div
            key={i}
            className="absolute w-full rounded-2xl border border-white/10 p-6"
            style={{
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 0 40px ${card.color}22`,
            }}
            initial={{ opacity: 0, y: 60, rotateX: 20 }}
            animate={phase >= i + 2
              ? {
                  opacity: 1,
                  y: i * -14,
                  rotateX: 0,
                  scale: 1 - i * 0.04,
                  zIndex: CARDS.length - i,
                }
              : { opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26, delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.9vw] font-semibold tracking-widest uppercase text-white/40"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {card.label}
              </span>
              <span className="text-[0.8vw] px-3 py-1 rounded-full border font-medium"
                style={{ borderColor: `${card.color}50`, color: card.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                {card.tag}
              </span>
            </div>
            <p className="text-[1.4vw] font-semibold text-white leading-snug"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {card.text}
            </p>
            <motion.div className="mt-4 h-[1px] bg-gradient-to-r from-transparent to-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, ${card.color}60, transparent)` }}
              initial={{ scaleX: 0 }}
              animate={phase >= i + 2 ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Right: text */}
      <div className="w-[46%]">
        <motion.p
          className="text-[1.1vw] font-medium tracking-[0.3em] text-blue-400/70 uppercase mb-5"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          Memory System
        </motion.p>

        <motion.h2
          className="text-[4.5vw] font-black leading-[1.05] text-white mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          Every word<br />
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #818cf8)' }}>
            remembered.
          </span>
        </motion.h2>

        <motion.p
          className="text-[1.5vw] text-white/50 leading-relaxed mb-8"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          After every conversation, AI extracts<br />
          memories, decisions, and life events —<br />
          automatically, with zero effort.
        </motion.p>

        {/* Auto-save indicator */}
        <motion.div
          className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10"
          style={{ background: 'rgba(59,130,246,0.08)', maxWidth: '80%' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 4 ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div className="w-2.5 h-2.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-[1.1vw] text-white/60" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Auto-saving to memory...
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
