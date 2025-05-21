import { Agent } from "./base";
import { AgentConfig } from "@/types";

// Define the strict list of genres you have patterns for
const PREDEFINED_GENRES = [
  "history",
  "news",
  "sports",
  "selfimprovement",
  "language",
  "personalcare",
  "vlog",
  "moviereview",
  "review",
  "programming",
  "education",
  "fitness",
  "cooking",
  "finance",
];
const NOT_FOUND_MESSAGE = "genre is not found try something else";

export class GenreClassifierAgent extends Agent {
  // --- Constructor to Override Model Name ---
  constructor(config?: AgentConfig) {
    super(config);
    // Override the model specifically for this agent
    this.modelName = "gemini-2.0-flash";
    console.log(
      `GenreClassifierAgent initialized with model: ${this.modelName}`
    );
  }
  // --- End Constructor ---

  /**
   * Classifies the genre of a video based on its title.
   * @param title The title of the video.
   * @returns The detected genre (from PREDEFINED_GENRES) or a specific "not found" message.
   */
  async classifyGenre(title: string): Promise<string> {
    try {
      const prompt = `
        You are a highly accurate content classifier. Your task is to determine the single best genre for the following video title from the predefined list below.

        Predefined Genres:
        ${PREDEFINED_GENRES.map((g) => `- ${g}`).join("\n")}

        Video Title: "${title}"

        Instructions:
        1. Analyze the title carefully.
        2. Choose the *one* genre from the Predefined Genres list that best fits the title.
        3. If the title clearly fits one of the predefined genres, output *only* the genre name exactly as it appears in the list (case-sensitive).
        4. If the title does *not* clearly fit any of the predefined genres, output the exact phrase: "${NOT_FOUND_MESSAGE}"
        5. Do NOT add any explanations, introductions, or extra text. Only output the chosen genre or the "not found" phrase.
      `;

      const messages: Array<{ role: "user"; content: string }> = [
        { role: "user", content: prompt },
      ];

      // Use lower temperature for more deterministic classification
      const result = await this.generateCompletion(
        messages,
        0.3, // Lower temperature
        50 // Max tokens needed is small
      );

      console.log("RAW LLM Output for Genre:", JSON.stringify(result)); // Keep for debugging if needed

      // --- Robust Post-processing ---
      let processedResult = result.trim().toLowerCase();
      if (processedResult.endsWith(".") || processedResult.endsWith(",")) {
        processedResult = processedResult.slice(0, -1);
      }
      console.log("Processed LLM Output:", JSON.stringify(processedResult));
      // --- End Robust Post-processing ---

      if (PREDEFINED_GENRES.includes(processedResult)) {
        const matchedGenre = PREDEFINED_GENRES.find(
          (g) => g === processedResult
        );
        return matchedGenre || NOT_FOUND_MESSAGE;
      } else if (processedResult === NOT_FOUND_MESSAGE.toLowerCase()) {
        return NOT_FOUND_MESSAGE;
      } else {
        console.warn(
          `GenreClassifierAgent returned unexpected output after processing: "${processedResult}". Defaulting to not found.`
        );
        return NOT_FOUND_MESSAGE;
      }
    } catch (error) {
      console.error("Genre Classification Error:", error);
      // Return the 'not found' message as a safe fallback on error
      return NOT_FOUND_MESSAGE;
    }
  }
}
