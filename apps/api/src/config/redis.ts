// apps/api/src/config/redis.ts
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

// In-Memory Mock Redis Client Fallback
class MockRedis {
  private store: Map<string, { value: string; expiresAt?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }

  async connect(): Promise<void> {
    logger.info('ℹ️ Using Resilient In-Memory Mock Redis Cache');
  }

  on(event: string, callback: (...args: any[]) => void): this {
    // Mock event registration
    return this;
  }
}

let redisClient: any;

export function getRedis(): any {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl === 'redis://localhost:6379') {
      logger.warn('⚠️ No custom REDIS_URL found. Falling back to Mock In-Memory Cache.');
      redisClient = new MockRedis();
    } else {
      try {
        redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 2000,
          retryStrategy(times) {
            // Do not retry more than once to prevent blocking server launch
            if (times > 1) {
              logger.error('❌ Redis connection timed out. Switching to Mock In-Memory Cache.');
              redisClient = new MockRedis();
              return null;
            }
            return 500;
          },
        });

        redisClient.on('connect', () => logger.info('✅ Redis connected'));
        redisClient.on('error', (err: any) => {
          logger.error('❌ Redis connection error. Switching to Mock In-Memory Cache.');
          redisClient = new MockRedis();
        });
      } catch (err) {
        logger.error('❌ Failed to construct Redis client. Switching to Mock In-Memory Cache.');
        redisClient = new MockRedis();
      }
    }
  }
  return redisClient;
}

export async function connectRedis() {
  const client = getRedis();
  try {
    if (client.connect) {
      await client.connect();
    }
  } catch (err) {
    logger.warn('⚠️ Redis server unavailable. Switching to Mock In-Memory Cache.');
    redisClient = new MockRedis();
  }
  return redisClient;
}
