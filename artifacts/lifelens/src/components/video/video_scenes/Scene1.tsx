import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TITLE = "YOUR LIFE".split('');
const SUB   = "HAS A STORY.".split('');

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* Scanning line that draws across first */}
      <motion.div
        className="absolute top-1/2 left-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 1 ? { width: '100%', opacity: [0, 0.8, 0] } : {}}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />

      {/* Corner brackets */}
      {[
        'top-[22%] left-[12%] border-t border-l',
        'top-[22%] right-[12%] border-t border-r',
        'bottom-[22%] left-[12%] border-b border-l',
        'bottom-[22%] right-[12%] border-b border-r',
      ].map((cls, i) => (
        <motion.div
          key={i}
          className={`absolute w-8 h-8 border-blue-400/40 ${cls}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
        />
      ))}

      {/* Main headline — character stagger */}
      <div className="relative flex gap-[0.05em] mb-2" style={{ perspective: '600px' }}>
        {TITLE.map((ch, i) => (
          <motion.span
            key={i}
            className="text-[8vw] font-black tracking-tight leading-none text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif", display: 'inline-block' }}
            initial={{ opacity: 0, y: 50, rotateX: -60 }}
            animate={phase >= 1
              ? { opacity: 1, y: 0, rotateX: 0 }
              : { opacity: 0, y: 50, rotateX: -60 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, delay: phase >= 1 ? i * 0.045 : 0 }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        ))}
      </div>

      {/* Subline */}
      <div className="flex gap-[0.04em]" style={{ perspective: '600px' }}>
        {SUB.map((ch, i) => (
          <motion.span
            key={i}
            className="text-[8vw] font-black tracking-tight leading-none bg-clip-text text-transparent"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              display: 'inline-block',
              backgroundImage: 'linear-gradient(135deg, #60a5fa, #818cf8)',
            }}
            initial={{ opacity: 0, y: 40, rotateX: -50 }}
            animate={phase >= 2
              ? { opacity: 1, y: 0, rotateX: 0 }
              : { opacity: 0, y: 40, rotateX: -50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: phase >= 2 ? i * 0.04 : 0 }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        ))}
      </div>

      {/* "Who's listening?" reveal */}
      <motion.p
        className="mt-10 text-[1.6vw] font-light tracking-[0.35em] text-blue-300/70 uppercase"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        initial={{ opacity: 0, letterSpacing: '0.6em' }}
        animate={phase >= 3 ? { opacity: 1, letterSpacing: '0.35em' } : { opacity: 0, letterSpacing: '0.6em' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        Who's listening?
      </motion.p>

      {/* Pulsing glow dot below tagline */}
      <motion.div
        className="mt-6 w-1.5 h-1.5 rounded-full bg-blue-400"
        initial={{ opacity: 0, scale: 0 }}
        animate={phase >= 3
          ? { opacity: [0, 1, 0.4, 1], scale: [0, 1.2, 0.8, 1] }
          : { opacity: 0, scale: 0 }}
        transition={{ duration: 1.2, times: [0, 0.3, 0.6, 1] }}
      />
    </motion.div>
  );
}
