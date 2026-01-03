import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";

interface GameWheelProps {
  onSpinEnd: (result: string) => void;
  options: string[];
}

export function GameWheel({ onSpinEnd, options }: GameWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const controls = useAnimation();

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Random rotation between 5 and 10 full spins + random offset
    const randomSpin = 360 * 5 + Math.random() * 360 * 5; 
    
    await controls.start({
      rotate: randomSpin,
      transition: { duration: 4, type: "spring", stiffness: 50, damping: 20 }
    });

    // Simple calculation to find the winner based on angle (assuming equal slices)
    // In a real app, you might want the server to dictate the winner first, then spin to it.
    // For this UI demo, we'll just pick a random option.
    const winner = options[Math.floor(Math.random() * options.length)];
    
    setIsSpinning(false);
    onSpinEnd(winner);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-12 bg-accent shadow-lg" 
             style={{ clipPath: "polygon(100% 0, 0 0, 50% 100%)" }} />

        {/* Wheel */}
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full border-4 border-white/20 relative overflow-hidden bg-card shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          style={{ background: "conic-gradient(from 0deg, #ef4444 0deg 90deg, #3b82f6 90deg 180deg, #22c55e 180deg 270deg, #eab308 270deg 360deg)" }}
        >
          {/* Slices logic would go here for dynamic options */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-background border-4 border-white/20 z-10" />
          </div>
        </motion.div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={isSpinning}
        size="lg"
        className="w-48 text-lg font-display uppercase tracking-wider bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25"
      >
        {isSpinning ? "Spinning..." : "SPIN!"}
      </Button>
    </div>
  );
}
