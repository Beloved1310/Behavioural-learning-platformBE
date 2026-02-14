"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationRepository = void 0;
const mongoose_1 = require("mongoose");
const Recommendation_1 = require("../models/Recommendation");
const BaseRepository_1 = require("./BaseRepository");
class RecommendationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Recommendation_1.Recommendation);
    }
    async findForUser(userId, type, limit) {
        const filter = {
            userId: new mongoose_1.Types.ObjectId(userId),
            $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: { $exists: false } }],
        };
        if (type)
            filter.type = type;
        return this.find(filter, { sort: { priority: -1, generatedAt: -1 }, limit });
    }
    async markRead(id, userId) {
        return this.updateOne({ _id: new mongoose_1.Types.ObjectId(id), userId: new mongoose_1.Types.ObjectId(userId) }, { isRead: true });
    }
    async markActioned(id, userId) {
        return this.updateOne({ _id: new mongoose_1.Types.ObjectId(id), userId: new mongoose_1.Types.ObjectId(userId) }, { isActioned: true });
    }
}
exports.recommendationRepository = new RecommendationRepository();
exports.default = exports.recommendationRepository;
//# sourceMappingURL=RecommendationRepository.js.map