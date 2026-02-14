import mongoose from 'mongoose';
import config from './index';
import { logger } from '../utils/logger';

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    // CRITICAL SAFETY CHECK: Prevent connection to real database during tests
    if (process.env.NODE_ENV === 'test') {
      throw new Error(
        'CRITICAL: Database.connect() should NOT be called during tests! ' +
          'Tests must use the in-memory MongoDB setup from __tests__/helpers/setup.ts. ' +
          'If you see this error, check that your test is not importing or calling database.connect().'
      );
    }

    try {
      const options = {
        autoIndex: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      await mongoose.connect(config.database.url, options);

      mongoose.connection.on('connected', () => {
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
}

const databaseInstance = Database.getInstance();

// Export convenience functions for testing
export const connectDB = () => databaseInstance.connect();
export const disconnectDB = () => databaseInstance.disconnect();

export default databaseInstance;
