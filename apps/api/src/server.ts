// apps/api/src/server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import 'express-async-errors';

import { env } from './config/env';
import { connectPostgres, connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { initializeSocketServer } from './socket/socketServer';

// Router imports
import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/users.routes';
import resumesRouter from './modules/resumes/resumes.routes';
import interviewsRouter from './modules/interviews/interviews.routes';
import codingRouter from './modules/coding/coding.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import simulationRouter from './modules/simulation/simulation.routes';
import coachRouter from './modules/coach/coach.routes';
import gpsRouter from './modules/gps/gps.routes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Server
initializeSocketServer(server);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global General Rate Limiter
app.use('/api/', generalLimiter);

// API Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/resumes', resumesRouter);
app.use('/api/v1/interviews', interviewsRouter);
app.use('/api/v1/coding', codingRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/simulation', simulationRouter);
app.use('/api/v1/coach', coachRouter);
app.use('/api/v1/gps', gpsRouter);

// 404 Route handler
app.use('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Startup sequence
async function startServer() {
  try {
    logger.info('Starting InterviewVerse AI Backend Server...');

    // 1. Connect databases
    await connectPostgres();
    await connectMongoDB(env.MONGODB_URI);
    await connectRedis();

    // 2. Start HTTP/WS server
    const port = env.PORT;
    server.listen(port, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle Graceful Shutdown
const shutdown = async () => {
  logger.warn('Received shutdown signal. Closing servers and connections...');
  server.close(() => {
    logger.info('HTTP server closed.');
  });

  // Additional cleanup if needed (e.g. databases, Redis)
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
