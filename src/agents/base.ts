// import { OpenAI } from "openai";

// import { AgentConfig } from "@/types/index";
// import { createOpenAIClient } from "../utils/openai";

// export abstract class Agent {
//   protected openai: OpenAI;

//   constructor(config?: AgentConfig) {
//     this.openai = createOpenAIClient(config?.apiKey);
//   }

//   protected async generateCompletion(
//     messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
//     temperature: number = 0.7,
//     maxTokens: number = 2048
//   ): Promise<string> {
//     try {
//       const response = await this.openai.chat.completions.create({
//         model: "gpt-3.5-turbo",
//         messages,
//         temperature,
//         max_tokens: maxTokens,
//       });
//       return response.choices[0].message.content || "";
//     } catch (error) {
//       console.error("OpenAI API Error:", error);
//       throw new Error("Failed to generate completion");
//     }
//   }
// }

// import {
//   GoogleGenerativeAI,
//   Content,
//   HarmCategory,
//   HarmBlockThreshold,
//   GenerateContentResult, // Import this type
// } from "@google/generative-ai";

// import { AgentConfig } from "@/types/index";
// import { createGeminiClient } from "../utils/gemini"; // Update import path

// const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// // Define a type for the message structure Gemini expects
// type GeminiMessage = {
//   role: "user" | "model"; // Gemini uses 'model' for assistant responses
//   parts: { text: string }[];
// };

// export abstract class Agent {
//   protected genAI: GoogleGenerativeAI; // Rename and change type
//   protected modelName: string = "gemini-1.5-flash-latest"; // Specify the Gemini

//   constructor(config?: AgentConfig) {
//     // Use the new client creation function
//     this.genAI = createGeminiClient(config?.apiKey);
//   }

//   // Updated method to use Gemini API
//   protected async generateCompletion(
//     messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
//     temperature: number = 0.7,
//     maxTokens: number = 2048 // Note: Gemini uses maxOutputTokens
//   ): Promise<string> {
//     try {
//       const model = this.genAI.getGenerativeModel({
//         model: this.modelName,
//         // Optional: Adjust safety settings if needed
//         // safetySettings: [
//         //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//         //   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//         // ],
//       });

//       // --- Map OpenAI message format to Gemini format ---
//       let systemInstruction: string | undefined = undefined;
//       const history: GeminiMessage[] = [];

//       for (const msg of messages) {
//         if (msg.role === "system" && !systemInstruction) {
//           // Capture the first system message as system instruction
//           // Note: Gemini works best with system instructions set at the model level or as the very first part of the prompt.
//           // We will prepend it to the first user message if the model doesn't directly support systemInstruction in this way,
//           // or handle it based on specific model capabilities if needed later. For gemini-pro, prepending is safer.
//           systemInstruction = msg.content;
//         } else if (msg.role === "user") {
//           let userContent = msg.content;
//           // If this is the first user message and we have a system instruction, prepend it.
//           if (history.length === 0 && systemInstruction) {
//             userContent = `${systemInstruction}\n\n---\n\n${msg.content}`;
//             systemInstruction = undefined; // Consume it
//           }
//           history.push({ role: "user", parts: [{ text: userContent }] });
//         } else if (msg.role === "assistant") {
//           history.push({ role: "model", parts: [{ text: msg.content }] });
//         }
//       }
//       // --- End Mapping ---

//       // Check if history is empty (should not happen with valid input)
//       if (history.length === 0) {
//         throw new Error(
//           "Cannot generate completion with empty message history."
//         );
//       }

//       // Adjust generation config for Gemini
//       const generationConfig = {
//         temperature: temperature,
//         maxOutputTokens: maxTokens,
//       };

//       console.log(
//         "Sending to Gemini:",
//         JSON.stringify({ history, generationConfig }, null, 2)
//       ); // Debug log

//       // Use generateContent for potentially multi-turn context
//       const result: GenerateContentResult = await model.generateContent({
//         contents: history,
//         generationConfig: generationConfig,
//       });

//       const response = result.response;

//       console.log("Received from Gemini:", JSON.stringify(response, null, 2)); // Debug log

//       // --- Extract text ---
//       // Check for blocked responses
//       if (
//         !response ||
//         !response.candidates ||
//         response.candidates.length === 0
//       ) {
//         // Check for promptFeedback block reason
//         const blockReason = response?.promptFeedback?.blockReason;
//         if (blockReason) {
//           console.error(`Gemini API request blocked due to: ${blockReason}`);
//           throw new Error(`Request blocked by safety filters: ${blockReason}`);
//         } else {
//           console.error("Gemini API Error: No candidates returned.", response);
//           throw new Error(
//             "Failed to generate completion: No response candidates."
//           );
//         }
//       }

//       // Check if the candidate itself was blocked
//       const candidate = response.candidates[0];
//       if (candidate.finishReason && candidate.finishReason !== "STOP") {
//         console.warn(
//           `Gemini generation finished unexpectedly: ${candidate.finishReason}`,
//           candidate.safetyRatings
//         );
//         // Optionally throw error or return partial content if available
//       }

//       // Ensure content and parts exist
//       if (
//         !candidate.content ||
//         !candidate.content.parts ||
//         candidate.content.parts.length === 0
//       ) {
//         console.error(
//           "Gemini API Error: Candidate content or parts missing.",
//           candidate
//         );
//         throw new Error(
//           "Failed to generate completion: Empty content in response."
//         );
//       }

//       // Extract text (assuming a single text part)
//       const generatedText = candidate.content.parts[0].text;
//       // --- End Extract text ---

//       return generatedText || ""; // Return empty string if text is somehow undefined/null
//     } catch (error: any) {
//       // Log more specific Gemini errors if available
//       if (error.response) {
//         console.error("Gemini API Response Error:", error.response.data);
//       } else if (error.request) {
//         console.error("Gemini API Request Error:", error.request);
//       } else {
//         console.error("Gemini API Error:", error.message);
//       }
//       // Include the original messages in the error for easier debugging
//       console.error("Failed messages:", JSON.stringify(messages));
//       throw new Error(
//         `Failed to generate completion using Gemini API: ${error.message}`
//       );
//     }
//   }
// }

// src/agents/base.ts

// src/agents/base.ts

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
  // Use a stable model unless you specifically need experimental features
  // gemini-2.5-pro-exp-03-25
  protected modelName: string = "gemini-2.0-flash"; // CHANGED to stable Flash
  constructor(config?: AgentConfig) {
    this.genAI = createGeminiClient(config?.apiKey);
  }

  protected async generateCompletion(
    // Input messages still use OpenAI format for consistency within the app
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    temperature: number = 0.7,
    maxTokens: number = 4096,
    maxRetries: number = 3
  ): Promise<string> {
    let retries = 0;

    // --- Simplified Mapping: Convert directly to Gemini format ---
    const history: GeminiMessage[] = [];
    let systemPromptContent: string | null = null; // Store potential system prompt

    for (const msg of messages) {
      if (msg.role === "system") {
        // Capture the *last* system message encountered as the potential instruction
        // (or handle multiple system messages if your design requires it)
        systemPromptContent = msg.content;
      } else if (msg.role === "user") {
        // Prepend system prompt ONLY IF it hasn't been implicitly included
        // For now, we assume Agents structure their user prompts fully.
        // If a system prompt exists, log a warning for now.
        if (systemPromptContent && history.length === 0) {
          console.warn(
            "System message detected but not explicitly handled in Gemini mapping. Ensure user prompt includes necessary instructions."
          );
          // Optionally, decide on a consistent strategy: prepend, ignore, or use dedicated field if model supports it.
          // Prepending here would replicate the old flawed logic. Best to ensure Agents construct full user prompts.
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

        // console.log(`Attempt ${retries + 1} Sending to Gemini:`, JSON.stringify({ history, generationConfig, safetySettings: defaultSafetySettings }, null, 2));

        // --- Make the API Call ---
        const result: GenerateContentResult = await model.generateContent({
          contents: history,
          generationConfig: generationConfig,
          // Safety settings can also be passed directly here, overriding model-level if needed
          safetySettings: defaultSafetySettings,
        });
        // -------------------------

        const response = result.response;

        // console.log(`Attempt ${retries + 1} Received from Gemini:`, JSON.stringify(response, null, 2));

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
          } else if (candidate.finishReason !== "STOP") {
            // Handle other reasons like RECITATION, OTHER
            throw new Error(
              `Generation failed with finish reason: ${candidate.finishReason}`
            );
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
