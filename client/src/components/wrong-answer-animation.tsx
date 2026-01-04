import { useEffect, useState } from "react";

interface WrongAnswerAnimationProps {
  onWrongAnswer: (detail: { team: string; userId: number }) => void;
  currentTeam?: string;
}

export function WrongAnswerAnimation({ onWrongAnswer, currentTeam }: WrongAnswerAnimationProps) {
  const [show, setShow] = useState(false);
  const [animatingTeam, setAnimatingTeam] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<{ team: string; userId: number }>) => {
      const { team } = e.detail;
      // Only show animation for teammates (or everyone if you want)
      if (team === currentTeam) {
        setAnimatingTeam(team);
        setShow(true);
        setTimeout(() => setShow(false), 2000); // 2s animation
        onWrongAnswer?.(e.detail);
      }
    };

    window.addEventListener("wrong_answer", handler as EventListener);
    return () => window.removeEventListener("wrong_answer", handler as EventListener);
  }, [currentTeam, onWrongAnswer]);

  if (!show) return null;

  const isRed = animatingTeam === "red";

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div
        className="text-8xl animate-bounce"
        style={{
          filter: isRed ? "hue-rotate(0deg)" : "hue-rotate(200deg)",
          color: isRed ? "#ef4444" : "#3b82f6",
        }}
      >
        😞
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-ping"
            style={{
              animation: `ping 1s cubic-bezier(0, 0, 0.2, 1) ${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translateY(-80px)`,
              color: isRed ? "#ef4444" : "#3b82f6",
            }}
          >
            ❌
          </div>
        ))}
      </div>
    </div>
  );
}
