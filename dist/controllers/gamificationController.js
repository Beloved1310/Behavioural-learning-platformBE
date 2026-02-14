"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const gamificationService_1 = require("../services/gamificationService");
const socket_1 = require("../socket");
const socket_2 = require("../socket");
const pagination_1 = require("../utils/pagination");
class GamificationController {
}
exports.GamificationController = GamificationController;
_a = GamificationController;
GamificationController.createQuiz = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Only tutors and admins can create quizzes
    if (req.user.role !== 'TUTOR' && req.user.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Only tutors and admins can create quizzes', 403);
    }
    const quiz = await gamificationService_1.GamificationService.createQuiz(req.body);
    res.status(201).json({ quiz });
});
GamificationController.getQuizzes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { subject, difficulty } = req.query;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    const result = await gamificationService_1.GamificationService.getQuizzes({ subject, difficulty, page, limit, skip });
    const paginationResult = (0, pagination_1.createPaginationResult)(result.quizzes, result.total, page, limit);
    res.json({
        success: true,
        data: {
            quizzes: paginationResult.data,
            pagination: paginationResult.pagination,
        },
    });
});
GamificationController.getQuizById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const quiz = await gamificationService_1.GamificationService.getQuizById(id);
    res.json({ quiz });
});
GamificationController.submitQuizAttempt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { quizId, answers, timeSpent } = req.body;
    const userId = req.user.id;
    const result = await gamificationService_1.GamificationService.submitQuizAttempt(userId, {
        quizId,
        answers,
        timeSpent,
    });
    // Send notifications for newly earned badges
    const io = (0, socket_2.getIO)();
    if (io && result.newBadges && result.newBadges.length > 0) {
        for (const badge of result.newBadges) {
            await (0, socket_1.sendNotificationToUser)(io, userId, {
                type: 'badge_earned',
                title: '🏆 Badge Earned!',
                message: `Congratulations! You earned the "${badge.badge.name}" badge!`,
                data: {
                    badgeId: badge.badge.id,
                    badgeName: badge.badge.name,
                    badgeIcon: badge.badge.icon,
                },
            });
        }
    }
    res.status(201).json({
        success: true,
        data: {
            attempt: {
                id: result.attempt._id.toString(),
                quizId: result.attempt.quizId.toString(),
                score: result.attempt.score,
                totalPoints: result.attempt.totalPoints,
                percentage: result.attempt.percentage,
                completedAt: result.attempt.completedAt,
                timeSpent: result.attempt.timeSpent,
            },
            newBadges: result.newBadges,
            pointsEarned: result.pointsEarned,
        },
    });
});
GamificationController.getRecentAttempts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    const result = await gamificationService_1.GamificationService.getRecentAttempts(userId, limit, skip);
    const paginationResult = (0, pagination_1.createPaginationResult)(result.attempts, result.total, page, limit);
    res.json({
        success: true,
        attempts: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
GamificationController.getUserProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const profile = await gamificationService_1.GamificationService.getUserProfile(userId);
    res.json({ profile });
});
GamificationController.getUserProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const progress = await gamificationService_1.GamificationService.getUserProgress(userId);
    res.json({
        success: true,
        data: progress,
    });
});
GamificationController.getAvailableBadges = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const badges = await gamificationService_1.GamificationService.getAvailableBadges();
    res.json({ badges });
});
GamificationController.getLeaderboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || 'all';
    const userId = req.user?.id;
    const data = await gamificationService_1.GamificationService.getLeaderboard(userId, limit, timeframe);
    res.json(data);
});
GamificationController.getQuizAttempts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { studentId } = req.query;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 50, 200);
    if (userRole === 'PARENT') {
        // Parents can view their children's quiz attempts
        const result = await gamificationService_1.GamificationService.getChildrenQuizAttempts(userId, studentId, page, limit, skip);
        const paginationResult = (0, pagination_1.createPaginationResult)(result.attempts, result.total, page, limit);
        res.json({
            success: true,
            attempts: paginationResult.data,
            pagination: paginationResult.pagination,
        });
    }
    else if (userRole === 'STUDENT') {
        // Students can view their own attempts
        const result = await gamificationService_1.GamificationService.getRecentAttempts(userId, limit, skip);
        const paginationResult = (0, pagination_1.createPaginationResult)(result.attempts, result.total, page, limit);
        res.json({
            success: true,
            attempts: paginationResult.data,
            pagination: paginationResult.pagination,
        });
    }
    else {
        throw new errorHandler_1.AppError('Unauthorized', 403);
    }
});
//# sourceMappingURL=gamificationController.js.map