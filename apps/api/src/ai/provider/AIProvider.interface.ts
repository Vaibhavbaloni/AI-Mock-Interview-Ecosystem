// src/ai/provider/AIProvider.interface.ts

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatConfig {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd: number;
}

export interface AITask {
  type:
    | 'interview_qa'
    | 'resume_extraction'
    | 'jd_matching'
    | 'behavioral_eval'
    | 'coding_review'
    | 'report_generation'
    | 'roadmap_generation'
    | 'general';
}

export interface AIProvider {
  readonly name: string;
  chat(messages: Message[], config?: ChatConfig): Promise<ChatResponse>;
  isAvailable(): boolean;
}
