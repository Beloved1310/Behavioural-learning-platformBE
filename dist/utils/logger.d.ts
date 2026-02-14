/**
 * Logger utility for consistent logging across the application
 * Replaces console.log/error/warn with a structured logging approach
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
interface LogContext {
    [key: string]: any;
}
declare class Logger {
    private logLevel;
    private isDevelopment;
    private isTest;
    constructor();
    private shouldLog;
    private formatMessage;
    error(message: string, error?: Error | unknown, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    /**
     * Log HTTP request
     */
    http(method: string, url: string, statusCode: number, duration?: number, context?: LogContext): void;
    /**
     * Log database operation
     */
    db(operation: string, collection: string, context?: LogContext): void;
}
export declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map