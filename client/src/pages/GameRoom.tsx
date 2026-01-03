import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRoom, useRoomMessages } from "@/hooks/use-game";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChatPanel } from "@/components/chat-panel";
import { GameWheel } from "@/components/game-wheel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Copy, Shield, Trophy, Users, AlertCircle, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Animation for winning
import confetti from "canvas-confetti";

export default function GameRoom() {
  const [, params] = useRoute("/game/:id");
  const roomId = params ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: messages = [] } = useRoomMessages(roomId);
  const { send, isConnected } = useWebSocket(roomId);
  const { toast } = useToast();

  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Derived state
  const isHost = room && user ? room.hostId === user.id : false;
  const currentRoomUser = room?.users?.find(u => u.userId === user?.id);
  const team = currentRoomUser?.team || "spectator";

  // Redirect if not auth
  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Handle Join on Load
  useEffect(() => {
    if (isConnected && room && !hasShownWelcome) {
      send({ type: 'join_room', roomId });
      setHasShownWelcome(true);
    }
  }, [isConnected, room, hasShownWelcome, roomId, send]);

  const handleTeamSwitch = (newTeam: "red" | "blue" | "spectator") => {
    if (newTeam === team) return;
    send({ type: 'team_change', roomId, team: newTeam });
  };

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      toast({ title: "Copied!", description: "Room code copied to clipboard." });
    }
  };

  if (roomLoading || !room) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading Game...</p>
        </div>
      </div>
    );
  }

  // Split users by team
  const redTeam = room.users?.filter(u => u.team === 'red') || [];
  const blueTeam = room.users?.filter(u => u.team === 'blue') || [];
  const spectators = room.users?.filter(u => !u.team || u.team === 'spectator') || [];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-indigo-950/30 via-background to-background pointer-events-none" />

      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 bg-card/30 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/lobby")} className="text-xs">
            Exit
          </Button>
          <div className="flex items-center gap-2">
             <h1 className="font-display font-bold text-lg hidden md:block">Brain Spin</h1>
             <Separator orientation="vertical" className="h-6 hidden md:block" />
             <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/5 cursor-pointer hover:bg-black/30 transition-colors" onClick={copyCode}>
               <span className="text-xs text-muted-foreground uppercase tracking-wider">Code:</span>
               <span className="font-mono font-bold text-primary">{room.code}</span>
               <Copy className="w-3 h-3 text-muted-foreground" />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-full text-xs border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            {isConnected ? "Connected" : "Reconnecting..."}
          </div>
          <Avatar className="w-8 h-8 border border-white/10">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.username.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* LEFT SIDEBAR: Teams */}
        <aside className="col-span-2 hidden lg:flex flex-col border-r border-white/5 bg-card/20 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3 h-3" /> Teams
            </h3>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Red Team */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-red-400">RED TEAM</span>
                  <Badge variant="outline" className="border-red-500/30 text-red-400">{room.redScore}</Badge>
                </div>
                <div className="bg-red-500/5 rounded-xl p-2 min-h-[100px] border border-red-500/10 space-y-2">
                  {redTeam.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-black/20 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="truncate">{u.user?.username}</span>
                      {u.isHost && <Trophy className="w-3 h-3 text-yellow-500 ml-auto" />}
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleTeamSwitch('red')}
                    disabled={team === 'red'}
                  >
                    {team === 'red' ? 'Joined' : 'Join Red'}
                  </Button>
                </div>
              </div>

              {/* Blue Team */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-400">BLUE TEAM</span>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">{room.blueScore}</Badge>
                </div>
                <div className="bg-blue-500/5 rounded-xl p-2 min-h-[100px] border border-blue-500/10 space-y-2">
                  {blueTeam.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-black/20 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="truncate">{u.user?.username}</span>
                      {u.isHost && <Trophy className="w-3 h-3 text-yellow-500 ml-auto" />}
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    onClick={() => handleTeamSwitch('blue')}
                    disabled={team === 'blue'}
                  >
                    {team === 'blue' ? 'Joined' : 'Join Blue'}
                  </Button>
                </div>
              </div>

              {/* Spectators */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Spectators ({spectators.length})</span>
                <div className="space-y-1">
                  {spectators.map((u, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-2 px-2 py-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                       {u.user?.username}
                    </div>
                  ))}
                </div>
                {team !== 'spectator' && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs text-muted-foreground p-0 h-auto"
                    onClick={() => handleTeamSwitch('spectator')}
                  >
                    Switch to Spectator
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* CENTER STAGE: Game Content */}
        <section className="col-span-12 lg:col-span-7 flex flex-col relative">
          {/* Mobile Team Toggle could go here */}

          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            
            {/* LOBBY STATE */}
            {room.status === 'lobby' && (
              <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="space-y-2">
                   <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight">
                     Waiting for Host
                   </h2>
                   <p className="text-xl text-muted-foreground">The game will begin shortly.</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <div className="flex flex-col items-center p-4 bg-card/40 rounded-xl border border-white/5 min-w-[120px]">
                    <span className="text-3xl font-mono font-bold text-primary">{redTeam.length + blueTeam.length}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Players</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-card/40 rounded-xl border border-white/5 min-w-[120px]">
                     <span className="text-3xl font-mono font-bold text-white">{spectators.length}</span>
                     <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Spectators</span>
                  </div>
                </div>

                {isHost ? (
                  <Button 
                    size="lg" 
                    className="text-xl px-12 py-8 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-[0_0_30px_rgba(124,58,237,0.3)] animate-pulse"
                    onClick={() => {
                      send({ type: 'spin' }); // Just for demo, usually this sets status=playing
                      // In a real app, you'd send a start_game event
                      toast({ title: "Starting Game", description: "Let's go!" });
                    }}
                  >
                    <PlayCircle className="w-6 h-6 mr-3" /> START GAME
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 px-4 py-2 rounded-full">
                    <AlertCircle className="w-4 h-4" /> Waiting for host to start...
                  </div>
                )}
              </div>
            )}

            {/* PLAYING STATE - Demo Wheel */}
            {room.status === 'playing' && (
              <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
                <GameWheel 
                  options={["History", "Science", "Pop Culture", "Geography", "Sports", "Art"]}
                  onSpinEnd={(res) => {
                    toast({ 
                      title: "Topic Selected!", 
                      description: `The wheel landed on: ${res}`,
                      className: "bg-primary text-white border-none"
                    });
                    // Demo confetti
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                  }} 
                />
                
                <Card className="w-full bg-black/40 border-white/10 backdrop-blur-md">
                   <div className="p-6 text-center space-y-4">
                     <p className="text-sm text-muted-foreground uppercase tracking-widest">Current Question</p>
                     <p className="text-2xl font-medium">Which planet in our solar system is known as the Red Planet?</p>
                     
                     <div className="grid grid-cols-2 gap-4 mt-8">
                       <Button variant="outline" className="h-16 text-lg hover:bg-white/10 hover:border-white/20">Venus</Button>
                       <Button variant="outline" className="h-16 text-lg hover:bg-white/10 hover:border-white/20">Mars</Button>
                       <Button variant="outline" className="h-16 text-lg hover:bg-white/10 hover:border-white/20">Jupiter</Button>
                       <Button variant="outline" className="h-16 text-lg hover:bg-white/10 hover:border-white/20">Saturn</Button>
                     </div>
                   </div>
                </Card>
              </div>
            )}
            
          </div>
        </section>

        {/* RIGHT SIDEBAR: Chat */}
        <aside className="col-span-12 lg:col-span-3 h-[300px] lg:h-auto border-t lg:border-t-0 lg:border-l border-white/5 bg-background">
          <ChatPanel 
            messages={messages} 
            onSendMessage={(content, team) => send({ type: 'chat', content, team })}
            currentTeam={team}
          />
        </aside>
      </main>
    </div>
  );
}
