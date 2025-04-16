import { GoogleGenerativeAI } from "@google/generative-ai";

export const createGeminiClient = (apiKey?: string): GoogleGenerativeAI => {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!key) {
    throw new Error(
      "Google API Key not found. Please set GOOGLE_API_KEY environment variable."
    );
  }
  return new GoogleGenerativeAI(key);
};
