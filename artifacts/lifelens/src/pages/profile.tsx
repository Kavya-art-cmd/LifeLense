import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Profile Updated", description: "Your identity parameters have been synchronized." });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-primary" /> Identity Core
          </h1>
          <p className="text-muted-foreground">Manage your personal parameters and neural profile.</p>
        </header>

        <div className="glass-panel p-8 rounded-2xl border-white/10">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-4xl font-bold text-primary glow-blue">
              JD
            </div>
            <div>
              <h2 className="text-2xl font-bold">John Doe</h2>
              <p className="text-muted-foreground">Neural Level 4 • Active since 2024</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-muted-foreground uppercase text-xs tracking-wider">Designation</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" defaultValue="John Doe" className="pl-9 bg-black/50 border-white/10" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-muted-foreground uppercase text-xs tracking-wider">Communication Channel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" defaultValue="user@lifelens.ai" className="pl-9 bg-black/50 border-white/10" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" /> Security
              </h3>
              <div className="grid gap-4">
                <Button type="button" variant="outline" className="w-fit border-white/20 hover:bg-white/10">
                  Update Passkey
                </Button>
                <Button type="button" variant="outline" className="w-fit border-white/20 hover:bg-white/10">
                  Enable Biometric Auth
                </Button>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white glow-blue">
                Synchronize Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}