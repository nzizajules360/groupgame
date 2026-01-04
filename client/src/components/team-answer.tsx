import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TeamAnswerProps {
  question: string;
  authorTeam: 'red' | 'blue';
  canAnswer: boolean;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function TeamAnswer({ question, authorTeam, canAnswer, onSubmit, disabled }: TeamAnswerProps) {
  const [answer, setAnswer] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast({ title: "Missing answer", description: "Please enter an answer.", variant: "destructive" });
      return;
    }
    onSubmit(answer.trim());
    setAnswer("");
  };

  return (
    <Card className="bg-card/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Question from{' '}
          <Badge variant={authorTeam === 'red' ? 'destructive' : 'default'} className="capitalize">
            {authorTeam} Team
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{question}</p>
        {canAnswer ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="bg-black/20 border-white/10"
            />
            <Button type="submit" disabled={disabled} className="w-full">
              Submit Answer
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground italic">Waiting for the other team to answer...</p>
        )}
      </CardContent>
    </Card>
  );
}
