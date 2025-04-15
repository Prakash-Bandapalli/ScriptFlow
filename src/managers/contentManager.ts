// src/managers/contentManager.ts

import { SummarizerAgent } from "../agents/summarizer";
import { ValidatorAgent } from "../agents/validator";
import { ScriptWriterAgent } from "../agents/scriptWriter";
import {
  GenerationResult,
  ValidationResult,
  AgentInteraction,
  StatusUpdate,
} from "@/types/index";

const MAX_ATTEMPTS = 5;
const MIN_SCORE = 8;

export class ContentManager {
  private validatorAgent: ValidatorAgent;
  private scriptwriterAgent: ScriptWriterAgent;
  private summarizerAgent: SummarizerAgent;
  private interactions: AgentInteraction[];
  private statusUpdates: StatusUpdate[];

  constructor() {
    this.validatorAgent = new ValidatorAgent();
    this.scriptwriterAgent = new ScriptWriterAgent();
    this.summarizerAgent = new SummarizerAgent();
    this.interactions = [];
    this.statusUpdates = [];
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

  private logStatus(message: string): void {
    const update: StatusUpdate = {
      message,
      timestamp: new Date().toISOString(),
    };
    this.statusUpdates.push(update);
    console.log(
      `[Status] ${new Date(update.timestamp).toLocaleTimeString()}: ${message}`
    );
  }

  async generateContent(
    title: string,
    data: string,
    duration: "short" | "long",
    genrePattern: string,
    detectedGenre: string // <-- Add parameter for detected genre
  ): Promise<GenerationResult> {
    // Reset state for new generation
    this.interactions = [];
    this.statusUpdates = [];

    // --- Log the provided genre classification result FIRST ---
    this.logInteraction(
      "GenreClassifierAgent",
      "Classify Genre (Result Provided)", // Indicate it was provided externally
      `Title: ${title}`, // The input to the classifier was the title
      `Detected Genre: ${detectedGenre}` // The output result
    );
    // --- End Genre Classification Log ---

    let attempts = 0;
    let success = false;
    let currentScript = "";
    let lastScript = "";
    let validation: ValidationResult | undefined;
    let summarizedFeedback = "";

    this.logStatus(`🚀 Starting script generation for "${title}"...`);

    if (genrePattern) {
      this.logStatus(
        `🎨 Applying specific genre style pattern for "${detectedGenre}".`
      );
    } else if (
      detectedGenre &&
      detectedGenre !== "genre is not found try something else"
    ) {
      this.logStatus(
        `⚠️ Genre "${detectedGenre}" detected, but no specific pattern found. Using general style.`
      );
    } else {
      this.logStatus(
        `⚙️ Using general script writing style (no specific genre pattern applied).`
      );
    }

    do {
      attempts++;
      this.logStatus(
        `✍️ Script generation attempt ${attempts}/${MAX_ATTEMPTS}...`
      );

      // Summarize feedback from the *previous* validation if it exists
      if (validation && validation.feedback && !validation.passed) {
        this.logStatus(`💡 Analyzing feedback for improvements...`);
        try {
          summarizedFeedback = await this.summarizerAgent.summarizeFeedback(
            validation.fullEvaluation
          );
          this.logInteraction(
            "SummarizerAgent",
            "Summarize Feedback",
            validation.fullEvaluation,
            summarizedFeedback
          );
          this.logStatus(`✨ Feedback analysis complete.`);
        } catch (e: any) {
          this.logStatus(
            `⚠️ Error summarizing feedback: ${e.message}. Continuing without summary.`
          );
          console.error("Summarizer Error:", e);
          summarizedFeedback = `Feedback summary failed. Focus on improving based on previous score: ${validation.total}/10. Issues likely related to: ${validation.feedback}`;
        }
      } else {
        summarizedFeedback = "";
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
          summarizedFeedback,
          attempts > 1 ? lastScript : undefined,
          genrePattern // Pass genrePattern consistently
        );

        const scriptWriterInput = `Title: ${title}\nData: ${data}\nDuration: ${duration}${
          genrePattern ? `\nGenre Pattern:\n${genrePattern}` : "" // Log the actual pattern used
        }${
          summarizedFeedback
            ? `\nSummarized Feedback:\n${summarizedFeedback}`
            : ""
        }${
          attempts > 1 && lastScript
            ? `\nPrevious Script (to revise):\n[See Previous Interaction]`
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
        return {
          script: currentScript || "Script generation failed.",
          validation: validation || {
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
      this.logStatus(`🧐 Evaluating script quality (Attempt ${attempts})...`);
      try {
        validation = await this.validatorAgent.validateScript(
          currentScript,
          duration
        );
        this.logInteraction(
          "ValidatorAgent",
          "Validate Script",
          currentScript,
          `Score: ${validation?.total}\nVerdict: ${validation?.feedback}\nFull Eval:\n${validation?.fullEvaluation}`
        );

        if (validation.passed && validation.total >= MIN_SCORE) {
          // Added MIN_SCORE check here too for consistency
          success = true;
          this.logStatus(
            `🎉 Script approved! Score: ${validation.total}/${MIN_SCORE} (Attempt ${attempts}).`
          );
        } else {
          const reason = !validation.passed
            ? "Failed validation checks."
            : `Score ${validation.total} is below minimum ${MIN_SCORE}.`;
          this.logStatus(
            `📉 Needs improvement. ${reason} (Attempt ${attempts}). ${validation.feedback}`
          );
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
        return {
          script: currentScript || "Validation failed.",
          validation: validation || {
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

      lastScript = currentScript;
    } while (!success && attempts < MAX_ATTEMPTS);

    if (!validation) {
      this.logStatus(
        `❌ Error: Process finished unexpectedly without validation results.`
      );
      // Provide a default failure validation if somehow validation is still undefined
      validation = {
        scores: { hook: 0, value: 0, retention: 0, cta: 0 },
        total: 0,
        passed: false,
        feedback: "Process finished without validation.",
        fullEvaluation: "Process finished without validation.",
      };
      success = false; // Ensure success is false
      // Don't throw an error here, return the failure state instead
      // throw new Error(
      //   "Content generation failed: No validation result available."
      // );
    }

    this.logStatus(`🏁 Script generation process complete.`);

    return {
      script: currentScript,
      validation: validation,
      attempts,
      success,
      interactions: this.interactions,
      statusUpdates: this.statusUpdates,
    };
  }
}
