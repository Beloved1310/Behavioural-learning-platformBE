"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyAssessment = void 0;
const mongoose_1 = require("mongoose");
const tutorAssessmentFeedbackSchema = new mongoose_1.Schema({
    tutorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    encouragementLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    feedbackAt: {
        type: Date,
        default: Date.now,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { _id: false });
const weeklyAssessmentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    weekStart: {
        type: Date,
        required: true,
    },
    weekRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    whatWentWell: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    challenges: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    nextWeekFocus: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    commitmentLevel: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    tutorFeedback: {
        type: tutorAssessmentFeedbackSchema,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Indexes
// For student's assessments sorted by week
weeklyAssessmentSchema.index({ userId: 1, weekStart: -1 });
// For student's assessments sorted by completion date
weeklyAssessmentSchema.index({ userId: 1, completedAt: -1 });
// For tutor's feedback queue (assessments awaiting feedback)
weeklyAssessmentSchema.index({ 'tutorFeedback.tutorId': 1 });
// For tutor's feedback queue sorted by date
weeklyAssessmentSchema.index({ 'tutorFeedback.tutorId': 1, completedAt: -1 });
// For finding assessments without feedback (pending feedback queue)
weeklyAssessmentSchema.index({ userId: 1, tutorFeedback: 1, completedAt: -1 });
// Ensure one assessment per user per week (unique constraint)
weeklyAssessmentSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
exports.WeeklyAssessment = (0, mongoose_1.model)('WeeklyAssessment', weeklyAssessmentSchema);
//# sourceMappingURL=WeeklyAssessment.js.map