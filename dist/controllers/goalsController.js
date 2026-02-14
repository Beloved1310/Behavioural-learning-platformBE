"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
const mongoose_1 = require("mongoose");
const QuizAttemptRepository_1 = __importDefault(require("../repositories/QuizAttemptRepository"));
const SessionRepository_1 = __importDefault(require("../repositories/SessionRepository"));
const pagination_1 = require("../utils/pagination");
class GoalsController {
}
exports.GoalsController = GoalsController;
_a = GoalsController;
// Get all goals for current user
GoalsController.getGoals = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    // Get all goals first (repository doesn't support pagination directly)
    const allGoals = await GoalRepository_1.default.findByUser(userId, true);
    const total = allGoals.length;
    // Apply pagination
    const paginatedGoals = allGoals.slice(skip, skip + limit);
    const transformed = paginatedGoals.map((goal) => ({
        id: goal._id.toString(),
        title: goal.title,
        description: goal.description,
        target: goal.target,
        current: goal.current,
        deadline: goal.deadline,
        milestones: goal.milestones || [],
        achievedMilestones: goal.achievedMilestones || [],
        assignedBy: goal.assignedBy ? goal.assignedBy.toString() : null,
        assignedAt: goal.assignedAt,
        status: goal.status || 'active',
        tutorFeedback: goal.tutorFeedback,
        isActive: goal.isActive,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
    }));
    const paginationResult = (0, pagination_1.createPaginationResult)(transformed, total, page, limit);
    res.json({
        success: true,
        goals: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Create a new goal
GoalsController.createGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { title, description, target, deadline, milestones } = req.body;
    if (!title || !target) {
        throw new errorHandler_1.AppError('Title and target are required', 400);
    }
    // Student-initiated goals need tutor approval
    const goal = await GoalRepository_1.default.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        title,
        description,
        target: parseInt(target),
        current: 0,
        deadline: deadline ? new Date(deadline) : undefined,
        milestones: milestones || [25, 50, 75, 100],
        achievedMilestones: [],
        status: 'pending_approval', // Student-initiated goals need approval
        isActive: true,
    });
    res.status(201).json({
        success: true,
        goal: {
            id: goal._id.toString(),
            title: goal.title,
            description: goal.description,
            target: goal.target,
            current: goal.current,
            deadline: goal.deadline,
            milestones: goal.milestones,
            achievedMilestones: goal.achievedMilestones,
        },
    });
});
// Update goal progress (auto-calculated)
GoalsController.updateProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { goalId } = req.params;
    const goal = await GoalRepository_1.default.findById(goalId);
    if (!goal) {
        throw new errorHandler_1.AppError('Goal not found', 404);
    }
    if (goal.userId.toString() !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    // Calculate current progress based on quizzes and sessions
    const [quizzes, sessions] = await Promise.all([
        QuizAttemptRepository_1.default.find({ studentId: new mongoose_1.Types.ObjectId(userId) }),
        SessionRepository_1.default.find({ studentId: new mongoose_1.Types.ObjectId(userId), status: 'completed' }),
    ]);
    const current = quizzes.length + sessions.length;
    const updatedGoal = await GoalRepository_1.default.updateProgress(goalId, current);
    res.json({
        success: true,
        goal: {
            id: updatedGoal._id.toString(),
            current: updatedGoal.current,
            achievedMilestones: updatedGoal.achievedMilestones,
        },
    });
});
// Get upcoming milestones for a goal
GoalsController.getMilestones = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { goalId } = req.params;
    const goal = await GoalRepository_1.default.findById(goalId);
    if (!goal) {
        throw new errorHandler_1.AppError('Goal not found', 404);
    }
    const progressPercent = (goal.current / goal.target) * 100;
    const milestones = goal.milestones || [];
    const achievedMilestones = goal.achievedMilestones || [];
    const upcoming = milestones
        .filter((m) => progressPercent < m && !achievedMilestones.includes(m))
        .sort((a, b) => a - b);
    res.json({
        success: true,
        milestones: {
            current: goal.current,
            target: goal.target,
            progressPercent: Math.round(progressPercent),
            upcoming,
            achieved: achievedMilestones,
        },
    });
});
// Delete a goal
GoalsController.deleteGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { goalId } = req.params;
    const goal = await GoalRepository_1.default.findById(goalId);
    if (!goal) {
        throw new errorHandler_1.AppError('Goal not found', 404);
    }
    if (goal.userId.toString() !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    await GoalRepository_1.default.deleteById(goalId);
    res.json({ success: true, message: 'Goal deleted successfully' });
});
//# sourceMappingURL=goalsController.js.map