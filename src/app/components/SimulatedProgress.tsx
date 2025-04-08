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
  // Basic check for common emoji patterns at the start
  // This regex tries to match typical emoji characters at the beginning of the string.
  // Note: Unicode emoji matching can be complex; this is a simplification.
  const emojiMatch = text.match(
    /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+/u
  );
  return emojiMatch ? emojiMatch[0] : "⏳"; // Return matched emoji or a default hourglass
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
  const displayEmoji = extractLeadingEmoji(currentMessage); // Extract emoji for large display

  return (
    // Full screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/70 via-slate-800/80 to-slate-900/70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out">
      {/* Content container */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center max-w-md w-full transform transition-all duration-300 ease-out scale-100">
        {/* Emoji Area - Uses extracted emoji */}
        <div className="text-6xl md:text-7xl mb-6 animate-pulse">
          {displayEmoji}
        </div>

        {/* Status Message - Displays the full message including the emoji */}
        <p className="text-lg md:text-xl font-semibold text-slate-700 mb-8 min-h-[2.5em]">
          {currentMessage}
        </p>

        {/* Animated dots */}
        <div className="flex justify-center items-center space-x-1">
          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
};
