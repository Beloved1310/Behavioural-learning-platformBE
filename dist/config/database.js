"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("./index"));
const logger_1 = require("../utils/logger");
class Database {
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        // CRITICAL SAFETY CHECK: Prevent connection to real database during tests
        if (process.env.NODE_ENV === 'test') {
            throw new Error('CRITICAL: Database.connect() should NOT be called during tests! ' +
                'Tests must use the in-memory MongoDB setup from __tests__/helpers/setup.ts. ' +
                'If you see this error, check that your test is not importing or calling database.connect().');
        }
        try {
            const options = {
                autoIndex: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            };
            await mongoose_1.default.connect(index_1.default.database.url, options);
            mongoose_1.default.connection.on('connected', () => {
                logger_1.logger.info('MongoDB connected successfully');
            });
            mongoose_1.default.connection.on('error', (err) => {
                logger_1.logger.error('MongoDB connection error', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.logger.warn('MongoDB disconnected');
            });
            // Handle application termination
            process.on('SIGINT', async () => {
                await mongoose_1.default.connection.close();
                logger_1.logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to MongoDB', error);
            process.exit(1);
        }
    }
    async disconnect() {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB connection closed');
    }
}
const databaseInstance = Database.getInstance();
// Export convenience functions for testing
const connectDB = () => databaseInstance.connect();
exports.connectDB = connectDB;
const disconnectDB = () => databaseInstance.disconnect();
exports.disconnectDB = disconnectDB;
exports.default = databaseInstance;
//# sourceMappingURL=database.js.map