// src/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import { getRedis } from '../config/redis';

// Generic factory
function createLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_ERROR', message } },
    skip: (req) => process.env.NODE_ENV === 'test',
  });
}

// Auth routes: 10 attempts per 15 min
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts. Please wait 15 minutes.'
);

// AI routes: 30 requests per min
export const aiLimiter = createLimiter(
  60 * 1000,
  30,
  'AI request limit reached. Please wait a moment.'
);

// Resume upload: 5 per hour
export const uploadLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  'Resume upload limit reached. You can upload 5 resumes per hour.'
);

// General API: 100 per min
export const generalLimiter = createLimiter(
  60 * 1000,
  100,
  'Too many requests. Please slow down.'
);

// Code submission: 20 per min
export const codeLimiter = createLimiter(
  60 * 1000,
  20,
  'Code submission limit reached.'
);
