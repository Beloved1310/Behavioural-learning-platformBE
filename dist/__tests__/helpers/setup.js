"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
let mongoServer;
// Setup before all tests
beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    // Connect to the in-memory database
    await mongoose_1.default.connect(mongoUri);
});
// Cleanup after all tests
afterAll(async () => {
    // Disconnect and stop MongoDB
    await mongoose_1.default.disconnect();
    await mongoServer.stop();
});
// Clear all collections after each test
afterEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
//# sourceMappingURL=setup.js.map