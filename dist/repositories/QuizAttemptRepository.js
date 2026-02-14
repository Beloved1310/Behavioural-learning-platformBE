"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizAttemptRepository = void 0;
const mongoose_1 = require("mongoose");
const QuizAttempt_1 = require("../models/QuizAttempt");
const BaseRepository_1 = require("./BaseRepository");
class QuizAttemptRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(QuizAttempt_1.QuizAttempt);
    }
    async aggregateStats(userId, startDate) {
        return QuizAttempt_1.QuizAttempt.aggregate([
            { $match: { studentId: new mongoose_1.Types.ObjectId(userId), completedAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalQuizzes: { $sum: 1 },
                    averageScore: { $avg: '$percentage' },
                    totalTimeSpent: { $sum: '$timeSpent' },
                },
            },
        ]);
    }
}
exports.quizAttemptRepository = new QuizAttemptRepository();
exports.default = exports.quizAttemptRepository;
//# sourceMappingURL=QuizAttemptRepository.js.map