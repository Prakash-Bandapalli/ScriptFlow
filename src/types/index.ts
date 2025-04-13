import { Date } from "mongoose";

// Status Update Type
export type StatusUpdate = {
  message: string;
  timestamp: string;
};

// OpenAI Types (Keep as is)
export type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Request/Response Types
export type RequestBody = {
  videoTitle: string; // Keep as is
  data: string;
  duration: "short" | "long";
};

// Updated SuccessResponse to include statusUpdates
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
  interactions: AgentInteraction[]; // Keep interactions
  statusUpdates?: StatusUpdate[]; // Add this
};

export type ErrorResponse = {
  success: false;
  error: string;
  statusUpdates?: StatusUpdate[]; // Optionally add here too for consistency
};

// Updated ApiResponse (optional but cleaner handling)
export type ApiResponse = SuccessResponse | ErrorResponse;

// Agent Types (Keep as is)
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
  minTotal?: number; // Keep as is
  maxAttempts?: number;
};

export type AgentInteraction = {
  agent: string;
  action: string;
  input?: string;
  output: string;
  timestamp: string;
};

// Updated GenerationResult to include statusUpdates
export type GenerationResult = {
  script: string;
  validation: ValidationResult;
  attempts: number;
  success: boolean;
  interactions: AgentInteraction[];
  statusUpdates?: StatusUpdate[]; // Add this
};
