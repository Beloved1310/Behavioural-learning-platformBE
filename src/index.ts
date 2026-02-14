import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import database from './config/database';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSocketIO } from './socket';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import gamificationRoutes from './routes/gamification';
import chatRoutes from './routes/chat';
import sessionsRoutes from './routes/sessions';
import userRoutes from './routes/users';
import preferencesRoutes from './routes/preferences';
import behavioralRoutes from './routes/behavioral';
import notificationRoutes from './routes/notifications';
import parentReportsRoutes from './routes/parentReports';
import goalsRoutes from './routes/goals';
import commitmentsRoutes from './routes/commitments';
import reflectionsRoutes from './routes/reflections';
import assessmentsRoutes from './routes/assessments';
import habitsRoutes from './routes/habits';
import milestonesRoutes from './routes/milestones';
import tutorRoutes from './routes/tutor';
import adminRoutes from './routes/admin';
import parentEmailScheduler from './services/parentEmailScheduler';

// Routes (will be created)
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import sessionRoutes from './routes/sessions';
// import chatRoutes from './routes/chat';
// import quizRoutes from './routes/quizzes';
// import gamificationRoutes from './routes/gamification';
// // import analyticsRoutes from './routes/analytics';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization'],
  },
  transports: ['websocket', 'polling'], // Enable both transports
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.nodeEnv === 'development' ? 1000 : config.rateLimit.maxRequests, // 1000 requests in dev, 100 in production
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
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Behavioral Learning Platform API Documentation',
  customfavIcon: '/favicon.ico',
}));

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Test endpoint to manually trigger parent email scheduler (development only)
// Must be defined BEFORE other routes to avoid authentication middleware
app.post('/v1/api/test/trigger-parent-emails', async (req, res) => {
  // Only allow in development or if explicitly enabled
  if (config.nodeEnv === 'production' && process.env.ALLOW_TEST_EMAIL_TRIGGER !== 'true') {
    return res.status(403).json({
      success: false,
      message:
        'This endpoint is only available in development or when ALLOW_TEST_EMAIL_TRIGGER=true',
    });
  }

  try {
    logger.info('Manually triggering weekly parent email reports');
    await parentEmailScheduler.triggerWeeklyReports();

    res.json({
      success: true,
      message:
        'Weekly parent email reports triggered successfully. Check server logs and parent email inboxes.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error triggering weekly reports', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger weekly reports',
      error: error.message,
    });
  }
});


app.use('/v1/api/auth', authRoutes);
app.use('/v1/api/gamification', gamificationRoutes);
app.use('/v1/api/chat', chatRoutes);
app.use('/v1/api', sessionsRoutes);
app.use('/v1/api/users', userRoutes);
// app.use('/v1/api/payments', paymentRoutes); // Removed from MVP - payment not needed
app.use('/v1/api/preferences', preferencesRoutes);
app.use('/v1/api/behavioral', behavioralRoutes);
app.use('/v1/api/notifications', notificationRoutes);
app.use('/v1/api/parent-reports', parentReportsRoutes);
app.use('/v1/api/goals', goalsRoutes);
app.use('/v1/api/commitments', commitmentsRoutes);
app.use('/v1/api/reflections', reflectionsRoutes);
app.use('/v1/api/assessments', assessmentsRoutes);
app.use('/v1/api/habits', habitsRoutes);
app.use('/v1/api/milestones', milestonesRoutes);
app.use('/v1/api/tutor', tutorRoutes);
app.use('/v1/api/admin', adminRoutes);

// app.use('/api/analytics', analyticsRoutes);

// Setup Socket.IO
setupSocketIO(io);

// Start parent email scheduler (weekly reports)
// Enable in development for testing by setting ENABLE_EMAIL_SCHEDULER=true
if (config.nodeEnv === 'production' || process.env.ENABLE_EMAIL_SCHEDULER === 'true') {
  parentEmailScheduler.start();
  logger.info('Parent email scheduler started (runs every Monday at 9:00 AM UTC)');
} else {
  logger.info('Parent email scheduler disabled (set ENABLE_EMAIL_SCHEDULER=true to enable)');
}

// Socket.IO connection status endpoint (for debugging)
app.get('/socket-status', (req, res) => {
  const connectedSockets = io.sockets.sockets.size;
  res.json({
    status: 'active',
    connectedClients: connectedSockets,
    transports: ['websocket', 'polling'],
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

// Export app for testing
export { app };

// Connect to MongoDB and start server (skip in test environment)
if (config.nodeEnv !== 'test') {
  database
    .connect()
    .then(() => {
      server.listen(PORT, () => {
        logger.info('Server started successfully', {
          port: PORT,
          environment: config.nodeEnv,
          healthCheck: `http://localhost:${PORT}/health`,
          socketIO: `ws://localhost:${PORT}`,
          frontendUrl: config.frontendUrl,
        });
      });
    })
    .catch((error) => {
      logger.error('Failed to start server', error);
      process.exit(1);
    });
}
