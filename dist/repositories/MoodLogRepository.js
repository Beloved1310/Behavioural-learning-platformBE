"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moodLogRepository = void 0;
const mongoose_1 = require("mongoose");
const MoodLog_1 = require("../models/MoodLog");
const BaseRepository_1 = require("./BaseRepository");
class MoodLogRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(MoodLog_1.MoodLog);
    }
    async createLog(data) {
        return this.create(data);
    }
    async findSince(userId, startDate, limit) {
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId), timestamp: { $gte: startDate } }, { sort: { timestamp: -1 }, limit });
    }
    async getDistribution(userId, days) {
        return MoodLog_1.MoodLog.getMoodDistribution(userId, days);
    }
    async getTrends(userId, days) {
        return MoodLog_1.MoodLog.getMoodTrends(userId, days);
    }
}
exports.moodLogRepository = new MoodLogRepository();
exports.default = exports.moodLogRepository;
//# sourceMappingURL=MoodLogRepository.js.map