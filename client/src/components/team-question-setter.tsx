import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TeamQuestionSetterProps {
  currentTeam?: string;
  onSubmit: (question: string, answer: string) => void;
  disabled?: boolean;
}

export function TeamQuestionSetter({ currentTeam, onSubmit, disabled }: TeamQuestionSetterProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast({ title: "Missing fields", description: "Both question and answer are required.", variant: "destructive" });
      return;
    }
    onSubmit(question.trim(), answer.trim());
    setQuestion("");
    setAnswer("");
  };

  if (!currentTeam || currentTeam === "spectator") return null;

  return (
    <Card className="bg-card/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-lg">Set a Question for {currentTeam === "red" ? "Blue" : "Red"} Team</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question..."
            className="bg-black/20 border-white/10"
          />
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter the answer..."
            className="bg-black/20 border-white/10"
          />
          <Button type="submit" disabled={disabled} className="w-full">
            Submit Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
