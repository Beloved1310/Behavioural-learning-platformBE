import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import config from './config';
import database from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSocketIO } from './socket';

// Routes (will be created)
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import sessionRoutes from './routes/sessions';
// import chatRoutes from './routes/chat';
// import quizRoutes from './routes/quizzes';
// import gamificationRoutes from './routes/gamification';
// import paymentRoutes from './routes/payments';
// import analyticsRoutes from './routes/analytics';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
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
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api', (req, res) => {
  res.json({ message: 'Behavioral Learning Platform API' });
});

// Routes
import authRoutes from './routes/auth';

app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/sessions', sessionRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/quizzes', quizRoutes);
// app.use('/api/gamification', gamificationRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/analytics', analyticsRoutes);

// Setup Socket.IO
setupSocketIO(io);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

// Connect to MongoDB and start server
database.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});