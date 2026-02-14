"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitmentsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const WeeklyCommitmentRepository_1 = __importDefault(require("../repositories/WeeklyCommitmentRepository"));
const mongoose_1 = require("mongoose");
const pagination_1 = require("../utils/pagination");
class CommitmentsController {
}
exports.CommitmentsController = CommitmentsController;
_a = CommitmentsController;
// Get current week's commitments
CommitmentsController.getCurrentCommitments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const commitment = await WeeklyCommitmentRepository_1.default.findCurrentWeek(userId);
    if (!commitment) {
        return res.json({
            success: true,
            commitment: null,
            completionRate: 0,
        });
    }
    const commitments = commitment.commitments || [];
    const completed = commitments.filter((c) => c.completed).length;
    const completionRate = commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;
    res.json({
        success: true,
        commitment: {
            id: commitment._id.toString(),
            weekStart: commitment.weekStart,
            weekEnd: commitment.weekEnd,
            commitments: commitments.map((c) => ({
                text: c.text,
                type: c.type,
                target: c.target,
                completed: c.completed,
                completedAt: c.completedAt,
            })),
            assignedBy: commitment.assignedBy
                ? commitment.assignedBy.toString()
                : null,
        },
        completionRate,
    });
});
// Create weekly commitments
CommitmentsController.createCommitments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { commitments } = req.body;
    if (!commitments || !Array.isArray(commitments) || commitments.length === 0) {
        throw new errorHandler_1.AppError('Commitments array is required', 400);
    }
    if (commitments.length > 5) {
        throw new errorHandler_1.AppError('Maximum 5 commitments per week', 400);
    }
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    // Check if commitment already exists for this week
    const existing = await WeeklyCommitmentRepository_1.default.findCurrentWeek(userId);
    if (existing) {
        throw new errorHandler_1.AppError('Commitments already set for this week', 400);
    }
    const commitment = await WeeklyCommitmentRepository_1.default.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        weekStart,
        weekEnd,
        commitments: commitments.map((c) => ({
            text: c.text,
            type: c.type || 'time',
            target: parseInt(c.target) || 0,
            completed: false,
        })),
    });
    res.status(201).json({
        success: true,
        commitment: {
            id: commitment._id.toString(),
            weekStart: commitment.weekStart,
            weekEnd: commitment.weekEnd,
            commitments: commitment.commitments,
        },
    });
});
// Toggle commitment completion
CommitmentsController.toggleCommitment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { commitmentId, itemIndex } = req.params;
    const commitment = await WeeklyCommitmentRepository_1.default.findById(commitmentId);
    if (!commitment) {
        throw new errorHandler_1.AppError('Commitment not found', 404);
    }
    if (commitment.userId.toString() !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    const updated = await WeeklyCommitmentRepository_1.default.toggleCommitment(commitmentId, parseInt(itemIndex));
    const commitments = updated.commitments || [];
    const completed = commitments.filter((c) => c.completed).length;
    const completionRate = commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;
    res.json({
        success: true,
        commitment: {
            id: updated._id.toString(),
            commitments: commitments.map((c) => ({
                text: c.text,
                type: c.type,
                target: c.target,
                completed: c.completed,
                completedAt: c.completedAt,
            })),
        },
        completionRate,
    });
});
// Get commitment history
CommitmentsController.getHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    const allCommitments = await WeeklyCommitmentRepository_1.default.findByUser(userId);
    const total = allCommitments.length;
    const paginatedCommitments = allCommitments.slice(skip, skip + limit);
    const history = paginatedCommitments.map((commitment) => {
        const commitments = commitment.commitments || [];
        const completed = commitments.filter((c) => c.completed).length;
        const completionRate = commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;
        return {
            id: commitment._id.toString(),
            weekStart: commitment.weekStart,
            weekEnd: commitment.weekEnd,
            completionRate,
            totalCommitments: commitments.length,
            completedCommitments: completed,
        };
    });
    const paginationResult = (0, pagination_1.createPaginationResult)(history, total, page, limit);
    res.json({
        success: true,
        history: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Delete a commitment
CommitmentsController.deleteCommitment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { commitmentId } = req.params;
    const commitment = await WeeklyCommitmentRepository_1.default.findById(commitmentId);
    if (!commitment) {
        throw new errorHandler_1.AppError('Commitment not found', 404);
    }
    if (commitment.userId.toString() !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    await WeeklyCommitmentRepository_1.default.deleteById(commitmentId);
    res.json({ success: true, message: 'Commitment deleted successfully' });
});
//# sourceMappingURL=commitmentsController.js.map