import { Link } from "wouter";
import { motion } from "framer-motion";
import { AICoreOrb } from "@/components/ui/AICoreOrb";
import { AgentOrb } from "@/components/ui/AgentOrb";
import { Button } from "@/components/ui/button";
import { Brain, Clock, GitBranch, Lightbulb, ArrowRight, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 glass-panel border-b border-border/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)]">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">LifeLens</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-blue">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-20 gap-12 max-w-7xl mx-auto">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                Your life, <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient">remembered.</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              LifeLens is a voice-first AI companion that listens, understands, and helps you learn from your life experiences. Not just a journal—an intelligent operating system for your mind.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Initialize Core <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-white/20 hover:bg-white/10">
                  Access Dashboard
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div 
            className="flex-1 flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative">
              <img src="/hero-orb.png" alt="LifeLens AI Core" className="w-full max-w-lg object-contain drop-shadow-[0_0_50px_rgba(var(--primary),0.3)] mix-blend-screen" />
            </div>
          </motion.div>
        </section>

        {/* Neural Architecture Section */}
        <section className="py-24 px-6 md:px-12 bg-black/40 border-y border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">A Neural Architecture for Life</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Four specialized AI agents work in unison to process, connect, and derive meaning from your daily experiences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  type: "memory", 
                  title: "Memory Agent", 
                  desc: "Extracts and categorizes key memories from your conversations with emotional context.",
                  icon: Brain,
                  color: "text-primary"
                },
                { 
                  type: "timeline", 
                  title: "Timeline Agent", 
                  desc: "Builds a chronological map of your life events, identifying milestones and chapters.",
                  icon: Clock,
                  color: "text-secondary"
                },
                { 
                  type: "decision", 
                  title: "Decision Agent", 
                  desc: "Analyzes the choices you make, their reasoning, and tracks their long-term impact.",
                  icon: GitBranch,
                  color: "text-yellow-500"
                },
                { 
                  type: "insight", 
                  title: "Insight Agent", 
                  desc: "Synthesizes patterns across memories to generate profound personal realizations.",
                  icon: Lightbulb,
                  color: "text-green-500"
                }
              ].map((agent, i) => (
                <motion.div 
                  key={agent.type}
                  className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="mb-6 flex justify-center">
                    <AgentOrb type={agent.type as any} state="active" size={80} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 flex items-center gap-2 justify-center ${agent.color}`}>
                    <agent.icon className="w-5 h-5" /> {agent.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {agent.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center">
           <motion.div
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 border border-primary/20 mb-8"
           >
             <Shield className="w-8 h-8 text-primary" />
           </motion.div>
           <h2 className="text-3xl md:text-5xl font-bold mb-6">Your data, encrypted in the void.</h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             LifeLens is designed with privacy at its core. Your memories, decisions, and insights belong to you alone. No training on personal data. Complete control.
           </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/10 glass-panel relative z-10">
        <p>&copy; {new Date().getFullYear()} LifeLens Operating System. All rights reserved.</p>
      </footer>
    </div>
  );
}