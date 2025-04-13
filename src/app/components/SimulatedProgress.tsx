"use client";

import type React from "react";

import { useState, useEffect } from "react";

// Define the steps - Emoji is now just part of the message
const simulationSteps = [
  "🤔 Analyzing title genre...",
  "📚 Fetching style patterns...",
  "✍️ Drafting initial script...",
  "🧐 Evaluating script quality...",
  "💡 Analyzing feedback...",
  "🔧 Revising script...",
  "🧐 Re-evaluating script...",
  "✨ Finalizing script...",
  "🎉 Almost ready...",
];

// How long to display each step message (in milliseconds)
const STEP_DURATION_MS = 3000; // 3 seconds per step

interface SimulatedProgressProps {
  isLoading: boolean;
}

// Helper function to extract the leading emoji (or return a default)
const extractLeadingEmoji = (text: string): string => {
  const emojiMatch = text.match(
    /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+/u
  );
  return emojiMatch ? emojiMatch[0] : "⏳";
};

export const SimulatedProgress: React.FC<SimulatedProgressProps> = ({
  isLoading,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isLoading) {
      setCurrentStepIndex(0); // Reset to first step when loading starts
      intervalId = setInterval(() => {
        setCurrentStepIndex(
          (prevIndex) => (prevIndex + 1) % simulationSteps.length
        );
      }, STEP_DURATION_MS);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  if (!isLoading) {
    return null;
  }

  const currentMessage = simulationSteps[currentStepIndex];
  const displayEmoji = extractLeadingEmoji(currentMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-500">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transition-all duration-500"
        style={{
          animation: "fadeInScale 0.5s ease-out forwards",
          opacity: 0,
          transform: "scale(0.9)",
        }}
      >
        <style jsx>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes floatEmoji {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
            100% {
              transform: translateY(0px);
            }
          }

          @keyframes fadeInMessage {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .emoji-float {
            animation: floatEmoji 3s ease-in-out infinite;
          }

          .message-fade {
            animation: fadeInMessage 0.5s ease-out forwards;
          }
        `}</style>

        <div className="flex flex-col items-center">
          {/* Emoji with float effect */}
          <div className="relative mb-6 text-6xl emoji-float">
            <span>{displayEmoji}</span>
          </div>

          {/* Message with fade effect */}
          <div className="min-h-[3rem] text-center message-fade">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
              {currentMessage}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full mt-8 mb-4">
            <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                style={{
                  width: `${
                    ((currentStepIndex + 1) / simulationSteps.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span
              className="h-2 w-2 rounded-full bg-teal-500"
              style={{ animation: "pulse 1.5s ease-in-out 0s infinite" }}
            ></span>
            <span
              className="h-2 w-2 rounded-full bg-teal-500"
              style={{ animation: "pulse 1.5s ease-in-out 0.2s infinite" }}
            ></span>
            <span
              className="h-2 w-2 rounded-full bg-teal-500"
              style={{ animation: "pulse 1.5s ease-in-out 0.4s infinite" }}
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
};
