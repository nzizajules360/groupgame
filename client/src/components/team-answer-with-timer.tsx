import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface TeamAnswerWithTimerProps {
  question: string;
  authorTeam: 'red' | 'blue';
  canAnswer: boolean;
  selectedPlayerId?: number;
  timeLeft?: number;
  teammates: { userId: number; username: string }[];
  currentUserId?: number;
  currentTeam?: string;
  onSubmit: (answer: string) => void;
  onSelectPlayer: (playerId: number) => void;
  disabled?: boolean;
}

export function TeamAnswerWithTimer({
  question,
  authorTeam,
  canAnswer,
  selectedPlayerId,
  timeLeft,
  teammates,
  currentUserId,
  currentTeam,
  onSubmit,
  onSelectPlayer,
  disabled,
}: TeamAnswerWithTimerProps) {
  const [answer, setAnswer] = useState("");
  const { toast } = useToast();

  // Timer countdown effect
  useEffect(() => {
    if (typeof timeLeft === 'number' && timeLeft > 0) {
      const timer = setTimeout(() => {
        // Time's up: auto-fail
        if (timeLeft === 1) {
          toast({ title: "Time's up!", description: "Question marked as failed.", variant: "destructive" });
          // Optionally send a fail event or let server handle timeout
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast({ title: "Missing answer", description: "Please enter an answer.", variant: "destructive" });
      return;
    }
    onSubmit(answer.trim());
    setAnswer("");
  };

  const isMyTurn = canAnswer && selectedPlayerId === currentUserId;
  const isOpposingTeam = currentTeam && currentTeam !== authorTeam && currentTeam !== 'spectator';
  const showPlayerSelection = isOpposingTeam && !selectedPlayerId;

  return (
    <Card className="bg-card/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Question from{' '}
          <Badge variant={authorTeam === 'red' ? 'destructive' : 'default'} className="capitalize">
            {authorTeam} Team
          </Badge>
          {typeof timeLeft === 'number' && (
            <Badge variant="outline" className="ml-auto">
              {timeLeft}s
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{question}</p>

        {showPlayerSelection ? (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Select a player to answer:</p>
            <div className="flex flex-wrap gap-2">
              {teammates.map((mate) => (
                <Button
                  key={mate.userId}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectPlayer(mate.userId)}
                  disabled={disabled}
                >
                  <Avatar className="w-5 h-5 mr-2">
                    <AvatarFallback className="text-xs">
                      {mate.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {mate.username}
                </Button>
              ))}
            </div>
          </div>
        ) : selectedPlayerId ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Selected: {teammates.find(t => t.userId === selectedPlayerId)?.username || 'Unknown'}
            </p>
            {isMyTurn ? (
              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="bg-black/20 border-white/10"
                  autoFocus
                />
                <Button type="submit" disabled={disabled} className="w-full">
                  Submit Answer
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground italic">Waiting for selected player to answer...</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Waiting for the other team to select a player...</p>
        )}
      </CardContent>
    </Card>
  );
}
