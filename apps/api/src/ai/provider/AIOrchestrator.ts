// src/ai/provider/AIOrchestrator.ts
import { AIProvider, Message, ChatConfig, ChatResponse, AITask } from './AIProvider.interface';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { MockAIProvider } from './MockAIProvider';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { getRedis } from '../../config/redis';
import crypto from 'crypto';

// Task → optimal provider routing
const TASK_ROUTING: Record<AITask['type'], string> = {
  interview_qa:       'openai',   // Best reasoning + follow-ups
  resume_extraction:  'gemini',   // Long context (1.5M tokens)
  jd_matching:        'gemini',   // Long context
  behavioral_eval:    'openai',   // Nuanced analysis
  coding_review:      'openai',   // Code understanding
  report_generation:  'openai',   // Best quality output
  roadmap_generation: 'openai',   // Structured planning
  general:            'openai',
};

export class AIOrchestrator {
  private providers: Map<string, AIProvider> = new Map();
  private redis = getRedis();

  constructor() {
    const mockProvider = new MockAIProvider();
    this.providers.set('mock', mockProvider);

    if (env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider(env.OPENAI_API_KEY));
    } else {
      logger.warn('⚠️ OPENAI_API_KEY is not configured. Falling back to Mock AI Provider for OpenAI tasks.');
      this.providers.set('openai', mockProvider);
    }

    if (env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiProvider(env.GEMINI_API_KEY));
    } else {
      logger.warn('⚠️ GEMINI_API_KEY is not configured. Falling back to Mock AI Provider for Gemini tasks.');
      this.providers.set('gemini', mockProvider);
    }
  }

  private selectProvider(task: AITask['type']): AIProvider {
    const preferred = TASK_ROUTING[task];
    if (this.providers.has(preferred)) return this.providers.get(preferred)!;
    // Fallback to any available
    const fallback = [...this.providers.values()][0];
    if (!fallback) throw new Error('No AI providers configured');
    logger.warn(`Falling back to provider: ${fallback.name} for task: ${task}`);
    return fallback;
  }

  private buildCacheKey(messages: Message[], config?: ChatConfig): string {
    const payload = JSON.stringify({ messages, config });
    return `ai_cache:${crypto.createHash('sha256').update(payload).digest('hex')}`;
  }

  async chat(
    messages: Message[],
    task: AITask['type'] = 'general',
    config?: ChatConfig,
    useCache = false,
    cacheTtlSec = 3600
  ): Promise<ChatResponse> {
    // Check cache for deterministic requests
    if (useCache) {
      const cacheKey = this.buildCacheKey(messages, config);
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('AI cache hit');
        return JSON.parse(cached);
      }
    }

    const provider = this.selectProvider(task);
    try {
      const response = await provider.chat(messages, config);

      if (useCache) {
        const cacheKey = this.buildCacheKey(messages, config);
        await this.redis.setex(cacheKey, cacheTtlSec, JSON.stringify(response));
      }

      logger.info(`AI [${provider.name}] task=${task} tokens=${response.usage.totalTokens} cost=$${response.estimatedCostUsd}`);
      return response;
    } catch (err) {
      logger.error(`Provider ${provider.name} failed, trying fallback...`);
      // Try other providers
      for (const [name, p] of this.providers) {
        if (name === provider.name) continue;
        try {
          return await p.chat(messages, config);
        } catch (fallbackErr) {
          logger.error(`Fallback provider ${name} also failed`);
        }
      }
      throw new Error('All AI providers failed');
    }
  }

  async parseJSON<T>(
    messages: Message[],
    task: AITask['type'] = 'general',
    config?: ChatConfig
  ): Promise<T> {
    const response = await this.chat(messages, task, { ...config, temperature: 0.3 });
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = jsonMatch ? jsonMatch[1] : response.content;
      return JSON.parse(raw.trim()) as T;
    } catch {
      throw new Error(`Failed to parse AI JSON response: ${response.content.slice(0, 200)}`);
    }
  }
}

// Singleton
export const aiOrchestrator = new AIOrchestrator();
