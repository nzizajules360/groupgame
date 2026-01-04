import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/Auth";
import LobbyPage from "@/pages/Lobby";
import GameRoom from "@/pages/GameRoom";
import ProfilePage from "@/pages/Profile";

// Wrap Route components to check protected status if needed
// For now, pages handle their own redirects via useAuth

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/lobby" component={LobbyPage} />
      <Route path="/game/:id" component={GameRoom} />
      <Route path="/profile/:username?" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
