import { OpenAI } from "openai";

export const createOpenAIClient = (apiKey?: string): OpenAI => {
  return new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });
};
