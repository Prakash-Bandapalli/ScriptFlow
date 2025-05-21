import { Agent } from "./base";

export class SummarizerAgent extends Agent {
  async summarizeFeedback(feedback: string): Promise<string> {
    try {
      const prompt = `
You are a feedback summarizer. Your task is to extract the absolute key critical points from the feedback and provide concise, actionable suggestions for improvement based *only* on the provided feedback text. Be direct and focus on what *must* change.

Feedback to summarize:
        ${feedback}

        Format your response EXACTLY like this:
        - Key Issues: [Bulleted list of 1-3 core problems mentioned in the feedback]
        - Actionable Suggestions: [Bulleted list of 1-3 specific actions to take based *directly* on the Key Issues]
      `;

      const messages: Array<{
        role: "user";
        content: string;
      }> = [{ role: "user", content: prompt }];

      const result = await this.generateCompletion(messages, 0.5, 300);
      return result;
    } catch (error) {
      console.error("Feedback Summarization Error:", error);
      throw new Error("Failed to summarize feedback");
    }
  }
}
