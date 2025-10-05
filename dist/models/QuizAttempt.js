"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizAttempt = void 0;
const mongoose_1 = require("mongoose");
const quizAttemptSchema = new mongoose_1.Schema({
    quizId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    completedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    timeSpent: {
        type: Number, // in seconds
        required: true,
        min: 0
    },
    answers: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: { createdAt: false, updatedAt: false }
});
// Compound indexes for efficient queries
quizAttemptSchema.index({ studentId: 1, completedAt: -1 });
quizAttemptSchema.index({ quizId: 1, completedAt: -1 });
quizAttemptSchema.index({ studentId: 1, quizId: 1, completedAt: -1 });
// Virtual to populate quiz details
quizAttemptSchema.virtual('quiz', {
    ref: 'Quiz',
    localField: 'quizId',
    foreignField: '_id',
    justOne: true
});
// Virtual to populate student details
quizAttemptSchema.virtual('student', {
    ref: 'User',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email'
});
// Static method to get student's quiz history
quizAttemptSchema.statics.getStudentHistory = function (studentId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.find({ studentId })
        .populate('quiz', 'title subject points')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit);
};
// Static method to get quiz statistics
quizAttemptSchema.statics.getQuizStats = function (quizId) {
    return this.aggregate([
        { $match: { quizId: new mongoose_1.Schema.Types.ObjectId(quizId) } },
        {
            $group: {
                _id: '$quizId',
                totalAttempts: { $sum: 1 },
                averageScore: { $avg: '$score' },
                maxScore: { $max: '$score' },
                minScore: { $min: '$score' },
                averageTime: { $avg: '$timeSpent' }
            }
        }
    ]);
};
// Static method to get student's best score for a quiz
quizAttemptSchema.statics.getBestScore = function (studentId, quizId) {
    return this.findOne({ studentId, quizId })
        .sort({ score: -1 })
        .select('score completedAt');
};
exports.QuizAttempt = (0, mongoose_1.model)('QuizAttempt', quizAttemptSchema);
//# sourceMappingURL=QuizAttempt.js.map