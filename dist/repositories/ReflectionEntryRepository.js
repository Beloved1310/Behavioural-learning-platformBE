"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRepository_1 = require("./BaseRepository");
const ReflectionEntry_1 = require("../models/ReflectionEntry");
const mongoose_1 = require("mongoose");
class ReflectionEntryRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(ReflectionEntry_1.ReflectionEntry);
    }
    async findByUser(userId, limit) {
        const options = { sort: { date: -1 } };
        if (limit) {
            options.limit = limit;
        }
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId) }, options);
    }
    async findByPeriod(userId, startDate, endDate) {
        return this.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate },
        }, { sort: { date: -1 } });
    }
    async findToday(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            date: { $gte: today, $lt: tomorrow },
            type: 'daily',
        });
    }
    async findByWeek(userId) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        return this.findByPeriod(userId, weekStart, now);
    }
    async getReflectionStreak(userId) {
        const reflections = await this.findByUser(userId, 30); // Check last 30 days
        if (reflections.length === 0)
            return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = new Set(reflections.map((r) => {
            const date = new Date(r.date);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        }));
        let checkDate = new Date(today);
        while (dates.has(checkDate.getTime())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return streak;
    }
    async addTutorFeedback(reflectionId, tutorId, comment) {
        const reflection = await this.findById(reflectionId);
        if (!reflection)
            return null;
        reflection.tutorFeedback = {
            tutorId: new mongoose_1.Types.ObjectId(tutorId),
            comment,
            feedbackAt: new Date(),
            isRead: false,
        };
        await reflection.save();
        return reflection;
    }
}
exports.default = new ReflectionEntryRepository();
//# sourceMappingURL=ReflectionEntryRepository.js.map