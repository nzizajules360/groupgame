import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRoom, useRoomMessages } from "@/hooks/use-game";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChatPanel } from "@/components/chat-panel";
import { GameWheel } from "@/components/game-wheel";
import { WrongAnswerAnimation } from "@/components/wrong-answer-animation";
import { TeamQuestionSetter } from "@/components/team-question-setter";
import { TeamAnswerWithTimer } from "@/components/team-answer-with-timer";
import { QuestionHistory } from "@/components/question-history";
import { TeamSpinner } from "@/components/team-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Copy, Shield, Trophy, Users, AlertCircle, PlayCircle, User } from "lucide-react";
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
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; authorTeam: 'red' | 'blue'; canAnswer: boolean; selectedPlayerId?: number; timeLeft?: number } | null>(null);
  const [questionHistory, setQuestionHistory] = useState<any[]>([]);
  const [askingTeam, setAskingTeam] = useState<'red' | 'blue' | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);

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
      send({ type: 'join_room', roomId, userId: user.id });
      setHasShownWelcome(true);
    }
  }, [isConnected, room, hasShownWelcome, roomId, send, user.id]);

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

  const handleWrongAnswer = () => {
    send({ type: 'wrong_answer' });
    toast({ title: "Wrong Answer!", description: "Your team will see the animation." });
  };

  const handleSelectPlayer = (playerId: number) => {
    send({ type: 'select_player', roomId, playerId });
  };

  const handleSpinComplete = (selectedTeam: 'red' | 'blue') => {
    setAskingTeam(selectedTeam);
    setShowSpinner(false);
    toast({ title: "Team Selected", description: `${selectedTeam === 'red' ? 'Red' : 'Blue'} team will ask the first question.` });
  };

  const handleTeamQuestionSubmit = (question: string, answer: string) => {
    send({ type: 'submit_team_question', roomId, question, answer });
    toast({ title: "Question submitted!", description: "The other team can now select a player to answer." });
  };

  const handleAnswerSubmit = (answer: string) => {
    send({ type: 'answer_question', roomId, answer });
  };

  // Listen for question_state and answer_result WS events
  useEffect(() => {
    const handleQuestionState = (e: CustomEvent<{ roomId: number; question: string; authorTeam: 'red' | 'blue'; canAnswer: boolean; selectedPlayerId?: number; timeLeft?: number }>) => {
      if (e.detail.roomId === roomId) {
        setCurrentQuestion({ question: e.detail.question, authorTeam: e.detail.authorTeam, canAnswer: e.detail.canAnswer && team !== e.detail.authorTeam, selectedPlayerId: e.detail.selectedPlayerId, timeLeft: e.detail.timeLeft });
      }
    };
    const handleAnswerResult = (e: CustomEvent<{ roomId: number; correct: boolean; answeringTeam: 'red' | 'blue'; question: string; answer?: string }>) => {
      if (e.detail.roomId === roomId) {
        // Add to history
        const entry = {
          id: Date.now().toString(),
          question: e.detail.question,
          answer: e.detail.answer,
          authorTeam: currentQuestion?.authorTeam,
          answeredBy: room?.users?.find(u => u.team === e.detail.answeringTeam)?.user.username,
          answeredAt: new Date(),
          isCorrect: e.detail.correct,
          timeTaken: currentQuestion?.timeLeft ? 20 - currentQuestion.timeLeft : undefined,
        };
        setQuestionHistory(prev => [entry, ...prev].slice(0, 50)); // keep last 50
        setCurrentQuestion(null);
        // Switch asking team for next round
        setAskingTeam(e.detail.answeringTeam === 'red' ? 'blue' : 'red');
        toast({
          title: e.detail.correct ? "Correct!" : "Wrong!",
          description: e.detail.correct ? `${e.detail.answeringTeam} team scored! Now it's ${e.detail.answeringTeam === 'red' ? 'Blue' : 'Red'}'s turn to ask.` : `Try next question.`,
        });
      }
    };
    window.addEventListener("question_state", handleQuestionState as EventListener);
    window.addEventListener("answer_result", handleAnswerResult as EventListener);
    return () => {
      window.removeEventListener("question_state", handleQuestionState as EventListener);
      window.removeEventListener("answer_result", handleAnswerResult as EventListener);
    };
  }, [roomId, toast, currentQuestion, room, team]);

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
      {/* Wrong Answer Animation Overlay */}
      <WrongAnswerAnimation currentTeam={team} onWrongAnswer={(detail) => {
        // Optional: you can log or handle the event here
        console.log("Wrong answer for team:", detail.team, "by user:", detail.userId);
      }} />

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
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation(`/profile/${user?.username}`)}
              className="text-muted-foreground hover:text-white"
            >
              <User className="w-4 h-4 mr-2" /> Profile
            </Button>
            <Avatar className="w-8 h-8 border border-white/10">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{user.username.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-12 lg:grid-cols-12 gap-6 overflow-hidden">
        
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
                    variant="ghost" 
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
                      send({ type: 'start_game', roomId });
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

            {/* PLAYING STATE */}
            {room.status === 'playing' && (
              <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
                {showSpinner ? (
                  <TeamSpinner
                    teams={[
                      { name: room.redName || 'Red Team', color: 'red' },
                      { name: room.blueName || 'Blue Team', color: 'blue' },
                    ]}
                    onSpinComplete={handleSpinComplete}
                    disabled={false}
                  />
                ) : askingTeam ? (
                  <>
                    {currentQuestion ? (
                      <TeamAnswerWithTimer
                        question={currentQuestion.question}
                        authorTeam={currentQuestion.authorTeam}
                        canAnswer={currentQuestion.canAnswer}
                        selectedPlayerId={currentQuestion.selectedPlayerId}
                        timeLeft={currentQuestion.timeLeft}
                        teammates={room.users?.filter(u => u.team === team && u.team !== 'spectator').map(u => ({ userId: u.userId, username: u.user.username })) || []}
                        currentUserId={user?.id}
                        currentTeam={team}
                        onSubmit={handleAnswerSubmit}
                        onSelectPlayer={handleSelectPlayer}
                      />
                    ) : (
                      <>
                        {team === askingTeam ? (
                          <TeamQuestionSetter
                            currentTeam={team}
                            onSubmit={handleTeamQuestionSubmit}
                          />
                        ) : (
                          <Card className="bg-card/40 border-white/10">
                            <CardContent className="p-6 text-center">
                              <p className="text-muted-foreground">
                                Waiting for {askingTeam === 'red' ? room.redName || 'Red Team' : room.blueName || 'Blue Team'} to set a question...
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <Button onClick={() => setShowSpinner(true)} size="lg">
                    <Trophy className="w-5 h-5 mr-2" />
                    Spin to Choose First Team
                  </Button>
                )}
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

        {/* QUESTION HISTORY SIDEBAR */}
        <aside className="col-span-12 lg:col-span-2 h-[300px] lg:h-auto border-t lg:border-t-0 lg:border-l border-white/5 bg-background">
          <QuestionHistory history={questionHistory} />
        </aside>
      </main>
    </div>
  );
}
