import { motion } from "framer-motion";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface AICoreOrbProps {
  state?: OrbState;
  size?: number;
  className?: string;
}

export function AICoreOrb({ state = "idle", size = 200, className = "" }: AICoreOrbProps) {
  const getGlowColor = () => {
    switch (state) {
      case "listening": return "rgba(var(--primary), 0.8)";
      case "thinking": return "rgba(var(--secondary), 0.8)";
      case "speaking": return "rgba(var(--chart-3), 0.8)";
      default: return "rgba(var(--primary), 0.4)";
    }
  };

  const getCoreColor = () => {
    switch (state) {
      case "listening": return "hsl(var(--primary))";
      case "thinking": return "hsl(var(--secondary))";
      case "speaking": return "hsl(var(--chart-3))";
      default: return "hsl(var(--primary))";
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      {/* Outer Glow / Pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            `0 0 20px 0px ${getGlowColor()}`,
            `0 0 60px 20px ${getGlowColor()}`,
            `0 0 20px 0px ${getGlowColor()}`
          ],
          scale: state === "listening" ? [1, 1.2, 1] : state === "speaking" ? [1, 1.5, 1] : [1, 1.1, 1]
        }}
        transition={{
          duration: state === "listening" ? 1.5 : state === "speaking" ? 0.8 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`
        }}
      />

      {/* Ring 1 (Thinking) */}
      {state === "thinking" && (
        <motion.div
          className="absolute inset-4 rounded-full border border-secondary/50"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Ring 2 (Speaking/Listening wave) */}
      {(state === "listening" || state === "speaking") && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ 
            scale: [1, 1.5, 2],
            opacity: [0.8, 0.4, 0]
          }}
          transition={{ 
            duration: state === "speaking" ? 1 : 2, 
            repeat: Infinity, 
            ease: "easeOut",
            staggerChildren: 0.2
          }}
        />
      )}

      {/* Core Orb */}
      <motion.div
        className="relative z-10 rounded-full backdrop-blur-md border border-white/10"
        style={{ 
          width: size * 0.4, 
          height: size * 0.4,
          background: `radial-gradient(circle at 30% 30%, ${getCoreColor()} 0%, #000 100%)`
        }}
        animate={{
          rotateX: state === "thinking" ? [0, 360] : 0,
          rotateY: state === "thinking" ? [0, 360] : 0,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Inner high-light */}
        <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[2px]" />
      </motion.div>
    </div>
  );
}
