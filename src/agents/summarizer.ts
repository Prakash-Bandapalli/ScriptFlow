import { Agent } from "./base";

export class SummarizerAgent extends Agent {
  async summarizeFeedback(feedback: string): Promise<string> {
    try {
      const prompt = `
            You are a feedback summarizer. Your task is to extract key points from the feedback and provide actionable suggestions for improvement.
    
            Feedback to summarize:
            ${feedback}
    
            Format your response like this:
            - Key Points: [list of key points]
            - Actionable Suggestions: [list of actionable suggestions]
          `;

      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        {
          role: "system",
          content:
            "You are a feedback summarizer. Extract key points and provide actionable suggestions.",
        },
        { role: "user", content: prompt },
      ];

      const result = await this.generateCompletion(messages);
      return result;
    } catch (error) {
      console.error("Summarization Error:", error);
      throw new Error("Failed to summarize feedback");
    }
  }

  async summarizeScripts(scripts: string[]): Promise<string> {
    try {
      const prompt = `
            You are a script summarizer. Your task is to analyze previous scripts and identify patterns or successful elements.
    
            Scripts to summarize:
            ${scripts.join("\n\n")}
    
            Format your response like this:
            - Patterns: [list of patterns, e.g., weak hooks, strong CTAs]
            - Successful Elements: [list of successful elements, e.g., surprising facts, effective pacing]
          `;

      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        {
          role: "system",
          content:
            "You are a script summarizer. Analyze scripts and identify patterns or successful elements.",
        },
        { role: "user", content: prompt },
      ];

      const result = await this.generateCompletion(messages);
      return result;
    } catch (error) {
      console.error("Summarization Error:", error);
      throw new Error("Failed to summarize scripts");
    }
  }
}
