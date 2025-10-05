"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/behavioral_learning'
    },
    jwt: {
        secret: (process.env.JWT_SECRET || 'your-super-secret-jwt-key'),
        refreshSecret: (process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key'),
        expire: (process.env.JWT_EXPIRE || '15m'),
        refreshExpire: (process.env.JWT_REFRESH_EXPIRE || '7d')
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
    },
    email: {
        from: process.env.EMAIL_FROM || 'noreply@behaviorallearning.com',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || ''
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || ''
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    }
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map