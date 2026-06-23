import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Constellation node positions (% of container)
const NODES = [
  { cx: 50, cy: 50, r: 1.8, label: 'You', primary: true },
  { cx: 22, cy: 28, r: 1.2, label: 'Career' },
  { cx: 76, cy: 24, r: 1.0, label: 'Health' },
  { cx: 18, cy: 65, r: 1.1, label: 'Family' },
  { cx: 80, cy: 68, r: 1.0, label: 'Goals' },
  { cx: 50, cy: 18, r: 0.9, label: 'Travel' },
  { cx: 36, cy: 78, r: 0.8, label: 'Finance' },
  { cx: 66, cy: 78, r: 0.9, label: 'Growth' },
];
const EDGES = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[1,5],[2,4],[3,6]];

const INSIGHTS = [
  'Career growth correlates with exercise habits',
  'Decision confidence peaks on Tuesdays',
  'Travel experiences improve long-term wellbeing',
];

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2600),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-between px-[7vw]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left: constellation */}
      <div className="relative w-[46%] h-[60vh]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Edges */}
          {EDGES.map(([a, b], i) => (
            <motion.line
              key={i}
              x1={NODES[a].cx} y1={NODES[a].cy}
              x2={NODES[b].cx} y2={NODES[b].cy}
              stroke="url(#edgeGrad)" strokeWidth="0.3" strokeOpacity="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={phase >= 2 ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: i * 0.09 }}
            />
          ))}
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          {/* Nodes */}
          {NODES.map((node, i) => (
            <g key={i}>
              {node.primary && (
                <motion.circle cx={node.cx} cy={node.cy} r="4" fill="none" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.35"
                  animate={{ r: [4, 5.5, 4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <motion.circle
                cx={node.cx} cy={node.cy} r={node.r}
                fill={node.primary ? '#3b82f6' : '#818cf8'}
                initial={{ scale: 0, opacity: 0 }}
                animate={phase >= 1 ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.07 }}
                style={{ transformOrigin: `${node.cx}% ${node.cy}%` }}
              />
              <motion.text
                x={node.cx} y={node.cy + node.r + 2.5}
                textAnchor="middle" fontSize="2.5" fill="rgba(255,255,255,0.55)"
                fontFamily="'Space Grotesk', sans-serif"
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                {node.label}
              </motion.text>
            </g>
          ))}
        </svg>
      </div>

      {/* Right: text + insights */}
      <div className="w-[46%]">
        <motion.p
          className="text-[1.1vw] font-medium tracking-[0.3em] text-blue-400/70 uppercase mb-5"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          Life Intelligence
        </motion.p>

        <motion.h2
          className="text-[4.2vw] font-black leading-[1.05] text-white mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          Patterns<br />
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #818cf8)' }}>
            emerge.
          </span>
        </motion.h2>

        <motion.p
          className="text-[1.4vw] text-white/50 leading-relaxed mb-8"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          LifeLens maps the invisible threads<br />
          connecting your life's domains —<br />
          surfacing insights you'd never find alone.
        </motion.p>

        {INSIGHTS.map((text, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 mb-4"
            initial={{ opacity: 0, x: 20 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <div className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)' }} />
            <span className="text-[1.2vw] text-white/60 leading-snug"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
