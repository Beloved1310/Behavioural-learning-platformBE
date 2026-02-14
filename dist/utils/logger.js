"use strict";
/**
 * Logger utility for consistent logging across the application
 * Replaces console.log/error/warn with a structured logging approach
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
        this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
    shouldLog(level) {
        return level <= this.logLevel;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }
    error(message, error, context) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        const errorContext = {
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
    warn(message, context) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        // Suppress console output during tests to keep test output clean
        if (!this.isTest) {
            console.warn(this.formatMessage('WARN', message, context));
        }
    }
    info(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        // Suppress console output during tests to keep test output clean
        if (!this.isTest) {
            console.info(this.formatMessage('INFO', message, context));
        }
    }
    debug(message, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        // Suppress console output during tests to keep test output clean
        if (!this.isTest) {
            console.debug(this.formatMessage('DEBUG', message, context));
        }
    }
    /**
     * Log HTTP request
     */
    http(method, url, statusCode, duration, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const message = `${method} ${url} ${statusCode}${duration ? ` - ${duration}ms` : ''}`;
        this.info(message, context);
    }
    /**
     * Log database operation
     */
    db(operation, collection, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        this.debug(`DB ${operation} on ${collection}`, context);
    }
}
exports.logger = new Logger();
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map