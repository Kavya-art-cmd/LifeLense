import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Bell, Eye, Database } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-secondary" /> Core Settings
          </h1>
          <p className="text-muted-foreground">Configure global system parameters and agent behavior.</p>
        </header>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="glass-panel p-6 rounded-2xl border-white/10">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-primary">
              <Bell className="w-5 h-5" /> Neural Alerts
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Insight Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alert when a new profound insight is synthesized.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Memory Reminders</Label>
                  <p className="text-sm text-muted-foreground">Surface past memories on their anniversaries.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">System Health</Label>
                  <p className="text-sm text-muted-foreground">Alerts regarding core performance and agent sync.</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Interface */}
          <div className="glass-panel p-6 rounded-2xl border-white/10">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-secondary">
              <Eye className="w-5 h-5" /> Interface Parameters
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Holographic Effects</Label>
                  <p className="text-sm text-muted-foreground">Enable glassmorphism and deep blur visual effects.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Motion & Animations</Label>
                  <p className="text-sm text-muted-foreground">Allow agents and orbs to pulse and rotate.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="glass-panel p-6 rounded-2xl border-white/10 border-red-500/20">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-destructive">
              <Database className="w-5 h-5" /> Data Management
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Export or permanently purge your neural data. These actions cannot be undone.</p>
              <div className="flex gap-4">
                <Button variant="outline" className="border-white/20 hover:bg-white/10">Export Data Core</Button>
                <Button variant="destructive" className="bg-destructive/20 text-destructive border border-destructive/50 hover:bg-destructive hover:text-white">Initialize Purge Protocol</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}