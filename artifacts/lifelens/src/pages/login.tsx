import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AICoreOrb } from "@/components/ui/AICoreOrb";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "user@lifelens.ai",
      password: "password123",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Mock authentication
    setTimeout(() => {
      login("mock_token_123");
      toast({
        title: "Authentication successful",
        description: "Welcome back to LifeLens.",
      });
      setLocation("/dashboard");
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 z-20 group">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.8)] transition-all">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
        <span className="font-bold tracking-wider text-muted-foreground group-hover:text-white transition-colors">LifeLens</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <AICoreOrb state={isLoading ? "thinking" : "idle"} size={120} />
        </motion.div>

        <motion.div
          className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">System Login</h1>
            <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access the core.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Identity</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" className="bg-black/50 border-white/10 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Passkey</FormLabel>
                      <Link href="#" className="text-xs text-primary hover:text-primary-foreground transition-colors">Forgot?</Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-black/50 border-white/10 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-blue h-12" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            New to the system?{" "}
            <Link href="/register" className="text-white hover:text-primary transition-colors">
              Create an identity
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}