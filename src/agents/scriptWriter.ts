import { Agent } from "./base";

export class ScriptWriterAgent extends Agent {
  async generateScript(
    title: string,
    data: string = "",
    duration: "short" | "long",
    summarizedFeedback?: string,
    summarizedScripts?: string
  ): Promise<string> {
    try {
      const prompt = `
          You are a YouTube scriptwriter. Your task is to create a highly engaging script that scores at least 8/10 on the Validator Agent's evaluation.
  
          Here are the guidelines for writing a high-quality script:
          1. **Hook**: Start with a surprising fact, question, or statement to grab attention in the first 3 seconds.
          2. **Value**: Deliver unique, actionable, and surprising insights that viewers can't find elsewhere.
          3. **Retention**: Use pattern interrupts (e.g., visuals, jokes, or questions) every 30 seconds to maintain curiosity.
          4. **CTA**: End with a compelling and natural call-to-action that encourages engagement.
  
          ${
            summarizedFeedback
              ? `Here is the summarized feedback: ${summarizedFeedback}`
              : ""
          }
          ${
            summarizedScripts
              ? `Here is the summary of previous scripts: ${summarizedScripts}`
              : ""
          }
  
          Title: ${title}
          Duration: ${duration}
          Data: ${data}
  
          Generate a script that follows the guidelines and incorporates the feedback and insights from previous scripts.
        `;

      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        {
          role: "system",
          content:
            "You are a YouTube scriptwriter. Follow the guidelines strictly and incorporate feedback to improve the script.",
        },
        { role: "user", content: prompt },
      ];

      const result = await this.generateCompletion(messages);
      return result;
    } catch (error) {
      console.error("Script Generation Error:", error);
      throw new Error("Failed to generate script");
    }
  }
}
