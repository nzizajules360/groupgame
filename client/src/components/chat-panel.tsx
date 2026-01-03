import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Message } from "@shared/schema";

interface ChatPanelProps {
  messages: (Message & { username?: string })[];
  onSendMessage: (content: string, team?: "red" | "blue") => void;
  currentTeam?: string;
  className?: string;
}

export function ChatPanel({ messages = [], onSendMessage, currentTeam, className }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<"global" | "team">("global");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    onSendMessage(inputValue, activeTab === "team" && currentTeam && currentTeam !== "spectator" ? currentTeam as "red" | "blue" : undefined);
    setInputValue("");
  };

  const filteredMessages = messages.filter(msg => {
    if (activeTab === "global") return !msg.team;
    return msg.team === currentTeam;
  });

  return (
    <div className={cn("flex flex-col h-full bg-card/30 backdrop-blur-sm border-l border-white/5", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <TabsList className="w-full grid grid-cols-2 bg-black/20">
            <TabsTrigger value="global" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Global
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              disabled={!currentTeam || currentTeam === "spectator"}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Shield className="w-4 h-4 mr-2" /> Team
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm italic py-8">
                No messages yet. Say hello!
              </div>
            ) : (
              filteredMessages.map((msg, idx) => (
                <div key={idx} className={cn("flex flex-col gap-1", msg.userId === 0 ? "items-center" : "items-start")}>
                  {msg.userId !== 0 && (
                    <span className="text-xs text-muted-foreground font-medium ml-1">
                      {msg.username || "Unknown"}
                    </span>
                  )}
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm max-w-[85%]",
                    msg.userId === 0 
                      ? "bg-white/5 text-muted-foreground text-xs italic"
                      : "bg-secondary text-secondary-foreground"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5 bg-black/10">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message ${activeTab === 'team' ? 'Team' : 'Global'}...`}
              className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
            />
            <Button type="submit" size="icon" className="shrink-0 bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Tabs>
    </div>
  );
}
