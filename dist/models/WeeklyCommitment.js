"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyCommitment = void 0;
const mongoose_1 = require("mongoose");
const commitmentItemSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    type: {
        type: String,
        enum: ['time', 'quizzes', 'sessions'],
        required: true,
    },
    target: {
        type: Number,
        required: true,
        min: 1,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
    },
}, { _id: false });
const weeklyCommitmentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    weekStart: {
        type: Date,
        required: true,
    },
    weekEnd: {
        type: Date,
        required: true,
    },
    commitments: {
        type: [commitmentItemSchema],
        required: true,
        validate: {
            validator: function (v) {
                return v.length > 0 && v.length <= 5; // 1-5 commitments per week
            },
            message: 'Must have between 1 and 5 commitments',
        },
    },
    assignedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes
// For student's commitments sorted by week
weeklyCommitmentSchema.index({ userId: 1, weekStart: -1 });
weeklyCommitmentSchema.index({ userId: 1, weekEnd: -1 });
// For tutor's assigned commitments
weeklyCommitmentSchema.index({ assignedBy: 1 });
// For tutor's assigned commitments sorted by week
weeklyCommitmentSchema.index({ assignedBy: 1, weekStart: -1 });
// Ensure one commitment per user per week (unique constraint)
weeklyCommitmentSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
exports.WeeklyCommitment = (0, mongoose_1.model)('WeeklyCommitment', weeklyCommitmentSchema);
//# sourceMappingURL=WeeklyCommitment.js.map