"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = __importDefault(require("./config"));
const database_1 = __importDefault(require("./config/database"));
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middleware/errorHandler");
const socket_1 = require("./socket");
const logger_1 = require("./utils/logger");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const gamification_1 = __importDefault(require("./routes/gamification"));
const chat_1 = __importDefault(require("./routes/chat"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const users_1 = __importDefault(require("./routes/users"));
const preferences_1 = __importDefault(require("./routes/preferences"));
const behavioral_1 = __importDefault(require("./routes/behavioral"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const parentReports_1 = __importDefault(require("./routes/parentReports"));
const goals_1 = __importDefault(require("./routes/goals"));
const commitments_1 = __importDefault(require("./routes/commitments"));
const reflections_1 = __importDefault(require("./routes/reflections"));
const assessments_1 = __importDefault(require("./routes/assessments"));
const habits_1 = __importDefault(require("./routes/habits"));
const milestones_1 = __importDefault(require("./routes/milestones"));
const tutor_1 = __importDefault(require("./routes/tutor"));
const admin_1 = __importDefault(require("./routes/admin"));
const parentEmailScheduler_1 = __importDefault(require("./services/parentEmailScheduler"));
// Routes (will be created)
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import sessionRoutes from './routes/sessions';
// import chatRoutes from './routes/chat';
// import quizRoutes from './routes/quizzes';
// import gamificationRoutes from './routes/gamification';
// // import analyticsRoutes from './routes/analytics';
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: config_1.default.frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization'],
    },
    transports: ['websocket', 'polling'], // Enable both transports
    pingTimeout: 60000,
    pingInterval: 25000,
});
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.default.frontendUrl,
    credentials: true,
}));
// Rate limiting - more lenient in development
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimit.windowMs, // 15 minutes
    max: config_1.default.nodeEnv === 'development' ? 1000 : config_1.default.rateLimit.maxRequests, // 1000 requests in dev, 100 in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health check and socket status endpoints
        return req.path === '/health' || req.path === '/socket-status';
    },
});
// Apply rate limiting (health check is already skipped via skip function)
app.use(limiter);
// Logging
if (config_1.default.nodeEnv === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config_1.default.nodeEnv,
    });
});
// Swagger API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Behavioral Learning Platform API Documentation',
    customfavIcon: '/favicon.ico',
}));
// API routes
app.use('/api', (req, res) => {
    res.json({ message: 'Behavioral Learning Platform API' });
});
// Test endpoint to manually trigger parent email scheduler (development only)
// Must be defined BEFORE other routes to avoid authentication middleware
app.post('/v1/api/test/trigger-parent-emails', async (req, res) => {
    // Only allow in development or if explicitly enabled
    if (config_1.default.nodeEnv === 'production' && process.env.ALLOW_TEST_EMAIL_TRIGGER !== 'true') {
        return res.status(403).json({
            success: false,
            message: 'This endpoint is only available in development or when ALLOW_TEST_EMAIL_TRIGGER=true',
        });
    }
    try {
        logger_1.logger.info('Manually triggering weekly parent email reports');
        await parentEmailScheduler_1.default.triggerWeeklyReports();
        res.json({
            success: true,
            message: 'Weekly parent email reports triggered successfully. Check server logs and parent email inboxes.',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error triggering weekly reports', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger weekly reports',
            error: error.message,
        });
    }
});
app.use('/v1/api/auth', auth_1.default);
app.use('/v1/api/gamification', gamification_1.default);
app.use('/v1/api/chat', chat_1.default);
app.use('/v1/api', sessions_1.default);
app.use('/v1/api/users', users_1.default);
// app.use('/v1/api/payments', paymentRoutes); // Removed from MVP - payment not needed
app.use('/v1/api/preferences', preferences_1.default);
app.use('/v1/api/behavioral', behavioral_1.default);
app.use('/v1/api/notifications', notifications_1.default);
app.use('/v1/api/parent-reports', parentReports_1.default);
app.use('/v1/api/goals', goals_1.default);
app.use('/v1/api/commitments', commitments_1.default);
app.use('/v1/api/reflections', reflections_1.default);
app.use('/v1/api/assessments', assessments_1.default);
app.use('/v1/api/habits', habits_1.default);
app.use('/v1/api/milestones', milestones_1.default);
app.use('/v1/api/tutor', tutor_1.default);
app.use('/v1/api/admin', admin_1.default);
// app.use('/api/analytics', analyticsRoutes);
// Setup Socket.IO
(0, socket_1.setupSocketIO)(io);
// Start parent email scheduler (weekly reports)
// Enable in development for testing by setting ENABLE_EMAIL_SCHEDULER=true
if (config_1.default.nodeEnv === 'production' || process.env.ENABLE_EMAIL_SCHEDULER === 'true') {
    parentEmailScheduler_1.default.start();
    logger_1.logger.info('Parent email scheduler started (runs every Monday at 9:00 AM UTC)');
}
else {
    logger_1.logger.info('Parent email scheduler disabled (set ENABLE_EMAIL_SCHEDULER=true to enable)');
}
// Socket.IO connection status endpoint (for debugging)
app.get('/socket-status', (req, res) => {
    const connectedSockets = io.sockets.sockets.size;
    res.json({
        status: 'active',
        connectedClients: connectedSockets,
        transports: ['websocket', 'polling'],
        cors: {
            origin: config_1.default.frontendUrl,
            credentials: true,
        },
    });
});
// Error handling
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = config_1.default.port;
// Connect to MongoDB and start server (skip in test environment)
if (config_1.default.nodeEnv !== 'test') {
    database_1.default
        .connect()
        .then(() => {
        server.listen(PORT, () => {
            logger_1.logger.info('Server started successfully', {
                port: PORT,
                environment: config_1.default.nodeEnv,
                healthCheck: `http://localhost:${PORT}/health`,
                socketIO: `ws://localhost:${PORT}`,
                frontendUrl: config_1.default.frontendUrl,
            });
        });
    })
        .catch((error) => {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map