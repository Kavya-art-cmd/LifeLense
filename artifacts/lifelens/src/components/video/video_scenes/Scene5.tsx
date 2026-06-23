import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TAGLINE_A = "REMEMBER EVERYTHING.";
const TAGLINE_B = "UNDERSTAND YOURSELF.";

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.06 }}
      transition={{ duration: 1 }}
    >
      {/* Logo mark: animated ring + inner dot */}
      <motion.div
        className="relative mb-10 flex items-center justify-center"
        style={{ width: '10vw', height: '10vw' }}
        initial={{ opacity: 0, scale: 0, rotate: -120 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1, rotate: 0 } : {}}
        transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0 }}
      >
        {/* Outer ring — draws in */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <motion.circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="url(#logoGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={phase >= 1 ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          {/* Inner cross marks */}
          {[[50,20,50,38],[50,62,50,80],[20,50,38,50],[62,50,80,50]].map(([x1,y1,x2,y2], i) => (
            <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={phase >= 2 ? { pathLength: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            />
          ))}
          <motion.circle cx="50" cy="50" r="6" fill="url(#logoGrad)"
            initial={{ scale: 0 }}
            animate={phase >= 2 ? { scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.5 }}
            style={{ transformOrigin: '50% 50%' }}
          />
        </svg>

        {/* Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="text-[9vw] font-black tracking-tight leading-none bg-clip-text text-transparent mb-8"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #818cf8 100%)',
        }}
        initial={{ opacity: 0, y: 40, filter: 'blur(16px)' }}
        animate={phase >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        LifeLens
      </motion.h1>

      {/* Light sweep over brand name */}
      <motion.div
        className="absolute h-[9vw] pointer-events-none"
        style={{
          width: '30vw',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
        }}
        initial={{ x: '-30vw', opacity: 0 }}
        animate={phase >= 2 ? { x: '30vw', opacity: [0, 1, 0] } : {}}
        transition={{ duration: 0.9, delay: 0.2, ease: 'easeInOut' }}
      />

      {/* Taglines */}
      <motion.div
        className="flex items-center gap-5 text-[1.4vw] tracking-[0.28em] font-medium"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        initial={{ opacity: 0, y: 14 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <span className="text-white/70">{TAGLINE_A}</span>
        <span className="text-white/20">·</span>
        <span className="bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #818cf8)' }}>
          {TAGLINE_B}
        </span>
      </motion.div>

      {/* Bottom line */}
      <motion.div
        className="absolute bottom-[12%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 4 ? { width: '40vw', opacity: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}
