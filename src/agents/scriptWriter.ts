import { AgentConfig } from "@/types";
import { Agent } from "./base";

export class ScriptWriterAgent extends Agent {
  constructor(config?: AgentConfig) {
    super(config); // Call the base class constructor
    // Override the model specifically for this agent
    this.modelName = "gemini-2.0-flash"; // Or "gemini-1.5-pro-latest"
    console.log(
      `GenreClassifierAgent initialized with model: ${this.modelName}`
    ); // Optional log
  }
  async generateScript(
    title: string,
    data: string = "",
    duration: "short" | "long",
    summarizedFeedback?: string,
    previousScript?: string, // Changed from summarizedScripts
    genrePattern?: string // <-- Add genrePattern parameter
  ): Promise<string> {
    try {
      // Construct the prompt conditionally based on whether it's a revision
      let promptContext = "";
      if (previousScript && summarizedFeedback) {
        promptContext = `
You are revising a previous script based on feedback.
Here is the summarized feedback highlighting the key issues and suggestions:
${summarizedFeedback}

Here is the previous script attempt that needs improvement:
--- PREVIOUS SCRIPT START ---
${previousScript}
--- PREVIOUS SCRIPT END ---

Your task is to rewrite the script, strictly addressing the feedback points while adhering to the original guidelines, the target score (8/10), and the provided genre pattern (if any). Focus on fixing the identified weaknesses. Retain the title, duration, and core data/topic.
`;
      } else {
        promptContext = `
You are a YouTube scriptwriter. Your task is to create a *new*, highly engaging script from scratch that scores at least 8/10 on the Validator Agent's evaluation. Adhere strictly to the provided genre pattern if one is given.
`;
      }

      // Construct the main prompt including the genre pattern if available
      const prompt = `
${promptContext}

Here are the general guidelines for writing a high-quality script (apply these rigorously):
1. *Hook*: Start with a surprising fact, question, or statement to grab attention in the first 3 seconds. Make it extremely compelling.
2. *Value*: Deliver unique, actionable, and surprising insights. Answer the viewer's implicit question: "What's in it for me?".
3. *Retention*: Use pattern interrupts (e.g., visuals cues, tone shifts, questions, quick cuts - describe these in the script like [Visual: B-roll of X]) frequently (every ~15-30 seconds for short, ~30-60 seconds for long) to maintain curiosity. Keep the energy high.
4. *CTA*: End with a compelling and natural call-to-action that encourages specific engagement (like, comment with X, subscribe for Y). Avoid generic CTAs.

Title: ${title}
Duration: ${duration} ${
        duration === "short" ? "(under 60 seconds)" : "(typically 5-15 minutes)"
      }
${data ? `Core Data/Topic Information: ${data}` : ""}

${
  genrePattern // <-- Conditionally add the genre pattern instructions
    ? `IMPORTANT GENRE PATTERN: You MUST adhere closely to the following stylistic guidelines and structural patterns for this genre:\n---\n${genrePattern}\n---`
    : "" // If no pattern, add nothing extra
}

Generate the script now. ${
        previousScript
          ? "Focus on the revision based on the feedback and genre pattern."
          : "Create the initial version adhering to the genre pattern."
      } Ensure the script format is clear (e.g., use SPEAKER names or scene descriptions).
    `;

      const messages: Array<{
        role: "user"; // Only user role needed for Gemini with prompt structured like this
        content: string;
      }> = [{ role: "user", content: prompt }];

      // Potentially adjust temperature based on whether it's revision or creation
      const temperature = previousScript ? 0.6 : 0.75;

      const result = await this.generateCompletion(messages, temperature);
      return result;
    } catch (error) {
      console.error("Script Generation Error:", error);
      throw new Error("Failed to generate script"); // Let manager handle detailed error
    }
  }
}
