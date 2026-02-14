/**
 * Application configuration
 * Centralized configuration management with validation
 */
export declare const config: {
    port: number;
    nodeEnv: "development" | "production" | "test";
    frontendUrl: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expire: string;
        refreshExpire: string;
    };
    stripe: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
    };
    email: {
        from: string;
        smtp: {
            host: string;
            port: number;
            user: string;
            pass: string;
        };
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    openai: {
        apiKey: string;
    };
    gemini: {
        apiKey: string;
        model: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map