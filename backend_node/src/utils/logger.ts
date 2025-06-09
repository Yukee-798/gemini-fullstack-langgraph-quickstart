import winston from 'winston';
import config from '../config/index.js';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }: winston.Logform.TransformableInfo) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logger instance
let logger: winston.Logger;
try {
  logger = winston.createLogger({
    level: config.logLevel || 'info',
    format: logFormat,
    defaultMeta: { service: 'langgraph-agent' },
    transports: [
      // Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
} catch (error) {
  console.error('Failed to create winston logger:', error);
  // Create a fallback logger
  logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
  });
}

// If we're not in production, log to the console
try {
  if (config.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
      format: consoleFormat
    }));
  }
} catch (error) {
  console.error('Failed to add console transport:', error);
}

// Create a logger wrapper with stream support
const loggerWrapper = Object.assign(logger, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
});

export default loggerWrapper;