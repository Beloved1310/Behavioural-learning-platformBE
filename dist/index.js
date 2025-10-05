"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = __importDefault(require("./config"));
const database_1 = __importDefault(require("./config/database"));
const errorHandler_1 = require("./middleware/errorHandler");
const socket_1 = require("./socket");
// Routes (will be created)
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import sessionRoutes from './routes/sessions';
// import chatRoutes from './routes/chat';
// import quizRoutes from './routes/quizzes';
// import gamificationRoutes from './routes/gamification';
// import paymentRoutes from './routes/payments';
// import analyticsRoutes from './routes/analytics';
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: config_1.default.frontendUrl,
        methods: ['GET', 'POST']
    }
});
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.default.frontendUrl,
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimit.windowMs,
    max: config_1.default.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.'
});
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
        environment: config_1.default.nodeEnv
    });
});
// API routes
app.use('/api', (req, res) => {
    res.json({ message: 'Behavioral Learning Platform API' });
});
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
app.use('/api/auth', auth_1.default);
// app.use('/api/users', userRoutes);
// app.use('/api/sessions', sessionRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/quizzes', quizRoutes);
// app.use('/api/gamification', gamificationRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/analytics', analyticsRoutes);
// Setup Socket.IO
(0, socket_1.setupSocketIO)(io);
// Error handling
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = config_1.default.port;
// Connect to MongoDB and start server
database_1.default.connect().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} in ${config_1.default.nodeEnv} mode`);
        console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    });
}).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map