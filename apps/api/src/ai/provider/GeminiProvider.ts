// src/ai/provider/GeminiProvider.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, Message, ChatConfig, ChatResponse } from './AIProvider.interface';
import { logger } from '../../utils/logger';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gemini-1.5-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.defaultModel = defaultModel;
  }

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async chat(messages: Message[], config: ChatConfig = {}): Promise<ChatResponse> {
    const modelName = config.model || this.defaultModel;
    try {
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 2048,
        },
      });

      // Convert messages to Gemini format
      const systemMsg = messages.find((m) => m.role === 'system');
      const history = messages
        .filter((m) => m.role !== 'system')
        .slice(0, -1)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const lastMsg = messages[messages.length - 1];
      const chat = model.startChat({
        history,
        systemInstruction: systemMsg?.content,
      });

      const result = await chat.sendMessage(lastMsg.content);
      const text = result.response.text();
      const usage = result.response.usageMetadata;

      return {
        content: text,
        model: modelName,
        usage: {
          promptTokens: usage?.promptTokenCount ?? 0,
          completionTokens: usage?.candidatesTokenCount ?? 0,
          totalTokens: usage?.totalTokenCount ?? 0,
        },
        estimatedCostUsd: 0.0, // Gemini free tier / calculate per model
      };
    } catch (err) {
      logger.error(`Gemini chat error: ${err}`);
      throw err;
    }
  }
}
