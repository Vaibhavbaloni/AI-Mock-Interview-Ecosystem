// src/ai/provider/OpenAIProvider.ts
import OpenAI from 'openai';
import { AIProvider, Message, ChatConfig, ChatResponse } from './AIProvider.interface';
import { logger } from '../../utils/logger';

// Model pricing (per 1M tokens, USD)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o':      { input: 5.00,  output: 15.00 },
  'gpt-4o-mini': { input: 0.15,  output: 0.60  },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async chat(messages: Message[], config: ChatConfig = {}): Promise<ChatResponse> {
    const model = config.model || this.defaultModel;
    try {
      const res = await this.client.chat.completions.create({
        model,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
      });

      const usage = res.usage!;
      const pricing = PRICING[model] || { input: 5.0, output: 15.0 };
      const cost =
        (usage.prompt_tokens / 1_000_000) * pricing.input +
        (usage.completion_tokens / 1_000_000) * pricing.output;

      return {
        content: res.choices[0].message.content || '',
        model,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        estimatedCostUsd: parseFloat(cost.toFixed(6)),
      };
    } catch (err) {
      logger.error(`OpenAI chat error: ${err}`);
      throw err;
    }
  }
}
