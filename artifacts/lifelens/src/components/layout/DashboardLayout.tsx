import { Link, useLocation } from "wouter";
import { 
  Home, 
  Mic, 
  Brain, 
  GitBranch, 
  Clock, 
  Lightbulb, 
  MessageSquare, 
  BarChart, 
  User, 
  Settings, 
  LogOut 
} from "lucide-react";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/voice", icon: Mic, label: "Voice Session" },
  { href: "/memories", icon: Brain, label: "Memories" },
  { href: "/timeline", icon: Clock, label: "Timeline" },
  { href: "/decisions", icon: GitBranch, label: "Decisions" },
  { href: "/insights", icon: Lightbulb, label: "Insights" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/analytics", icon: BarChart, label: "Analytics" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col glass-panel border-r border-border/50 hidden md:flex z-10">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)]">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            </div>
            <span className="font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">LifeLens</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 glow-blue" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-1">
          <Link 
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Profile</span>
          </Link>
          <Link 
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Decorative background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 p-6 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
