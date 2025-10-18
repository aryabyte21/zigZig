"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RecruiterMatchCard } from "./recruiter-match-card";
import { Button } from "@/components/ui/button";
import { X, Heart, Star, Sparkles } from "lucide-react";
import { CandidateMatch } from "@/types/recruiter";
import { toast } from "sonner";

interface RecruiterCardStackProps {
  matches: CandidateMatch[];
  onSwipe: (matchId: string, direction: "left" | "right" | "up") => Promise<void>;
  isLoading?: boolean;
}

export function RecruiterCardStack({ matches, onSwipe, isLoading }: RecruiterCardStackProps) {
  const [direction, setDirection] = useState<"left" | "right" | "up" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Always show the first card (index 0) since swiped cards are removed from the array
  const currentMatch = matches[0];
  const nextMatches = matches.slice(1, 3);

  const handleSwipe = async (swipeDirection: "left" | "right" | "up") => {
    if (!currentMatch || isLoading || isAnimating) return;

    setDirection(swipeDirection);
    setIsAnimating(true);

    // Call the onSwipe handler
    try {
      await onSwipe(currentMatch._id, swipeDirection);
      
      // Show toast
      if (swipeDirection === "left") {
        toast.info("Passed on candidate");
      } else if (swipeDirection === "right") {
        toast.success("Liked candidate!");
      } else if (swipeDirection === "up") {
        toast.success("⭐ Super liked candidate!", {
          icon: <Star className="text-yellow-500" />,
        });
      }

      // Reset animation state after transition
      setTimeout(() => {
        setDirection(null);
        setIsAnimating(false);
      }, 300);
    } catch (error) {
      console.error("Swipe error:", error);
      toast.error("Failed to record decision");
      setDirection(null);
      setIsAnimating(false);
    }
  };

  // Empty state
  if (!currentMatch && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <Sparkles className="h-24 w-24 text-muted-foreground relative z-10" />
        </div>
        <h3 className="text-2xl font-bold">No more candidates</h3>
        <p className="text-muted-foreground max-w-md">
          You've reviewed all matching candidates for this job posting.
          Check your liked candidates or create a new job posting.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Card Stack */}
      <div className="relative w-[480px] h-[720px] mb-8">
        {/* Next cards (stacked behind) - non-interactive preview */}
        {nextMatches.map((match, index) => (
          <div
            key={match._id}
            className="absolute top-0 left-0 w-full pointer-events-none select-none"
            style={{
              transform: `scale(${1 - (index + 1) * 0.05}) translateY(${(index + 1) * 10}px)`,
              zIndex: nextMatches.length - index,
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <div className="pointer-events-none">
              <RecruiterMatchCard
                match={match}
                onSwipe={() => {}}
              />
            </div>
          </div>
        ))}

        {/* Current card - interactive and on top */}
        <AnimatePresence mode="wait">
          {currentMatch && (
            <motion.div
              key={currentMatch._id}
              initial={{ scale: 1, opacity: 1 }}
              exit={{
                x: direction === "left" ? -500 : direction === "right" ? 500 : 0,
                y: direction === "up" ? -500 : 0,
                opacity: 0,
                scale: 0.8,
                rotate: direction === "left" ? -30 : direction === "right" ? 30 : 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="relative"
              style={{
                zIndex: 1000,
              }}
            >
              <RecruiterMatchCard
                match={currentMatch}
                onSwipe={handleSwipe}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6">
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          onClick={() => handleSwipe("left")}
          disabled={isLoading || !currentMatch}
        >
          <X className="h-8 w-8" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
          onClick={() => handleSwipe("up")}
          disabled={isLoading || !currentMatch}
        >
          <Star className="h-6 w-6" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
          onClick={() => handleSwipe("right")}
          disabled={isLoading || !currentMatch}
        >
          <Heart className="h-8 w-8" />
        </Button>
      </div>

      {/* Progress */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          {matches.length} candidate{matches.length !== 1 ? 's' : ''} remaining
        </p>
      </div>
    </div>
  );
}


