import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const GameCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-white/10 bg-card/50 backdrop-blur-md shadow-xl text-card-foreground",
        "relative overflow-hidden transition-all duration-300",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100",
        className
      )}
      {...props}
    />
  )
);
GameCard.displayName = "GameCard";

const GameCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
GameCardHeader.displayName = "GameCardHeader";

const GameCardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-bold leading-none tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70",
        className
      )}
      {...props}
    />
  )
);
GameCardTitle.displayName = "GameCardTitle";

const GameCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
GameCardContent.displayName = "GameCardContent";

export { GameCard, GameCardHeader, GameCardTitle, GameCardContent };
