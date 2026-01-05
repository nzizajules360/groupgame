import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";

interface TeamSpinnerProps {
  teams: { name: string; color: 'red' | 'blue' }[];
  onSpinComplete: (selectedTeam: 'red' | 'blue') => void;
  disabled?: boolean;
}

export function TeamSpinner({ teams, onSpinComplete, disabled }: TeamSpinnerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSpin = () => {
    if (disabled || isSpinning) return;
    setIsSpinning(true);
    setSelectedIndex(null);

    // Spin for 3 seconds with random result
    const spins = 5 + Math.random() * 5;
    const finalRotation = spins * 360 + Math.random() * 360;
    setRotation(prev => prev + finalRotation);

    setTimeout(() => {
      const normalized = finalRotation % 360;
      const segmentAngle = 360 / teams.length;
      const index = Math.floor((360 - normalized) / segmentAngle) % teams.length;
      setSelectedIndex(index);
      setIsSpinning(false);
      onSpinComplete(teams[index].color);
    }, 3000);
  };

  const segmentAngle = 360 / teams.length;

  return (
    <Card className="bg-card/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Spin to Choose First Team
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-64 h-64 mx-auto">
          <svg
            className="w-full h-full transition-transform duration-[3000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
            viewBox="0 0 200 200"
          >
            {teams.map((team, i) => {
              const startAngle = i * segmentAngle;
              const endAngle = (i + 1) * segmentAngle;
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              const start = polarToCartesian(100, 100, 100, endAngle);
              const end = polarToCartesian(100, 100, 100, startAngle);
              const color = team.color === 'red' ? '#ef4444' : '#3b82f6';

              return (
                <g key={team.color}>
                  <path
                    d={`M 100 100 L ${start.x} ${start.y} A 100 100 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`}
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={100 + 50 * Math.cos((startAngle + endAngle) / 2 * Math.PI / 180)}
                    y={100 + 50 * Math.sin((startAngle + endAngle) / 2 * Math.PI / 180)}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {team.name}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-yellow-400" />
          </div>
        </div>

        {selectedIndex !== null && (
          <div className="text-center">
            <Badge variant={teams[selectedIndex].color === 'red' ? 'destructive' : 'default'} className="text-lg px-4 py-2">
              {teams[selectedIndex].name} asks first!
            </Badge>
          </div>
        )}

        <Button
          onClick={handleSpin}
          disabled={disabled || isSpinning}
          className="w-full"
          size="lg"
        >
          {isSpinning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4 mr-2" />
              Spin
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
