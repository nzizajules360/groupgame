import { useAuth } from "@/hooks/use-auth";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Plus, Users, Trophy, ChevronRight, User } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function LobbyPage() {
  const { user, logout } = useAuth();
  const { createRoom, joinRoom } = useGame();
  const [, setLocation] = useLocation();
  const [joinCode, setJoinCode] = useState("");

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Brain Spin</h1>
            <p className="text-xs text-muted-foreground">Welcome back, {user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation(`/profile/${user.username}`)}
            className="text-muted-foreground hover:text-white"
          >
            <User className="w-4 h-4 mr-2" /> Profile
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout.mutate()}
            className="text-muted-foreground hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Game Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:border-primary/40 transition-colors group relative overflow-hidden h-[300px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Create New Game</CardTitle>
            <CardDescription>Host a new trivia room and invite your friends.</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Button 
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => createRoom.mutate({ name: `${user.username}'s Room` })}
              disabled={createRoom.isPending}
            >
              {createRoom.isPending ? "Creating..." : "Host Game"}
            </Button>
          </CardContent>
        </Card>

        {/* Join Game Card */}
        <Card className="bg-card/50 border-white/10 hover:border-white/20 transition-colors h-[300px] flex flex-col justify-between">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-display">Join Existing Game</CardTitle>
            <CardDescription>Enter a room code to join the action.</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="relative">
              <Input 
                placeholder="ENTER CODE (e.g. A1B2)" 
                className="h-12 bg-black/20 border-white/10 text-center text-lg tracking-widest uppercase font-mono"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button 
              variant="secondary" 
              className="w-full h-12 text-lg font-semibold"
              onClick={() => joinRoom.mutate({ code: joinCode })}
              disabled={!joinCode || joinRoom.isPending}
            >
              {joinRoom.isPending ? "Joining..." : (
                <span className="flex items-center gap-2">
                  Enter Room <ChevronRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Profile/Stats Stats (Quick View) */}
      <section className="w-full max-w-4xl mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-white/5 rounded-xl p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Total Games</span>
          <span className="text-2xl font-mono font-bold">{user.totalGames || 0}</span>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-xl p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Wins</span>
          <span className="text-2xl font-mono font-bold text-primary">{user.wins || 0}</span>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-xl p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Win Rate</span>
          <span className="text-2xl font-mono font-bold text-accent">
            {user.totalGames ? Math.round((user.wins! / user.totalGames!) * 100) : 0}%
          </span>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-xl p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Rank</span>
          <span className="text-2xl font-mono font-bold text-muted">Beginner</span>
        </div>
      </section>
    </div>
  );
}
