import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  question: string;
  answer?: string;
  authorTeam: 'red' | 'blue';
  answeredBy?: string;
  answeredAt?: Date;
  timeTaken?: number; // seconds
  isCorrect?: boolean;
  comments?: string;
}

interface QuestionHistoryProps {
  history: HistoryEntry[];
  className?: string;
}

export function QuestionHistory({ history, className }: QuestionHistoryProps) {
  return (
    <Card className={cn("bg-card/40 border-white/10", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Question History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No questions yet.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={entry.authorTeam === 'red' ? 'destructive' : 'default'} className="capitalize">
                      {entry.authorTeam}
                    </Badge>
                    {entry.answeredAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(entry.answeredAt, 'HH:mm:ss')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">{entry.question}</p>
                  {entry.answer && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Answer:</span> {entry.answer}
                    </p>
                  )}
                  {entry.answeredBy && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-[10px]">
                          {entry.answeredBy[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Answered by {entry.answeredBy}
                        {typeof entry.timeTaken === 'number' && ` in ${entry.timeTaken}s`}
                        {typeof entry.isCorrect === 'boolean' && (
                          <Badge variant={entry.isCorrect ? 'default' : 'destructive'} className="ml-2">
                            {entry.isCorrect ? 'Correct' : 'Wrong'}
                          </Badge>
                        )}
                      </span>
                    </div>
                  )}
                  {entry.comments && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      <span className="font-medium">Comment:</span> {entry.comments}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
