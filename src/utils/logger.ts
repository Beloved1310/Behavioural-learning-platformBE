/**
 * Logger utility for consistent logging across the application
 * Replaces console.log/error/warn with a structured logging approach
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private isTest: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        ...(this.isDevelopment && { stack: error.stack }),
      }),
    };

    // Suppress console output during tests to keep test output clean
    if (!this.isTest) {
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    // Suppress console output during tests to keep test output clean
    if (!this.isTest) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    // Suppress console output during tests to keep test output clean
    if (!this.isTest) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    // Suppress console output during tests to keep test output clean
    if (!this.isTest) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Log HTTP request
   */
  http(
    method: string,
    url: string,
    statusCode: number,
    duration?: number,
    context?: LogContext
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const message = `${method} ${url} ${statusCode}${duration ? ` - ${duration}ms` : ''}`;
    this.info(message, context);
  }

  /**
   * Log database operation
   */
  db(operation: string, collection: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.debug(`DB ${operation} on ${collection}`, context);
  }
}

export const logger = new Logger();
export default logger;
