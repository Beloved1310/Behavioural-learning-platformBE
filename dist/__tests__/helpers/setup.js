"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
let mongoServer;
/**
 * MongoDB Test Setup
 *
 * This setup ensures that ALL tests use an in-memory MongoDB instance
 * and NEVER connect to the primary database.
 *
 * Safety measures:
 * 1. Sets NODE_ENV=test to prevent real DB connections
 * 2. Uses MongoDB Memory Server for all tests
 * 3. Clears collections between tests
 * 4. Ensures proper cleanup after all tests
 */
// CRITICAL: Ensure we're in test environment
if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
}
// CRITICAL: Override DATABASE_URL to prevent accidental real DB connection
// This is a safety measure - even if someone sets DATABASE_URL, tests won't use it
const originalDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
// Setup before all tests
beforeAll(async () => {
    // Safety check: Ensure we're in test mode
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('CRITICAL: Tests must run with NODE_ENV=test. ' +
            'This prevents accidental connection to the primary database!');
    }
    // Disconnect any existing connections first
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
    // Create in-memory MongoDB instance with stable configuration
    try {
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create({
            instance: {
                dbName: 'test_db',
            },
            // Let MongoDB Memory Server use its default version (most stable)
        });
        const mongoUri = mongoServer.getUri();
        // Verify we're using the in-memory server (not the real DB)
        // MongoDB Memory Server typically uses mongodb://127.0.0.1:XXXXX/...
        if (!mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
            console.warn(`Warning: MongoDB URI might not be in-memory: ${mongoUri.substring(0, 50)}...`);
        }
        // Connect to the in-memory database
        await mongoose_1.default.connect(mongoUri, {
            autoIndex: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000, // Increased timeout
            socketTimeoutMS: 45000,
            bufferCommands: false,
            connectTimeoutMS: 10000, // Add connection timeout
        });
        // Verify connection
        if (mongoose_1.default.connection.readyState !== 1) {
            throw new Error('Failed to connect to in-memory MongoDB');
        }
        console.log('✅ Connected to in-memory MongoDB for testing');
    }
    catch (error) {
        console.error('Failed to setup in-memory MongoDB:', error);
        throw error;
    }
});
// Cleanup after all tests
afterAll(async () => {
    try {
        // Disconnect from MongoDB
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            console.log('✅ Disconnected from in-memory MongoDB');
        }
    }
    catch (error) {
        console.warn('Warning: Error disconnecting from MongoDB:', error);
    }
    try {
        // Stop the in-memory server
        if (mongoServer) {
            await mongoServer.stop();
            console.log('✅ Stopped in-memory MongoDB server');
        }
    }
    catch (error) {
        console.warn('Warning: Error stopping MongoDB Memory Server:', error);
    }
    // Restore original DATABASE_URL if it existed (for other processes)
    if (originalDatabaseUrl) {
        process.env.DATABASE_URL = originalDatabaseUrl;
    }
});
// Clear all collections after each test
afterEach(async () => {
    // Only clear if connected
    if (mongoose_1.default.connection.readyState === 1) {
        const collections = mongoose_1.default.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            try {
                await collection.deleteMany({});
            }
            catch (error) {
                // Ignore errors during cleanup (collection might not exist)
                console.warn(`Warning: Failed to clear collection ${key}:`, error);
            }
        }
    }
});
//# sourceMappingURL=setup.js.map