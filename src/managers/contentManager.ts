import { SummarizerAgent } from "../agents/summarizer";
import { ValidatorAgent } from "../agents/validator";
import { ScriptWriterAgent } from "../agents/scriptWriter";
import {
  GenerationResult,
  ValidationResult,
  AgentInteraction,
} from "@/types/index";

export class ContentManager {
  private validatorAgent: ValidatorAgent;
  private scriptwriterAgent: ScriptWriterAgent;
  private summarizerAgent: SummarizerAgent;
  private previousScripts: Array<string>;
  private interactions: Array<AgentInteraction>;

  constructor() {
    this.validatorAgent = new ValidatorAgent();
    this.scriptwriterAgent = new ScriptWriterAgent();
    this.summarizerAgent = new SummarizerAgent();
    this.previousScripts = [];
    this.interactions = [];
  }

  private logInteraction(
    agent: string,
    action: string,
    input: string | undefined,
    output: string
  ): void {
    this.interactions = [
      ...this.interactions,
      {
        agent,
        action,
        input,
        output,
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async generateContent(
    title: string,
    data: string,
    duration: "short" | "long"
  ): Promise<GenerationResult> {
    let attempts = 0;
    let success = false;
    let script = "";
    let validation: ValidationResult | undefined;

    do {
      attempts++;
      console.log(`Attempt ${attempts}: Generating script...`);

      // Summarize feedback and previous scripts
      const summarizedFeedback = validation
        ? await this.summarizerAgent.summarizeFeedback(validation.feedback)
        : "";
      if (summarizedFeedback) {
        this.logInteraction(
          "SummarizerAgent",
          "Summarize Feedback",
          validation?.feedback,
          summarizedFeedback
        );
      }

      const summarizedScripts =
        this.previousScripts.length > 0
          ? await this.summarizerAgent.summarizeScripts(this.previousScripts)
          : "";
      if (summarizedScripts) {
        this.logInteraction(
          "SummarizerAgent",
          "Summarize Scripts",
          this.previousScripts.join("\n"),
          summarizedScripts
        );
      }

      // Generate script with summarized feedback and scripts as context
      script = await this.scriptwriterAgent.generateScript(
        title,
        data,
        duration,
        summarizedFeedback,
        summarizedScripts
      );
      this.logInteraction(
        "ScriptWriterAgent",
        "Generate Script",
        `Title: ${title}\nData: ${data}\nDuration: ${duration}\n ${summarizedFeedback} \n ${summarizedScripts} \n`,
        script
      );

      // Validate the script
      validation = await this.validatorAgent.validateScript(script, duration);
      this.logInteraction(
        "ValidatorAgent",
        "Validate Script",
        script,
        `Score: ${validation?.total}\nVerdict: ${validation?.feedback}`
      );

      // Store the script for contextual learning
      this.previousScripts = [...this.previousScripts, script];

      console.log(`Attempt ${attempts} Score: ${validation?.total}`);
    } while (!validation?.passed && attempts < 5); // Limit to 5 attempts

    success = validation?.passed ?? false;

    return {
      script,
      validation,
      attempts,
      success,
      interactions: this.interactions,
    };
  }
}
