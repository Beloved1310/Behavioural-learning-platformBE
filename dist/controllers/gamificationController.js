"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationController = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
class GamificationController {
    // Get all quizzes with optional filters
    static async getQuizzes(req, res) {
        try {
            const { subject, difficulty } = req.query;
            const filter = { isActive: true };
            if (subject) {
                filter.subject = subject;
            }
            if (difficulty) {
                filter.difficulty = difficulty;
            }
            const quizzes = await models_1.Quiz.find(filter)
                .select('-questions.correctAnswer -questions.explanation')
                .sort({ createdAt: -1 });
            // Transform to match frontend expectations
            const transformedQuizzes = quizzes.map(quiz => ({
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
                createdAt: quiz.createdAt
            }));
            res.json({ quizzes: transformedQuizzes });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch quizzes', 500);
        }
    }
    // Get quiz by ID (for starting a quiz)
    static async getQuizById(req, res) {
        try {
            const { id } = req.params;
            const quiz = await models_1.Quiz.findOne({ _id: id, isActive: true });
            if (!quiz) {
                throw new errorHandler_1.AppError('Quiz not found', 404);
            }
            // Remove correct answers and explanations when sending to frontend
            const transformedQuiz = {
                id: quiz._id.toString(),
                title: quiz.title,
                subject: quiz.subject,
                difficulty: quiz.difficulty,
                description: quiz.description,
                timeLimit: quiz.timeLimit || 0,
                passingScore: quiz.passingScore,
                questions: quiz.questions.map(q => ({
                    id: q._id.toString(),
                    type: q.type,
                    question: q.question,
                    options: q.options || [],
                    points: q.points,
                    order: q.order
                }))
            };
            res.json({ quiz: transformedQuiz });
        }
        catch (error) {
            throw error;
        }
    }
    // Submit quiz attempt
    static async submitQuizAttempt(req, res) {
        try {
            const { quizId, answers, timeSpent } = req.body;
            const userId = req.user.id;
            const quiz = await models_1.Quiz.findOne({ _id: quizId, isActive: true });
            if (!quiz) {
                throw new errorHandler_1.AppError('Quiz not found', 404);
            }
            // Calculate score
            let correctAnswers = 0;
            let totalPoints = 0;
            let earnedPoints = 0;
            quiz.questions.forEach(question => {
                totalPoints += question.points;
                const userAnswer = answers[question._id.toString()];
                if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
                    correctAnswers++;
                    earnedPoints += question.points;
                }
            });
            const percentage = Math.round((earnedPoints / totalPoints) * 100);
            // Create quiz attempt
            const attempt = await models_1.QuizAttempt.create({
                quizId,
                studentId: userId,
                score: earnedPoints,
                totalPoints,
                percentage,
                completedAt: new Date(),
                timeSpent,
                answers
            });
            // Update user points and stats
            const user = await models_1.User.findById(userId);
            if (user) {
                user.totalPoints += earnedPoints;
                await user.save();
            }
            // Update user progress for this subject
            let userProgress = await models_1.UserProgress.findOne({
                userId,
                subject: quiz.subject
            });
            if (!userProgress) {
                userProgress = await models_1.UserProgress.create({
                    userId,
                    subject: quiz.subject,
                    level: 1,
                    currentXP: 0,
                    nextLevelXP: 100,
                    completedQuizzes: 0,
                    averageScore: 0,
                    studyTime: 0,
                    lastActivity: new Date()
                });
            }
            // Add XP (use instance method which handles leveling up)
            await userProgress.addXP(earnedPoints);
            // Update quiz count and average score
            const previousTotal = userProgress.averageScore * userProgress.completedQuizzes;
            userProgress.completedQuizzes += 1;
            userProgress.averageScore = Math.round((previousTotal + percentage) / userProgress.completedQuizzes);
            userProgress.studyTime += Math.floor(timeSpent / 60); // Convert seconds to minutes
            await userProgress.save();
            // Check for badge eligibility
            const newBadges = await GamificationController.checkBadgeEligibility(userId, percentage, quiz.subject);
            res.json({
                attempt: {
                    id: attempt._id.toString(),
                    quizId: attempt.quizId.toString(),
                    score: attempt.score,
                    totalPoints: attempt.totalPoints,
                    percentage: attempt.percentage,
                    completedAt: attempt.completedAt,
                    timeSpent: attempt.timeSpent
                },
                newBadges,
                pointsEarned: earnedPoints
            });
        }
        catch (error) {
            throw error;
        }
    }
    // Get recent quiz attempts for current user
    static async getRecentAttempts(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;
            const attempts = await models_1.QuizAttempt.find({ studentId: userId })
                .sort({ completedAt: -1 })
                .limit(limit)
                .populate('quizId', 'title subject');
            const transformedAttempts = attempts.map(attempt => ({
                id: attempt._id.toString(),
                quizId: attempt.quizId.toString(),
                score: attempt.score,
                totalPoints: attempt.totalPoints,
                percentage: attempt.percentage,
                completedAt: attempt.completedAt,
                timeSpent: attempt.timeSpent
            }));
            res.json({ attempts: transformedAttempts });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch recent attempts', 500);
        }
    }
    // Get user gamification profile
    static async getUserProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await models_1.User.findById(userId).select('totalPoints streakCount lastLoginAt');
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            // Get user badges with populated badge details
            const userBadges = await models_1.UserBadge.find({ userId })
                .populate('badgeId')
                .sort({ earnedAt: -1 });
            // Calculate current level based on total points
            const level = Math.floor(user.totalPoints / 100) + 1;
            const currentXP = user.totalPoints % 100;
            const nextLevelXP = 100;
            // Calculate streak
            const lastLogin = user.lastLoginAt;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let currentStreak = user.streakCount || 0;
            let isActive = false;
            if (lastLogin) {
                const lastLoginDate = new Date(lastLogin);
                lastLoginDate.setHours(0, 0, 0, 0);
                const daysDiff = Math.floor((today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff === 0) {
                    isActive = true;
                }
                else if (daysDiff === 1) {
                    // User logged in yesterday, can continue streak
                    isActive = false;
                }
                else {
                    // Streak broken
                    currentStreak = 0;
                }
            }
            // Get leaderboard rank
            const usersAbove = await models_1.User.countDocuments({
                totalPoints: { $gt: user.totalPoints }
            });
            const rank = usersAbove + 1;
            // Transform badges to match frontend format
            const badges = userBadges.map(ub => {
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
                        isActive: badge.isActive
                    },
                    earnedAt: ub.earnedAt
                };
            });
            res.json({
                profile: {
                    userId,
                    level,
                    currentXP,
                    nextLevelXP,
                    totalPoints: user.totalPoints,
                    streak: {
                        currentStreak,
                        longestStreak: user.streakCount || 0,
                        isActive
                    },
                    badges,
                    rank
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    // Get user progress across all subjects
    static async getUserProgress(req, res) {
        try {
            const userId = req.user.id;
            const progress = await models_1.UserProgress.find({ userId }).sort({ subject: 1 });
            const transformedProgress = progress.map(p => ({
                id: p._id.toString(),
                userId: p.userId.toString(),
                subject: p.subject,
                level: p.level,
                currentXP: p.currentXP,
                nextLevelXP: p.nextLevelXP,
                completedQuizzes: p.completedQuizzes,
                averageScore: p.averageScore,
                studyTime: p.studyTime,
                lastActivity: p.lastActivity
            }));
            res.json({ progress: transformedProgress });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch user progress', 500);
        }
    }
    // Get available badges
    static async getAvailableBadges(req, res) {
        try {
            const badges = await models_1.Badge.find({ isActive: true }).sort({ rarity: 1, pointsReward: 1 });
            const transformedBadges = badges.map(badge => ({
                id: badge._id.toString(),
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                category: badge.category,
                rarity: badge.rarity,
                criteria: badge.criteria,
                pointsReward: badge.pointsReward,
                createdAt: badge.createdAt,
                isActive: badge.isActive
            }));
            res.json({ badges: transformedBadges });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch badges', 500);
        }
    }
    // Get leaderboard
    static async getLeaderboard(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.user?.id;
            const topUsers = await models_1.User.find({ role: 'STUDENT' })
                .select('firstName lastName profileImage totalPoints')
                .sort({ totalPoints: -1 })
                .limit(limit);
            const leaderboard = topUsers.map((user, index) => ({
                rank: index + 1,
                userId: user._id.toString(),
                name: `${user.firstName} ${user.lastName}`,
                profileImage: user.profileImage || null,
                totalPoints: user.totalPoints
            }));
            // Find current user's rank if not in top list
            let currentUserRank = null;
            if (userId) {
                const userInTop = leaderboard.find(entry => entry.userId === userId);
                if (!userInTop) {
                    const user = await models_1.User.findById(userId);
                    if (user) {
                        const usersAbove = await models_1.User.countDocuments({
                            role: 'STUDENT',
                            totalPoints: { $gt: user.totalPoints }
                        });
                        currentUserRank = {
                            rank: usersAbove + 1,
                            userId: user._id.toString(),
                            name: `${user.firstName} ${user.lastName}`,
                            profileImage: user.profileImage || null,
                            totalPoints: user.totalPoints
                        };
                    }
                }
            }
            res.json({
                leaderboard,
                currentUser: currentUserRank
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch leaderboard', 500);
        }
    }
    // Helper method to check badge eligibility
    static async checkBadgeEligibility(userId, quizPercentage, subject) {
        try {
            const user = await models_1.User.findById(userId);
            if (!user)
                return [];
            const allBadges = await models_1.Badge.find({ isActive: true });
            const userBadges = await models_1.UserBadge.find({ userId });
            const earnedBadgeIds = userBadges.map(ub => ub.badgeId.toString());
            const newBadges = [];
            for (const badge of allBadges) {
                // Skip if user already has this badge
                if (earnedBadgeIds.includes(badge._id.toString())) {
                    continue;
                }
                let eligible = false;
                switch (badge.criteria.type) {
                    case 'quiz_score':
                        if (quizPercentage >= badge.criteria.threshold) {
                            if (!badge.criteria.subject || badge.criteria.subject === subject) {
                                eligible = true;
                            }
                        }
                        break;
                    case 'quiz_count':
                        const quizCount = await models_1.QuizAttempt.countDocuments({ studentId: userId });
                        if (quizCount >= badge.criteria.threshold) {
                            eligible = true;
                        }
                        break;
                    case 'streak':
                        if (user.streakCount >= badge.criteria.threshold) {
                            eligible = true;
                        }
                        break;
                    case 'points':
                        if (user.totalPoints >= badge.criteria.threshold) {
                            eligible = true;
                        }
                        break;
                    case 'perfect_score':
                        if (quizPercentage === 100) {
                            eligible = true;
                        }
                        break;
                }
                if (eligible) {
                    const userBadge = await models_1.UserBadge.create({
                        userId,
                        badgeId: badge._id,
                        earnedAt: new Date()
                    });
                    // Award badge points to user
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
                            isActive: badge.isActive
                        },
                        earnedAt: userBadge.earnedAt
                    });
                }
            }
            return newBadges;
        }
        catch (error) {
            console.error('Error checking badge eligibility:', error);
            return [];
        }
    }
}
exports.GamificationController = GamificationController;
//# sourceMappingURL=gamificationController.js.map