import { motion } from "framer-motion";

export type AgentType = "memory" | "timeline" | "decision" | "insight";
export type AgentState = "idle" | "active" | "processing";

interface AgentOrbProps {
  type: AgentType;
  state?: AgentState;
  size?: number;
  label?: string;
  className?: string;
}

export function AgentOrb({ type, state = "idle", size = 64, label, className = "" }: AgentOrbProps) {
  const getConfig = () => {
    switch (type) {
      case "memory": return { color: "var(--primary)", glow: "rgba(var(--primary), 0.6)" };
      case "timeline": return { color: "var(--secondary)", glow: "rgba(var(--secondary), 0.6)" };
      case "decision": return { color: "var(--chart-3)", glow: "rgba(var(--chart-3), 0.6)" };
      case "insight": return { color: "var(--chart-4)", glow: "rgba(var(--chart-4), 0.6)" };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: state === "active" ? [1, 1.3, 1] : state === "processing" ? [1, 1.1, 1] : 1,
            opacity: state === "active" ? [0.4, 0.8, 0.4] : 0.4
          }}
          transition={{
            duration: state === "active" ? 1 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`
          }}
        />

        <motion.div
          className="relative z-10 rounded-full border border-white/20 backdrop-blur-sm"
          style={{ 
            width: size * 0.6, 
            height: size * 0.6,
            background: `radial-gradient(circle at 30% 30%, hsl(${config.color}) 0%, rgba(0,0,0,0.8) 100%)`,
            boxShadow: state !== "idle" ? `0 0 15px hsl(${config.color} / 0.5)` : 'none'
          }}
          animate={{
            rotate: state === "processing" ? 360 : 0
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {state === "processing" && (
          <motion.svg 
            className="absolute inset-0 w-full h-full text-white/50" 
            viewBox="0 0 100 100"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 20" />
          </motion.svg>
        )}
      </div>
      
      {label && (
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      )}
    </div>
  );
}
