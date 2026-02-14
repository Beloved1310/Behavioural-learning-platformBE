"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRepository = void 0;
const mongoose_1 = require("mongoose");
const Subscription_1 = __importDefault(require("../models/Subscription"));
const BaseRepository_1 = require("./BaseRepository");
class SubscriptionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Subscription_1.default);
    }
    async findActiveByUserId(userId) {
        return Subscription_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId), status: 'active' });
    }
    async findByUserId(userId) {
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId) });
    }
}
exports.subscriptionRepository = new SubscriptionRepository();
exports.default = exports.subscriptionRepository;
//# sourceMappingURL=SubscriptionRepository.js.map