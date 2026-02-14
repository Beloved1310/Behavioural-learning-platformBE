"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectionEntry = void 0;
const mongoose_1 = require("mongoose");
const tutorFeedbackSchema = new mongoose_1.Schema({
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
    feedbackAt: {
        type: Date,
        default: Date.now,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { _id: false });
const reflectionEntrySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    prompt: {
        type: String,
        required: true,
        trim: true,
    },
    response: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'session'],
        required: true,
    },
    mood: {
        type: String,
        trim: true,
    },
    tutorFeedback: {
        type: tutorFeedbackSchema,
    },
}, {
    timestamps: true,
});
// Indexes
// For student's reflections sorted by date (most common query)
reflectionEntrySchema.index({ userId: 1, date: -1 });
// For filtering reflections by type and date
reflectionEntrySchema.index({ userId: 1, type: 1, date: -1 });
// For tutor's feedback queue (reflections awaiting feedback)
reflectionEntrySchema.index({ 'tutorFeedback.tutorId': 1 });
// For tutor's feedback queue sorted by date
reflectionEntrySchema.index({ 'tutorFeedback.tutorId': 1, date: -1 });
// For finding reflections without feedback (pending feedback queue)
reflectionEntrySchema.index({ userId: 1, tutorFeedback: 1, date: -1 });
exports.ReflectionEntry = (0, mongoose_1.model)('ReflectionEntry', reflectionEntrySchema);
//# sourceMappingURL=ReflectionEntry.js.map