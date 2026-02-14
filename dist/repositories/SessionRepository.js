"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = void 0;
const mongoose_1 = require("mongoose");
const Session_1 = require("../models/Session");
const BaseRepository_1 = require("./BaseRepository");
class SessionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Session_1.Session);
    }
    async aggregateStudyStats(userId, startDate) {
        return Session_1.Session.aggregate([
            { $match: { studentId: new mongoose_1.Types.ObjectId(userId), scheduledAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    totalDuration: { $sum: '$duration' },
                },
            },
        ]);
    }
    async dailyPattern(userId, startDate) {
        return Session_1.Session.aggregate([
            {
                $match: {
                    studentId: new mongoose_1.Types.ObjectId(userId),
                    scheduledAt: { $gte: startDate },
                    status: 'completed',
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
                    sessionCount: { $sum: 1 },
                    totalMinutes: { $sum: '$duration' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    }
    async weeklyPattern(userId, startDate) {
        return Session_1.Session.aggregate([
            {
                $match: {
                    studentId: new mongoose_1.Types.ObjectId(userId),
                    scheduledAt: { $gte: startDate },
                    status: 'completed',
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$scheduledAt' },
                    sessionCount: { $sum: 1 },
                    avgDuration: { $avg: '$duration' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    }
}
exports.sessionRepository = new SessionRepository();
exports.default = exports.sessionRepository;
//# sourceMappingURL=SessionRepository.js.map