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
  
          FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
          SCORE_HOOK: [0-2.5]
          SCORE_VALUE: [0-2.5]
          SCORE_RETENTION: [0-2.5]
          SCORE_CTA: [0-2.5]
          TOTAL: [sum of all scores]
          VERDICT: [one sentence - why this score]
  
          Script to evaluate:
          ${script}
        `;

      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        {
          role: "system",
          content:
            "You are the harshest YouTube script critic. Never be lenient.",
        },
        { role: "user", content: prompt },
      ];

      const result = await this.generateCompletion(messages);

      const hookScore = parseFloat(
        result.match(/SCORE_HOOK: ([\d.]+)/)?.[1] || "0"
      );
      const valueScore = parseFloat(
        result.match(/SCORE_VALUE: ([\d.]+)/)?.[1] || "0"
      );
      const retentionScore = parseFloat(
        result.match(/SCORE_RETENTION: ([\d.]+)/)?.[1] || "0"
      );
      const ctaScore = parseFloat(
        result.match(/SCORE_CTA: ([\d.]+)/)?.[1] || "0"
      );
      const totalScore = parseFloat(
        result.match(/TOTAL: ([\d.]+)/)?.[1] || "0"
      );
      const verdict = result.match(/VERDICT: (.*)/)?.[1] || "";

      return {
        scores: {
          hook: hookScore,
          value: valueScore,
          retention: retentionScore,
          cta: ctaScore,
        },
        total: totalScore,
        passed: totalScore >= 8,
        feedback: verdict,
        fullEvaluation: result,
      };
    } catch (error) {
      console.error("Validation Error:", error);
      throw new Error("Failed to validate script");
    }
  }
}
