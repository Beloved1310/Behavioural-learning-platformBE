"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Goal = void 0;
const mongoose_1 = require("mongoose");
const goalSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    target: {
        type: Number,
        required: true,
        min: 1,
    },
    current: {
        type: Number,
        default: 0,
        min: 0,
    },
    deadline: {
        type: Date,
    },
    milestones: {
        type: [Number],
        default: [25, 50, 75, 100], // Default milestones at 25%, 50%, 75%, 100%
    },
    achievedMilestones: {
        type: [Number],
        default: [],
    },
    assignedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['active', 'pending_approval', 'rejected'],
        default: 'active', // Tutor-assigned goals are active, student-initiated need approval
    },
    tutorFeedback: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes
// For student's active goals (most common query)
goalSchema.index({ userId: 1, isActive: 1 });
// For student's goals sorted by creation date
goalSchema.index({ userId: 1, createdAt: -1 });
// For tutor's assigned goals
goalSchema.index({ assignedBy: 1 });
// Compound index for active goals with status (for filtering active vs pending)
goalSchema.index({ userId: 1, isActive: 1, status: 1 });
// For tutor's pending approval queue (tutor-centric feature)
goalSchema.index({ assignedBy: 1, status: 1 });
// For student's pending goals awaiting approval
goalSchema.index({ userId: 1, status: 1, createdAt: -1 });
exports.Goal = (0, mongoose_1.model)('Goal', goalSchema);
//# sourceMappingURL=Goal.js.map