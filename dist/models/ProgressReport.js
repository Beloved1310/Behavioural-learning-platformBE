"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressReport = void 0;
const mongoose_1 = require("mongoose");
const progressReportSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    period: {
        type: String,
        enum: ['weekly', 'monthly'],
        required: true,
        index: true
    },
    startDate: {
        type: Date,
        required: true,
        index: true
    },
    endDate: {
        type: Date,
        required: true,
        index: true
    },
    totalStudyTime: {
        type: Number,
        required: true,
        min: 0 // in minutes
    },
    sessionsCompleted: {
        type: Number,
        required: true,
        min: 0
    },
    quizzesTaken: {
        type: Number,
        required: true,
        min: 0
    },
    averageScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    streakDays: {
        type: Number,
        required: true,
        min: 0
    },
    badgesEarned: {
        type: Number,
        required: true,
        min: 0
    },
    pointsEarned: {
        type: Number,
        required: true,
        min: 0
    },
    insights: [{
            type: String,
            maxlength: 500
        }],
    recommendations: [{
            type: String,
            maxlength: 500
        }],
    generatedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});
// Compound indexes for efficient queries
progressReportSchema.index({ studentId: 1, period: 1, startDate: -1 });
progressReportSchema.index({ studentId: 1, generatedAt: -1 });
// Virtual to populate student details
progressReportSchema.virtual('student', {
    ref: 'User',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email profileImage'
});
// Virtual for formatted study time
progressReportSchema.virtual('formattedStudyTime').get(function () {
    const hours = Math.floor(this.totalStudyTime / 60);
    const minutes = this.totalStudyTime % 60;
    return `${hours}h ${minutes}m`;
});
// Instance method to check if report is current
progressReportSchema.methods.isCurrent = function () {
    const now = new Date();
    return this.endDate >= now;
};
// Static method to get student's latest report
progressReportSchema.statics.getLatestReport = function (studentId, period) {
    return this.findOne({ studentId, period }).sort({ generatedAt: -1 });
};
// Static method to get student's report history
progressReportSchema.statics.getReportHistory = function (studentId, period, limit = 10) {
    return this.find({ studentId, period })
        .sort({ generatedAt: -1 })
        .limit(limit);
};
// Static method to generate insights based on data
progressReportSchema.statics.generateInsights = function (reportData) {
    const insights = [];
    if (reportData.averageScore > 85) {
        insights.push('Excellent performance! You\'re consistently scoring high on quizzes.');
    }
    else if (reportData.averageScore < 60) {
        insights.push('Consider reviewing the material more thoroughly before taking quizzes.');
    }
    if (reportData.streakDays > 7) {
        insights.push(`Great consistency! You've maintained a ${reportData.streakDays}-day learning streak.`);
    }
    if (reportData.sessionsCompleted === 0) {
        insights.push('Try booking some tutoring sessions to get personalized help.');
    }
    const studyTimeHours = reportData.totalStudyTime / 60;
    if (studyTimeHours < 5) {
        insights.push('Consider increasing your study time for better results.');
    }
    else if (studyTimeHours > 20) {
        insights.push('Great dedication! Remember to take breaks to avoid burnout.');
    }
    return insights;
};
// Static method to generate recommendations
progressReportSchema.statics.generateRecommendations = function (reportData) {
    const recommendations = [];
    if (reportData.averageScore < 70) {
        recommendations.push('Focus on understanding concepts rather than memorizing facts.');
        recommendations.push('Try taking practice quizzes to identify weak areas.');
    }
    if (reportData.sessionsCompleted < 2) {
        recommendations.push('Book regular tutoring sessions for personalized guidance.');
    }
    if (reportData.streakDays < 5) {
        recommendations.push('Try to study a little bit every day to build consistency.');
    }
    recommendations.push('Set specific learning goals for the next period.');
    recommendations.push('Review your progress regularly to stay motivated.');
    return recommendations;
};
exports.ProgressReport = (0, mongoose_1.model)('ProgressReport', progressReportSchema);
//# sourceMappingURL=ProgressReport.js.map