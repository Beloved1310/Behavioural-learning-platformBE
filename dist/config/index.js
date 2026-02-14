"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
/**
 * Validates required environment variables
 */
function validateEnv() {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        logger_1.logger.error('Missing required environment variables', undefined, { missing });
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    // Warn about missing optional but recommended variables
    const recommended = [
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASS',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    ];
    const missingRecommended = recommended.filter((key) => !process.env[key]);
    if (missingRecommended.length > 0 && process.env.NODE_ENV === 'production') {
        logger_1.logger.warn('Missing recommended environment variables', { missing: missingRecommended });
    }
}
// Validate environment on module load
if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}
/**
 * Application configuration
 * Centralized configuration management with validation
 */
exports.config = {
    // Server configuration
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: (process.env.NODE_ENV || 'development'),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    // Database configuration
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/behavioral_learning',
    },
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        expire: (process.env.JWT_EXPIRE || '15m'),
        refreshExpire: (process.env.JWT_REFRESH_EXPIRE || '7d'),
    },
    // Stripe configuration (optional)
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    // Email configuration
    email: {
        from: process.env.EMAIL_FROM || 'noreply@behaviorallearning.com',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    },
    // Cloudinary configuration (optional)
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    // OpenAI configuration (optional)
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },
    // Gemini configuration (optional)
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: (process.env.GEMINI_MODEL || 'gemini-pro'),
    },
    // Rate limiting configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
    },
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map