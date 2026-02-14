"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const mongoose_1 = require("mongoose");
const QuizRepository_1 = __importDefault(require("../repositories/QuizRepository"));
const QuizAttemptRepository_1 = __importDefault(require("../repositories/QuizAttemptRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const UserProgressRepository_1 = __importDefault(require("../repositories/UserProgressRepository"));
const BadgeRepository_1 = __importDefault(require("../repositories/BadgeRepository"));
const UserBadgeRepository_1 = __importDefault(require("../repositories/UserBadgeRepository"));
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
const SessionRepository_1 = __importDefault(require("../repositories/SessionRepository"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class GamificationService {
    /**
     * Normalize subject name from alias to canonical form
     * e.g., "Math" -> "Mathematics", "CS" -> "Computer Science"
     */
    static normalizeSubject(subject) {
        const subjectMap = {
            'Math': 'Mathematics',
            'math': 'Mathematics',
            'MATH': 'Mathematics',
            'CS': 'Computer Science',
            'cs': 'Computer Science',
            'Chem': 'Chemistry',
            'Bio': 'Biology',
            'Geo': 'Geography',
            'ENG': 'English',
            'SCI': 'Science',
        };
        return subjectMap[subject] || subject;
    }
    static async createQuiz(data) {
        // Normalize subject name (e.g., "Math" -> "Mathematics") before saving
        const normalizedSubject = GamificationService.normalizeSubject(data.subject);
        const quiz = await QuizRepository_1.default.create({
            title: data.title,
            subject: normalizedSubject,
            description: data.description,
            difficulty: data.difficulty,
            timeLimit: data.timeLimit,
            passingScore: data.passingScore,
            points: data.points,
            isActive: data.isActive !== undefined ? data.isActive : true,
            questions: data.questions.map((q, index) => ({
                type: q.type || 'multiple_choice',
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                points: q.points || 1,
                order: q.order || index + 1,
            })),
        });
        return {
            id: quiz._id.toString(),
            title: quiz.title,
            subject: quiz.subject,
            difficulty: quiz.difficulty,
            description: quiz.description,
            timeLimit: quiz.timeLimit || 0,
            questionCount: quiz.questions.length,
            totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
            passingScore: quiz.passingScore,
            isActive: quiz.isActive,
            createdAt: quiz.createdAt,
        };
    }
    static async getQuizzes(filters) {
        const filter = {};
        // Handle subject filtering with aliases (e.g., "Math" -> "Mathematics")
        if (filters.subject) {
            const subjectAliases = {
                'Mathematics': ['Mathematics', 'Math', 'math', 'MATH'],
                'English': ['English', 'english', 'ENG'],
                'Science': ['Science', 'science', 'SCI'],
                'Physics': ['Physics', 'physics'],
                'Chemistry': ['Chemistry', 'chemistry', 'Chem'],
                'Biology': ['Biology', 'biology', 'Bio'],
                'History': ['History', 'history'],
                'Geography': ['Geography', 'geography', 'Geo'],
                'Computer Science': ['Computer Science', 'CS', 'cs', 'computer science'],
                'Art': ['Art', 'art'],
                'Music': ['Music', 'music'],
                'Spanish': ['Spanish', 'spanish'],
                'French': ['French', 'french'],
                'German': ['German', 'german'],
            };
            // Find the canonical subject name or use the provided subject
            let canonicalSubject = filters.subject;
            for (const [canonical, aliases] of Object.entries(subjectAliases)) {
                if (aliases.includes(filters.subject)) {
                    canonicalSubject = canonical;
                    break;
                }
            }
            // If we found a canonical subject, search for all its aliases
            // Otherwise, do a case-insensitive search for the provided subject
            if (subjectAliases[canonicalSubject]) {
                filter.subject = { $in: subjectAliases[canonicalSubject] };
            }
            else {
                // Case-insensitive search for exact match
                filter.subject = { $regex: new RegExp(`^${filters.subject}$`, 'i') };
            }
        }
        if (filters.difficulty)
            filter.difficulty = filters.difficulty;
        // Get total count
        const total = await QuizRepository_1.default.model.countDocuments({ ...filter, isActive: true });
        // Get paginated quizzes
        let query = QuizRepository_1.default.model.find({ ...filter, isActive: true });
        if (filters.skip !== undefined)
            query = query.skip(filters.skip);
        if (filters.limit !== undefined)
            query = query.limit(filters.limit);
        const quizzes = await query.sort({ createdAt: -1 });
        const transformedQuizzes = quizzes.map((quiz) => ({
            id: quiz._id.toString(),
            title: quiz.title,
            subject: quiz.subject,
            difficulty: quiz.difficulty,
            description: quiz.description,
            timeLimit: quiz.timeLimit || 0,
            questionCount: quiz.questions.length,
            totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
            passingScore: quiz.passingScore,
            isActive: quiz.isActive,
            createdAt: quiz.createdAt,
        }));
        return {
            quizzes: transformedQuizzes,
            total,
        };
    }
    static async getQuizById(id) {
        const quiz = await QuizRepository_1.default.findActiveById(id);
        if (!quiz)
            throw new errorHandler_1.AppError('Quiz not found', 404);
        return {
            id: quiz._id.toString(),
            title: quiz.title,
            subject: quiz.subject,
            difficulty: quiz.difficulty,
            description: quiz.description,
            timeLimit: quiz.timeLimit || 0,
            passingScore: quiz.passingScore,
            questions: quiz.questions.map((q) => ({
                id: q._id.toString(),
                type: q.type,
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer || '',
                explanation: q.explanation || '',
                points: q.points,
                order: q.order,
            })),
        };
    }
    static async submitQuizAttempt(userId, payload) {
        const quiz = await QuizRepository_1.default.findActiveById(payload.quizId);
        if (!quiz)
            throw new errorHandler_1.AppError('Quiz not found', 404);
        let totalPoints = 0;
        let earnedPoints = 0;
        console.log('[GamificationService] Submitting quiz attempt:', {
            quizId: payload.quizId,
            answersCount: Object.keys(payload.answers).length,
            answers: payload.answers,
            questionsCount: quiz.questions?.length || 0,
        });
        quiz.questions.forEach((question) => {
            const questionId = question._id.toString();
            totalPoints += question.points || 0;
            // Try multiple key formats to match the answer
            const userAnswer = payload.answers[questionId] ||
                payload.answers[question._id] ||
                payload.answers[String(question._id)];
            logger_1.logger.debug('Processing quiz question', {
                questionId,
                points: question.points,
            });
            if (userAnswer) {
                const userAnswerNormalized = String(userAnswer).toLowerCase().trim();
                const correctAnswerNormalized = String(question.correctAnswer || '')
                    .toLowerCase()
                    .trim();
                const isCorrect = userAnswerNormalized === correctAnswerNormalized;
                logger_1.logger.debug('Answer comparison', { questionId, isCorrect });
                if (isCorrect) {
                    earnedPoints += question.points || 0;
                }
            }
            else {
                logger_1.logger.warn('No answer found for question', { questionId });
            }
        });
        const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        logger_1.logger.debug('Quiz attempt results', {
            totalPoints,
            earnedPoints,
            percentage,
            quizId: payload.quizId,
        });
        const attempt = await QuizAttemptRepository_1.default.create({
            quizId: new mongoose_1.Types.ObjectId(payload.quizId),
            studentId: new mongoose_1.Types.ObjectId(userId),
            score: earnedPoints,
            totalPoints: totalPoints,
            percentage: percentage,
            completedAt: new Date(),
            timeSpent: payload.timeSpent,
            answers: payload.answers,
        });
        const user = await UserRepository_1.default.findById(userId);
        if (user) {
            user.totalPoints += earnedPoints;
            await user.save();
        }
        let userProgress = await UserProgressRepository_1.default.findByUserAndSubject(userId, quiz.subject);
        if (!userProgress) {
            userProgress = await UserProgressRepository_1.default.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                subject: quiz.subject,
                level: 1,
                currentXP: 0,
                nextLevelXP: 100,
                completedQuizzes: 0,
                averageScore: 0,
                studyTime: 0,
                lastActivity: new Date(),
            });
        }
        await userProgress.addXP(earnedPoints);
        const previousTotal = userProgress.averageScore * userProgress.completedQuizzes;
        userProgress.completedQuizzes += 1;
        userProgress.averageScore = Math.round((previousTotal + percentage) / userProgress.completedQuizzes);
        userProgress.studyTime += Math.floor(payload.timeSpent / 60);
        await userProgress.save();
        // After recording this quiz attempt, automatically update all active goals
        try {
            // Recalculate the unified "current" progress value based on all quizzes + completed sessions
            const [quizzes, sessions] = await Promise.all([
                QuizAttemptRepository_1.default.find({ studentId: new mongoose_1.Types.ObjectId(userId) }),
                SessionRepository_1.default.find({ studentId: new mongoose_1.Types.ObjectId(userId), status: 'completed' }),
            ]);
            const currentCount = quizzes.length + sessions.length;
            // Update progress for all active goals for this user
            const goals = await GoalRepository_1.default.findByUser(userId, true);
            await Promise.all(goals.map((goal) => GoalRepository_1.default.updateProgress(goal._id.toString(), currentCount)));
            logger_1.logger.debug('[GamificationService.submitQuizAttempt] Goal progress auto-updated', {
                userId,
                goalsUpdated: goals.length,
                currentCount,
            });
        }
        catch (error) {
            // Log but do not block quiz completion if goal update fails
            logger_1.logger.error('[GamificationService.submitQuizAttempt] Failed to auto-update goal progress', error, { userId });
        }
        const newBadges = await this.checkBadgeEligibility(userId, percentage, quiz.subject);
        return {
            attempt,
            newBadges,
            pointsEarned: earnedPoints,
        };
    }
    static async getRecentAttempts(userId, limit, skip) {
        // Get total count
        const total = await QuizAttemptRepository_1.default.model.countDocuments({
            studentId: new mongoose_1.Types.ObjectId(userId),
        });
        // Get paginated attempts
        let query = QuizAttemptRepository_1.default.model
            .find({ studentId: new mongoose_1.Types.ObjectId(userId) })
            .sort({ completedAt: -1 })
            .populate('quizId', 'title subject');
        if (skip !== undefined)
            query = query.skip(skip);
        query = query.limit(limit);
        const attempts = await query;
        logger_1.logger.debug('Getting recent quiz attempts', {
            userId,
            count: attempts.length,
        });
        const transformedAttempts = attempts.map((attempt) => {
            const transformed = {
                id: attempt._id?.toString() || '',
                quizId: attempt.quizId?._id
                    ? attempt.quizId._id.toString()
                    : attempt.quizId?.toString() || '',
                score: Number(attempt.score) || 0,
                totalPoints: Number(attempt.totalPoints) || 0,
                percentage: Number(attempt.percentage) || 0,
                completedAt: attempt.completedAt,
                timeSpent: Number(attempt.timeSpent) || 0,
            };
            logger_1.logger.debug('Transformed quiz attempt', { attemptId: transformed.id });
            return transformed;
        });
        return {
            attempts: transformedAttempts,
            total,
        };
    }
    // Get quiz attempts for parent's children
    static async getChildrenQuizAttempts(parentId, studentId, page, limit, skip) {
        const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).User;
        // Get all children of the parent
        const children = await User.find({ parentId: new mongoose_1.Types.ObjectId(parentId) });
        if (children.length === 0) {
            return { attempts: [], total: 0 };
        }
        const childrenIds = studentId
            ? [new mongoose_1.Types.ObjectId(studentId)]
            : children.map((child) => child._id);
        // Get total count
        const total = await QuizAttemptRepository_1.default.model.countDocuments({
            studentId: { $in: childrenIds },
        });
        // Get paginated quiz attempts for all children
        let query = QuizAttemptRepository_1.default.model
            .find({ studentId: { $in: childrenIds } })
            .sort({ completedAt: -1 })
            .populate('quizId', 'title subject')
            .populate('studentId', 'firstName lastName');
        if (skip !== undefined)
            query = query.skip(skip);
        if (limit !== undefined)
            query = query.limit(limit);
        const attempts = await query;
        const transformedAttempts = attempts.map((attempt) => ({
            id: attempt._id.toString(),
            quizId: attempt.quizId._id.toString(),
            quizTitle: attempt.quizId?.title || 'Unknown Quiz',
            subject: attempt.quizId?.subject || 'Unknown',
            studentId: attempt.studentId._id.toString(),
            studentName: `${attempt.studentId.firstName || ''} ${attempt.studentId.lastName || ''}`.trim() ||
                'Unknown Student',
            score: attempt.score,
            totalPoints: attempt.totalPoints,
            percentage: attempt.percentage,
            completedAt: attempt.completedAt,
            timeSpent: attempt.timeSpent,
        }));
        return {
            attempts: transformedAttempts,
            total,
        };
    }
    static async getUserProfile(userId) {
        const user = await UserRepository_1.default.findByIdWithFields(userId, 'totalPoints streakCount lastLoginAt firstName lastName profileImage');
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const userBadges = await UserBadgeRepository_1.default.findForUser(userId);
        const level = Math.floor((user.totalPoints || 0) / 100) + 1;
        const currentXP = (user.totalPoints || 0) % 100;
        const nextLevelXP = 100;
        const lastLogin = user.lastLoginAt;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let currentStreak = user.streakCount || 0;
        let isActive = false;
        if (lastLogin) {
            const lastLoginDate = new Date(lastLogin);
            lastLoginDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 0)
                isActive = true;
            else if (daysDiff > 1)
                currentStreak = 0;
        }
        const badges = userBadges.map((ub) => {
            const badge = ub.badgeId;
            return {
                id: ub._id.toString(),
                userId: ub.userId.toString(),
                badgeId: badge._id.toString(),
                badge: {
                    id: badge._id.toString(),
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    category: badge.category,
                    rarity: badge.rarity,
                    criteria: badge.criteria,
                    pointsReward: badge.pointsReward,
                    createdAt: badge.createdAt,
                    isActive: badge.isActive,
                },
                earnedAt: ub.earnedAt,
            };
        });
        const usersAbove = await UserRepository_1.default.model.countDocuments({
            totalPoints: { $gt: user.totalPoints },
        });
        const rank = usersAbove + 1;
        return {
            userId,
            level,
            currentXP,
            nextLevelXP,
            totalPoints: user.totalPoints,
            streak: { currentStreak, longestStreak: user.streakCount || 0, isActive },
            badges,
            rank,
        };
    }
    static async getUserProgress(userId) {
        const progress = await UserProgressRepository_1.default.findByUser(userId);
        return progress.map((p) => ({
            id: p._id.toString(),
            userId: p.userId.toString(),
            subject: p.subject,
            level: p.level,
            currentXP: p.currentXP,
            nextLevelXP: p.nextLevelXP,
            completedQuizzes: p.completedQuizzes,
            averageScore: p.averageScore,
            studyTime: p.studyTime,
            lastActivity: p.lastActivity,
        }));
    }
    static async getAvailableBadges() {
        const badges = await BadgeRepository_1.default.findActive();
        return badges.map((badge) => ({
            id: badge._id.toString(),
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            category: badge.category,
            rarity: badge.rarity,
            criteria: badge.criteria,
            pointsReward: badge.pointsReward,
            createdAt: badge.createdAt,
            isActive: badge.isActive,
        }));
    }
    static async getLeaderboard(userId, limit, timeframe) {
        // Calculate date filter based on timeframe
        let dateFilter = {};
        if (timeframe === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateFilter = { createdAt: { $gte: weekAgo } };
        }
        else if (timeframe === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateFilter = { createdAt: { $gte: monthAgo } };
        }
        // 'all' or undefined means no date filter
        // Get quiz attempts to calculate stats
        const quizAttemptRepository = (await Promise.resolve().then(() => __importStar(require('../repositories/QuizAttemptRepository')))).default;
        const UserBadge = (await Promise.resolve().then(() => __importStar(require('../models/UserBadge')))).UserBadge;
        // Get all students with their total points
        const allStudents = await UserRepository_1.default.model
            .find({ role: 'STUDENT' })
            .select('firstName lastName profileImage totalPoints streakCount _id role')
            .sort({ totalPoints: -1 })
            .limit(limit * 2); // Get more to filter by timeframe if needed
        // Build leaderboard with full stats
        const leaderboardPromises = allStudents.map(async (user, index) => {
            const studentId = user._id.toString();
            // Get quiz attempts for this user (with timeframe filter if needed)
            const attemptQuery = { studentId: new mongoose_1.Types.ObjectId(studentId) };
            if (Object.keys(dateFilter).length > 0) {
                attemptQuery.completedAt = dateFilter.createdAt;
            }
            const attempts = await quizAttemptRepository.model.find(attemptQuery);
            const totalQuizzes = attempts.length;
            const averageScore = totalQuizzes > 0
                ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalQuizzes)
                : 0;
            // Get user badges
            const badges = await UserBadge.find({ userId: new mongoose_1.Types.ObjectId(studentId) })
                .populate('badgeId')
                .limit(5);
            return {
                id: studentId,
                rank: index + 1,
                userId: studentId,
                userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
                userRole: user.role || 'STUDENT',
                totalPoints: user.totalPoints || 0,
                totalQuizzes,
                averageScore,
                currentStreak: user.streakCount || 0,
                badges: badges.map((ub) => ({
                    id: ub._id.toString(),
                    userId: ub.userId.toString(),
                    badgeId: ub.badgeId._id.toString(),
                    badge: {
                        id: ub.badgeId._id.toString(),
                        name: ub.badgeId.name,
                        icon: ub.badgeId.icon,
                        rarity: ub.badgeId.rarity,
                        pointsReward: ub.badgeId.pointsReward,
                    },
                    earnedAt: ub.earnedAt,
                })),
                profileImage: user.profileImage || null,
            };
        });
        const leaderboard = await Promise.all(leaderboardPromises);
        // Re-sort by totalPoints after calculating stats (in case timeframe filtering changed order)
        leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        // Limit to requested number
        const limitedLeaderboard = leaderboard.slice(0, limit);
        // Get current user's rank if provided
        let currentUserEntry = null;
        if (userId) {
            const user = await UserRepository_1.default.findById(userId);
            if (user && user.role === 'STUDENT') {
                const userAttempts = await quizAttemptRepository.model.find({
                    studentId: new mongoose_1.Types.ObjectId(userId),
                    ...(Object.keys(dateFilter).length > 0 ? { completedAt: dateFilter.createdAt } : {}),
                });
                const userTotalQuizzes = userAttempts.length;
                const userAverageScore = userTotalQuizzes > 0
                    ? Math.round(userAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
                        userTotalQuizzes)
                    : 0;
                const userBadges = await UserBadge.find({ userId: new mongoose_1.Types.ObjectId(userId) })
                    .populate('badgeId')
                    .limit(5);
                const usersAbove = await UserRepository_1.default.model.countDocuments({
                    role: 'STUDENT',
                    totalPoints: { $gt: user.totalPoints || 0 },
                });
                currentUserEntry = {
                    id: userId,
                    rank: usersAbove + 1,
                    userId,
                    userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
                    userRole: user.role || 'STUDENT',
                    totalPoints: user.totalPoints || 0,
                    totalQuizzes: userTotalQuizzes,
                    averageScore: userAverageScore,
                    currentStreak: user.streakCount || 0,
                    badges: userBadges.map((ub) => ({
                        id: ub._id.toString(),
                        userId: ub.userId.toString(),
                        badgeId: ub.badgeId._id.toString(),
                        badge: {
                            id: ub.badgeId._id.toString(),
                            name: ub.badgeId.name,
                            icon: ub.badgeId.icon,
                            rarity: ub.badgeId.rarity,
                            pointsReward: ub.badgeId.pointsReward,
                        },
                        earnedAt: ub.earnedAt,
                    })),
                    profileImage: user.profileImage || null,
                };
            }
        }
        // Combine leaderboard with current user if not already in top list
        const result = [...limitedLeaderboard];
        if (currentUserEntry && !result.find((e) => e.userId === currentUserEntry.userId)) {
            result.push(currentUserEntry);
        }
        return result;
    }
    static async checkBadgeEligibility(userId, quizPercentage, subject) {
        const user = await UserRepository_1.default.findById(userId);
        if (!user)
            return [];
        const allBadges = await BadgeRepository_1.default.model.find({ isActive: true });
        const userBadges = await UserBadgeRepository_1.default.model.find({
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        const earnedBadgeIds = userBadges.map((ub) => ub.badgeId.toString());
        const newBadges = [];
        for (const badge of allBadges) {
            if (earnedBadgeIds.includes(badge._id.toString()))
                continue;
            let eligible = false;
            switch (badge.criteria.type) {
                case 'quiz_score':
                    if (quizPercentage >= badge.criteria.threshold) {
                        if (!badge.criteria.subject || badge.criteria.subject === subject)
                            eligible = true;
                    }
                    break;
                case 'quiz_count':
                    {
                        const count = await QuizAttemptRepository_1.default.model.countDocuments({
                            studentId: new mongoose_1.Types.ObjectId(userId),
                        });
                        if (count >= badge.criteria.threshold)
                            eligible = true;
                    }
                    break;
                case 'streak':
                    if (user.streakCount >= badge.criteria.threshold)
                        eligible = true;
                    break;
                case 'points':
                    if (user.totalPoints >= badge.criteria.threshold)
                        eligible = true;
                    break;
                case 'perfect_score':
                    if (quizPercentage === 100)
                        eligible = true;
                    break;
            }
            if (eligible) {
                const userBadge = await UserBadgeRepository_1.default.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    badgeId: new mongoose_1.Types.ObjectId(badge._id),
                    earnedAt: new Date(),
                });
                user.totalPoints += badge.pointsReward;
                await user.save();
                newBadges.push({
                    id: userBadge._id.toString(),
                    userId: userBadge.userId.toString(),
                    badgeId: badge._id.toString(),
                    badge: {
                        id: badge._id.toString(),
                        name: badge.name,
                        description: badge.description,
                        icon: badge.icon,
                        category: badge.category,
                        rarity: badge.rarity,
                        criteria: badge.criteria,
                        pointsReward: badge.pointsReward,
                        createdAt: badge.createdAt,
                        isActive: badge.isActive,
                    },
                    earnedAt: userBadge.earnedAt,
                });
            }
        }
        return newBadges;
    }
}
exports.GamificationService = GamificationService;
exports.default = GamificationService;
//# sourceMappingURL=gamificationService.js.map