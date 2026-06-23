import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Voice from "@/pages/voice";
import Memories from "@/pages/memories";
import Timeline from "@/pages/timeline";
import Decisions from "@/pages/decisions";
import Insights from "@/pages/insights";
import Chat from "@/pages/chat";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Video from "@/pages/Video";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/voice"><ProtectedRoute component={Voice} /></Route>
      <Route path="/memories"><ProtectedRoute component={Memories} /></Route>
      <Route path="/timeline"><ProtectedRoute component={Timeline} /></Route>
      <Route path="/decisions"><ProtectedRoute component={Decisions} /></Route>
      <Route path="/insights"><ProtectedRoute component={Insights} /></Route>
      <Route path="/chat"><ProtectedRoute component={Chat} /></Route>
      <Route path="/analytics"><ProtectedRoute component={Analytics} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      
      <Route path="/video" component={Video} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
