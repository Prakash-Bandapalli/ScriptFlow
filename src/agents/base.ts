import { OpenAI } from "openai";

import { AgentConfig } from "@/types/index";
import { createOpenAIClient } from "../utils/openai";

export abstract class Agent {
  protected openai: OpenAI;

  constructor(config?: AgentConfig) {
    this.openai = createOpenAIClient(config?.apiKey);
  }

  protected async generateCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    temperature: number = 0.7,
    maxTokens: number = 2048
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error("Failed to generate completion");
    }
  }
}
