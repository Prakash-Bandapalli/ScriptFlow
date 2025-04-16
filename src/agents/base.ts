import {
  GoogleGenerativeAI,
  Content,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
  SafetySetting, // Import SafetySetting type
} from "@google/generative-ai";

import { AgentConfig } from "@/types/index";
import { createGeminiClient } from "../utils/gemini";

type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Define safer default safety settings
const defaultSafetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE, // Or BLOCK_ONLY_HIGH if needed
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export abstract class Agent {
  protected genAI: GoogleGenerativeAI;
  protected modelName: string = "gemini-2.0-flash";
  constructor(config?: AgentConfig) {
    this.genAI = createGeminiClient(config?.apiKey);
  }

  protected async generateCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    temperature: number = 0.7,
    maxTokens: number = 4096,
    maxRetries: number = 3
  ): Promise<string> {
    let retries = 0;

    // --- Simplified Mapping: Convert directly to Gemini format ---
    const history: GeminiMessage[] = [];
    let systemPromptContent: string | null = null;

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPromptContent = msg.content;
      } else if (msg.role === "user") {
        if (systemPromptContent && history.length === 0) {
          console.warn(
            "System message detected but not explicitly handled in Gemini mapping. Ensure user prompt includes necessary instructions."
          );
        }
        history.push({ role: "user", parts: [{ text: msg.content }] });
        systemPromptContent = null; // Consume/reset after first user message
      } else if (msg.role === "assistant") {
        history.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }

    // Basic check after mapping
    if (history.length === 0) {
      // This might happen if only a system message was passed and wasn't mapped
      if (systemPromptContent) {
        console.warn(
          "Only a system message was provided. Mapping as initial user prompt."
        );
        history.push({ role: "user", parts: [{ text: systemPromptContent }] });
      } else {
        throw new Error(
          "Cannot generate completion with empty message history after mapping."
        );
      }
    }
    // --- End Simplified Mapping ---

    // --- Retry Loop ---
    while (retries <= maxRetries) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.modelName,
          // Pass safety settings explicitly
          safetySettings: defaultSafetySettings,
        });

        const generationConfig = {
          temperature: temperature,
          maxOutputTokens: maxTokens,
        };

        // --- Make the API Call ---
        const result: GenerateContentResult = await model.generateContent({
          contents: history,
          generationConfig: generationConfig,
          // Safety settings can also be passed directly here, overriding model-level if needed
          safetySettings: defaultSafetySettings,
        });
        // -------------------------

        const response = result.response;

        // --- Process Response (Error checks remain the same as your provided code) ---
        // 1. Check for blocked prompt or missing response/candidates
        if (
          !response ||
          !response.candidates ||
          response.candidates.length === 0
        ) {
          const blockReason = response?.promptFeedback?.blockReason;
          const safetyRatings = response?.promptFeedback?.safetyRatings;
          if (blockReason) {
            console.error(
              `Gemini API request blocked due to Prompt Feedback: ${blockReason}`,
              safetyRatings ? JSON.stringify(safetyRatings) : ""
            );
            throw new Error(
              `Request blocked by safety filters: ${blockReason}`
            );
          } else {
            console.error(
              "Gemini API Error: No response or candidates returned.",
              response // Log the full response structure
            );
            throw new Error(
              "Failed to generate completion: No response candidates."
            );
          }
        }
        // 2. Check the candidate itself (remains same)
        const candidate = response.candidates[0];
        if (!candidate) {
          console.error(
            "Gemini API Error: Candidate object is missing.",
            response
          );
          throw new Error(
            "Failed to generate completion: Candidate object missing."
          );
        }
        // 3. Check finish reason (remains same)
        if (candidate.finishReason && candidate.finishReason !== "STOP") {
          console.warn(
            `Gemini generation finished reason: ${candidate.finishReason}`,
            candidate.safetyRatings
          );
          if (candidate.finishReason === "SAFETY") {
            throw new Error(
              `Generation stopped due to safety concerns: ${JSON.stringify(
                candidate.safetyRatings
              )}`
            );
          }
          if (candidate.finishReason === "MAX_TOKENS") {
            console.warn(
              "Generation stopped due to MAX_TOKENS. Content might be incomplete."
            );
            // } else if (candidate.finishReason !== "STOP") {
            //   // Handle other reasons like RECITATION, OTHER
            //   throw new Error(
            //     `Generation failed with finish reason: ${candidate.finishReason}`
            //   );
          }
        }
        // 4. Ensure content and parts exist (remains same, ensure text check)
        if (
          !candidate.content ||
          !candidate.content.parts ||
          candidate.content.parts.length === 0 ||
          typeof candidate.content.parts[0].text !== "string"
        ) {
          // Added type check for text
          console.error(
            "Gemini API Error: Candidate content or text part missing or invalid.",
            candidate
          );
          throw new Error(
            "Failed to generate completion: Empty or invalid content/text part in response."
          );
        }
        // --- Success: Extract and return text ---
        const generatedText = candidate.content.parts[0].text;
        return generatedText; // Exit loop
        // ---------------------------------------
      } catch (error: any) {
        // --- Error Handling with Retry Logic (remains the same) ---
        const isRateLimitError =
          error.message?.includes("429") ||
          error.message?.includes("rate limit"); // Broader check

        if (isRateLimitError && retries < maxRetries) {
          retries++;
          let delayMs = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          console.warn(
            `Rate limit hit. Retrying attempt ${retries}/${maxRetries} after ${Math.round(
              delayMs / 1000
            )}s...`
          );
          await wait(delayMs);
          continue;
        } else {
          if (isRateLimitError) {
            console.error(
              `Rate limit error persisted after ${maxRetries} retries.`
            );
          }
          if (error.response) {
            console.error(
              "Gemini API Response Error Status:",
              error.response.status
            );
            console.error(
              "Gemini API Response Error Data:",
              error.response.data
            );
          } else if (error.request) {
            console.error("Gemini API Request Error:", error.request);
          } else {
            console.error("Gemini API Error:", error.message);
          }
          console.error(
            "Failed messages payload (Gemini Format):",
            JSON.stringify(history)
          ); // Log Gemini format
          throw new Error(
            `Failed to generate completion using Gemini API after ${retries} retries: ${error.message}`
          );
        }
        // --------------------------------------
      }
    } // End while loop

    throw new Error(
      "Exited generation loop unexpectedly after maximum retries."
    );
  }
}
