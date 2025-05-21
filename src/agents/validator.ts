import { ValidationResult } from "@/types/index";
import { Agent } from "./base";

export class ValidatorAgent extends Agent {
  async validateScript(
    script: string,
    duration: "short" | "long"
  ): Promise<ValidationResult> {
    try {
      const prompt = `
          You are the harshest YouTube script critic who absolutely hates boring content. Your job is to strictly evaluate scripts and maintain the highest standards.

          Evaluate this ${duration}-form script on these critical parameters:
          1. Hook Impact (0-2.5 points)
             - Does it grab attention in first 3 seconds?
             - Does it create immediate curiosity?
             - Would it stop someone from scrolling?

          2. Value Delivery (0-2.5 points)
             - Does it deliver actionable insights?
             - Is the information unique/surprising?
             - Will viewers learn something new?

          3. Retention Elements (0-2.5 points)
             - Are there effective pattern interrupts?
             - Does it maintain curiosity throughout?
             - Is pacing optimal for ${duration} format?

          4. Call-to-Action Power (0-2.5 points)
             - Is the CTA compelling and natural?
             - Does it encourage engagement?
             - Will it drive actual actions?

          FORMAT YOUR RESPONSE EXACTLY LIKE THIS (No extra text before or after):
          SCORE_HOOK: [0-2.5]
          SCORE_VALUE: [0-2.5]
          SCORE_RETENTION: [0-2.5]
          SCORE_CTA: [0-2.5]
          TOTAL: [0-10]
          VERDICT: [one sentence - why this score]

          Script to evaluate:
          ${script}
        `;

      const messages: Array<{
        role: "user";
        content: string;
      }> = [{ role: "user", content: prompt }];

      const result = await this.generateCompletion(messages, 0.4, 250);

      const scoreRegex = (label: string) =>
        new RegExp(`${label}:\\s*\\[\\s*([\\d.]+)\\s*\\]`);

      const extractScore = (label: string): number => {
        const match = result.match(scoreRegex(label));
        if (match && match[1]) {
          const score = parseFloat(match[1]);
          if (!isNaN(score)) {
            return score;
          } else {
            console.error(
              `Validator Error: Failed to parse float from matched value "${match[1]}" for ${label}`
            );
            return 0;
          }
        } else {
          console.error(
            `Validator Error: Regex failed to match label "${label}" in result.`
          );

          const contextIndex = result.indexOf(label);
          if (contextIndex !== -1) {
            console.error(
              `Context: "...${result.substring(
                Math.max(0, contextIndex - 10),
                contextIndex + 30
              )}..."`
            );
          } else {
            console.error("Label not found in result string.");
          }
          return 0;
        }
      };

      const hookScore = extractScore("SCORE_HOOK");
      const valueScore = extractScore("SCORE_VALUE");
      const retentionScore = extractScore("SCORE_RETENTION");
      const ctaScore = extractScore("SCORE_CTA");
      const totalScore = extractScore("TOTAL");

      const verdictMatch = result.match(/VERDICT:\s*(.*)/);
      const verdict = verdictMatch?.[1]?.trim() || "Verdict not found."; // Provide fallback

      console.log(
        `Parsed Scores: Hook=${hookScore}, Value=${valueScore}, Retention=${retentionScore}, CTA=${ctaScore}, Total=${totalScore}`
      );

      const MIN_PASS_SCORE = 8;

      return {
        scores: {
          hook: hookScore,
          value: valueScore,
          retention: retentionScore,
          cta: ctaScore,
        },
        total: totalScore,
        passed: totalScore >= MIN_PASS_SCORE, // Use defined constant
        feedback: verdict,
        fullEvaluation: result, // Keep raw evaluation
      };
    } catch (error) {
      console.error("Validation Error (Outer Catch):", error);

      return {
        scores: { hook: 0, value: 0, retention: 0, cta: 0 },
        total: 0,
        passed: false,
        feedback: "Script validation failed due to an error.",
        fullEvaluation: `Error during validation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}
