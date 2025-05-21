// agents/scriptwriter.ts
import { AgentConfig } from "@/types";
import { Agent } from "./base";

export class ScriptWriterAgent extends Agent {
  constructor(config?: AgentConfig) {
    super(config); // Call the base class constructor
    // Override the model specifically for this agent
    this.modelName = "gemini-2.0-flash"; // Or "gemini-1.5-pro-latest"
    // console.log( // You can uncomment this if you want to confirm model in logs
    //   `ScriptWriterAgent initialized with model: ${this.modelName}`
    // );
  }

  async generateScript(
    title: string,
    data: string = "",
    duration: "short" | "long",
    summarizedFeedback?: string,
    previousScript?: string,
    genrePattern?: string
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
3. *Retention*: Use pattern interrupts (e.g., tone shifts, questions) frequently (every ~15-30 seconds for short, ~30-60 seconds for long) to maintain curiosity. Keep the energy high.
4. *CTA*: End with a compelling and natural call-to-action that encourages specific engagement (like, comment with X, subscribe for Y). Avoid generic CTAs.

Title: ${title}
Duration: ${duration} ${
        duration === "short" ? "(under 60 seconds)" : "(typically 5-15 minutes)"
      }
${data ? `Core Data/Topic Information: ${data}` : ""}

${
  genrePattern
    ? `IMPORTANT GENRE PATTERN AND REFERENCE: You MUST observe analysis and patterns provided for this genre:\n---\n${genrePattern}\n--- and only take it as reference`
    : ""
}

IMPORTANT INSTRUCTIONS FOR SCRIPT CONTENT:
- Focus *only* on the spoken words (dialogue, narration).
- Do NOT include any visual cues, camera directions, sound effect descriptions, scene descriptions, or parenthetical emotional/tone instructions for the speaker (e.g., do not write things like "[Visual: ...]", "[Sound: ...]", "(Energetic tone)", "NARRATOR: (excitedly)").
- If there are distinct speakers, you can denote them (e.g., "NARRATOR:", "HOST:", "INTERVIEWEE:").
- Ensure the output is clean, containing only the text that would be spoken.

Generate the script now. ${
        previousScript
          ? "Focus on the revision based on the feedback and genre pattern."
          : "Create the initial version adhering to the genre pattern."
      } Ensure the script format is clear.
    `;

      const messages: Array<{
        role: "user";
        content: string;
      }> = [{ role: "user", content: prompt }];

      // Potentially adjust temperature based on whether it's revision or creation
      const temperature = previousScript ? 0.6 : 0.75;
      // Consider if maxTokens needs adjustment, but for script writing, the default 4096 might be okay
      // If scripts are consistently too short or too long, or if you face timeouts here,
      // you might experiment with this value for ScriptWriterAgent specifically.
      // For now, we'll use the default from the base Agent class.
      const result = await this.generateCompletion(messages, temperature);

      return result;
    } catch (error) {
      console.error("Script Generation Error:", error);
      throw new Error("Failed to generate script"); // Let manager handle detailed error
    }
  }
}
