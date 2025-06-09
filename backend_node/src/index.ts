// Main entry point for the LangGraph agent server

import express from 'express';
import type { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import config from './config/index.js';
import logger from './utils/logger.js';
import routes from './api/routes.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app: Application = express();

// Error interface for Express error handler
interface AppError extends Error {
  status?: number;
}

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'LangGraph Agent API',
    version: '0.0.1',
    description: 'TypeScript backend for the LangGraph agent',
    endpoints: {
      health: 'GET /api/health',
      invoke: 'POST /api/agent/invoke',
      stream: 'POST /api/agent/stream',
      config: 'GET /api/agent/config'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// Create logs directory if it doesn't exist
async function ensureLogsDirectory(): Promise<void> {
  const logsDir = join(__dirname, '../logs');
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
    logger.info('Created logs directory');
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Ensure logs directory exists
    await ensureLogsDirectory();

    // Log configuration (without sensitive data)
    logger.info('Starting server with configuration', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      corsOrigin: config.corsOrigin,
      models: {
        queryGenerator: config.queryGeneratorModel,
        reflection: config.reflectionModel,
        answer: config.answerModel
      }
    });

    // Start listening
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      console.log(`🚀 LangGraph Agent API running at http://localhost:${config.port}`);
      console.log(`📚 API documentation at http://localhost:${config.port}/`);
      console.log(`🔄 Development mode with hot reload enabled`);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start server', { error: errorMessage });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();