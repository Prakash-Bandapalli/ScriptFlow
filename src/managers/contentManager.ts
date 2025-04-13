import { SummarizerAgent } from "../agents/summarizer";
import { ValidatorAgent } from "../agents/validator";
import { ScriptWriterAgent } from "../agents/scriptWriter";
import {
  GenerationResult,
  ValidationResult,
  AgentInteraction,
  StatusUpdate, // <-- Import StatusUpdate
} from "@/types/index";

const MAX_ATTEMPTS = 5;
const MIN_SCORE = 8;

export class ContentManager {
  private validatorAgent: ValidatorAgent;
  private scriptwriterAgent: ScriptWriterAgent;
  private summarizerAgent: SummarizerAgent;
  private interactions: AgentInteraction[];
  private statusUpdates: StatusUpdate[]; // <-- Add state for status updates

  constructor() {
    this.validatorAgent = new ValidatorAgent();
    this.scriptwriterAgent = new ScriptWriterAgent();
    this.summarizerAgent = new SummarizerAgent();
    this.interactions = [];
    this.statusUpdates = []; // <-- Initialize status updates
  }

  private logInteraction(
    agent: string,
    action: string,
    input: string | undefined,
    output: string
  ): void {
    this.interactions.push({
      agent,
      action,
      input,
      output,
      timestamp: new Date().toISOString(),
    });
  }

  // <-- Add method to log status updates -->
  private logStatus(message: string): void {
    const update: StatusUpdate = {
      message,
      timestamp: new Date().toISOString(),
    };
    this.statusUpdates.push(update);
    console.log(
      `[Status] ${new Date(update.timestamp).toLocaleTimeString()}: ${message}`
    ); // Also log to console
  }
  // <-- End status update log method -->

  async generateContent(
    title: string,
    data: string,
    duration: "short" | "long",
    genrePattern: string // <-- Accept genrePattern
  ): Promise<GenerationResult> {
    // Reset state for new generation
    this.interactions = [];
    this.statusUpdates = []; // <-- Reset status updates

    let attempts = 0;
    let success = false;
    let currentScript = "";
    let lastScript = "";
    let validation: ValidationResult | undefined;
    let summarizedFeedback = "";

    this.logStatus(`🚀 Starting script generation for "${title}"...`); // <-- Log initial status

    if (genrePattern) {
      this.logStatus(`🎨 Applying specific genre style patterns.`);
    } else {
      this.logStatus(`⚙️ Using general script writing style.`);
    }

    do {
      attempts++;
      this.logStatus(
        `✍️ Script generation attempt ${attempts}/${MAX_ATTEMPTS}...`
      ); // <-- Log attempt start

      // Summarize feedback from the *previous* validation if it exists
      if (validation && validation.feedback && !validation.passed) {
        this.logStatus(`💡 Analyzing feedback for improvements...`); // <-- Log feedback summary start
        try {
          summarizedFeedback = await this.summarizerAgent.summarizeFeedback(
            validation.fullEvaluation // Pass full eval for better summary context
          );
          this.logInteraction(
            "SummarizerAgent",
            "Summarize Feedback",
            validation.fullEvaluation,
            summarizedFeedback
          );
          this.logStatus(`✨ Feedback analysis complete.`); // <-- Log feedback summary end
        } catch (e: any) {
          this.logStatus(
            `⚠️ Error summarizing feedback: ${e.message}. Continuing without summary.`
          );
          console.error("Summarizer Error:", e);
          summarizedFeedback = `Feedback summary failed. Focus on improving based on previous score: ${validation.total}/10. Issues likely related to: ${validation.feedback}`; // Provide fallback feedback
        }
      } else {
        summarizedFeedback = ""; // No feedback needed for first attempt or after success
      }

      // Generate script: Pass summarized feedback, last script, AND genrePattern
      try {
        this.logStatus(
          attempts > 1
            ? `🔧 Revising script (Attempt ${attempts})...`
            : `📝 Drafting initial script (Attempt ${attempts})...`
        );
        currentScript = await this.scriptwriterAgent.generateScript(
          title,
          data,
          duration,
          summarizedFeedback, // Pass summarized feedback
          attempts > 1 ? lastScript : undefined, // Pass previous script after attempt 1
          genrePattern // <-- Pass genrePattern consistently
        );

        // Prepare input log string carefully
        const scriptWriterInput = `Title: ${title}\nData: ${data}\nDuration: ${duration}${
          genrePattern ? `\nGenre Pattern:\n${genrePattern}` : ""
        }${
          summarizedFeedback
            ? `\nSummarized Feedback:\n${summarizedFeedback}`
            : ""
        }${
          attempts > 1 && lastScript
            ? `\nPrevious Script (to revise):\n[See Previous Interaction]` // Avoid logging large script again
            : ""
        }`;

        this.logInteraction(
          "ScriptWriterAgent",
          attempts > 1 ? "Revise Script" : "Generate Initial Script",
          scriptWriterInput,
          currentScript
        );
        this.logStatus(`✅ Script draft complete (Attempt ${attempts}).`);
      } catch (e: any) {
        this.logStatus(
          `❌ Critical error during script generation (Attempt ${attempts}): ${e.message}. Stopping process.`
        );
        console.error("ScriptWriter Error:", e);
        // Return immediately with failure state
        return {
          script: currentScript || "Script generation failed.",
          validation: validation || {
            // Provide last known validation or a default failure
            scores: { hook: 0, value: 0, retention: 0, cta: 0 },
            total: 0,
            passed: false,
            feedback: `Failed during script generation: ${e.message}`,
            fullEvaluation: `Failed during script generation: ${e.message}`,
          },
          attempts,
          success: false,
          interactions: this.interactions,
          statusUpdates: this.statusUpdates,
        };
      }

      // Validate the script
      this.logStatus(`🧐 Evaluating script quality (Attempt ${attempts})...`); // <-- Log validation start
      try {
        validation = await this.validatorAgent.validateScript(
          currentScript,
          duration
        );
        this.logInteraction(
          "ValidatorAgent",
          "Validate Script",
          currentScript, // Log the script being validated
          `Score: ${validation?.total}\nVerdict: ${validation?.feedback}\nFull Eval:\n${validation?.fullEvaluation}`
        );

        if (validation.passed) {
          success = true;
          this.logStatus(
            `🎉 Script approved! Score: ${validation.total}/${MIN_SCORE} (Attempt ${attempts}).`
          ); // <-- Log success
        } else {
          this.logStatus(
            `📉 Needs improvement. Score: ${validation.total}/${MIN_SCORE} (Attempt ${attempts}). ${validation.feedback}`
          ); // <-- Log failure
          if (attempts >= MAX_ATTEMPTS) {
            this.logStatus(
              `⚠️ Maximum attempts (${MAX_ATTEMPTS}) reached. Providing best available script.`
            );
          }
        }
      } catch (e: any) {
        this.logStatus(
          `❌ Critical error during script validation (Attempt ${attempts}): ${e.message}. Stopping process.`
        );
        console.error("Validator Error:", e);
        // Return immediately with failure state
        return {
          script: currentScript || "Validation failed.",
          validation: validation || {
            // Provide last known validation or a default failure
            scores: { hook: 0, value: 0, retention: 0, cta: 0 },
            total: 0,
            passed: false,
            feedback: `Failed during validation: ${e.message}`,
            fullEvaluation: `Failed during validation: ${e.message}`,
          },
          attempts,
          success: false,
          interactions: this.interactions,
          statusUpdates: this.statusUpdates,
        };
      }

      lastScript = currentScript; // Store for potential next revision
    } while (!success && attempts < MAX_ATTEMPTS);

    // Ensure validation is defined before returning (should always be set if loop ran)
    if (!validation) {
      this.logStatus(
        `❌ Error: Process finished unexpectedly without validation results.`
      );
      throw new Error(
        "Content generation failed: No validation result available."
      );
    }

    this.logStatus(`🏁 Script generation process complete.`);

    return {
      script: currentScript,
      validation: validation,
      attempts,
      success,
      interactions: this.interactions,
      statusUpdates: this.statusUpdates, // <-- Include status updates
    };
  }
}
