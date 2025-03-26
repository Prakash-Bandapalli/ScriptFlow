import { Date } from "mongoose";

// OpenAI Types
export type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Request/Response Types
export type RequestBody = {
  videoTitle: string;
  data: string;
  duration: "short" | "long";
};

export type SuccessResponse = {
  success: true;
  script: string;
  validation: {
    total: number;
    scores: {
      hook: number;
      value: number;
      retention: number;
      cta: number;
    };
    feedback: string;
    fullEvaluation: string;
  };
  attempts: number;
};

export type ErrorResponse = {
  success: false;
  error: string;
};

export type ApiResponse = SuccessResponse | ErrorResponse;

// Agent Types
export type AgentConfig = {
  apiKey?: string;
};

export type ValidationScores = {
  hook: number;
  value: number;
  retention: number;
  cta: number;
};

export type ValidationResult = {
  scores: ValidationScores;
  total: number;
  passed: boolean;
  feedback: string;
  fullEvaluation: string;
};

export type ContentManagerConfig = {
  minTotal?: number;
  maxAttempts?: number;
};

export type AgentInteraction = {
  agent: string;
  action: string;
  input?: string;
  output: string;
  timestamp: string;
};

export type GenerationResult = {
  script: string;
  validation: ValidationResult;
  attempts: number;
  success: boolean;
  interactions: AgentInteraction[];
};
