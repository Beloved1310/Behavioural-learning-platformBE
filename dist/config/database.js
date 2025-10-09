"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("./index"));
class Database {
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
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
                console.log('✅ MongoDB connected successfully');
            });
            mongoose_1.default.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
            });
            // Handle application termination
            process.on('SIGINT', async () => {
                await mongoose_1.default.connection.close();
                console.log('📴 MongoDB connection closed through app termination');
                process.exit(0);
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    }
    async disconnect() {
        await mongoose_1.default.connection.close();
    }
}
exports.default = Database.getInstance();
//# sourceMappingURL=database.js.map