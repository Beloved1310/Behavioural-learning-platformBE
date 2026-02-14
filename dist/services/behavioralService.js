"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehavioralService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_1 = require("../middleware/errorHandler");
const CustomEventRepository_1 = __importDefault(require("../repositories/CustomEventRepository"));
const BehavioralDataRepository_1 = __importDefault(require("../repositories/BehavioralDataRepository"));
const SessionRepository_1 = __importDefault(require("../repositories/SessionRepository"));
const QuizAttemptRepository_1 = __importDefault(require("../repositories/QuizAttemptRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const geminiService_1 = require("./geminiService");
const logger_1 = require("../utils/logger");
class BehavioralService {
    // ============ Engagement Tracking ============
    /**
     * Track engagement event (login, session start, etc.)
     */
    static async trackEngagement(userId, data) {
        return CustomEventRepository_1.default.createEvent({
            userId: new mongoose_1.Types.ObjectId(userId),
            eventType: data.eventType,
            eventData: data.metadata || {},
            page: undefined,
            sessionId: data.sessionId,
            timestamp: new Date(),
        });
    }
    /**
     * Record behavioral data (session duration, engagement score)
     */
    static async recordBehavioralData(userId, data) {
        return BehavioralDataRepository_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            sessionDuration: data.sessionDuration,
            actionsPerformed: data.actionsPerformed,
            mood: data.mood,
            engagementScore: data.engagementScore,
            pageViews: data.pageViews,
            timestamp: new Date(),
        });
    }
    // ============ Basic Progress Summary ============
    /**
     * Get weekly progress summary (quiz completion, session participation)
     */
    static async getWeeklyProgressSummary(userId) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const [sessions, quizzes, behavioralData] = await Promise.all([
            SessionRepository_1.default.find({
                studentId: new mongoose_1.Types.ObjectId(userId),
                scheduledAt: { $gte: weekStart },
                status: 'completed',
            }),
            QuizAttemptRepository_1.default.find({
                studentId: new mongoose_1.Types.ObjectId(userId),
                completedAt: { $gte: weekStart },
            }),
            BehavioralDataRepository_1.default.findSince(userId, weekStart),
        ]);
        const totalSessionDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalEngagementTime = behavioralData.reduce((sum, d) => sum + (d.sessionDuration || 0), 0);
        return {
            weekStart: weekStart,
            weekEnd: now,
            sessions: {
                completed: sessions.length,
                totalDuration: totalSessionDuration, // in minutes
            },
            quizzes: {
                completed: quizzes.length,
                averageScore: quizzes.length > 0
                    ? Math.round(quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) /
                        quizzes.length)
                    : 0,
            },
            engagement: {
                totalTime: Math.round(totalEngagementTime / 60), // in minutes
                averageScore: behavioralData.length > 0
                    ? Math.round(behavioralData.reduce((sum, d) => sum + (d.engagementScore || 0), 0) / behavioralData.length)
                    : 0,
            },
        };
    }
    // ============ Motivational Nudges ============
    /**
     * Get motivational nudges (AI-generated or template-based)
     */
    static async getMotivationalNudges(userId, maxNudges = 3) {
        const user = await UserRepository_1.default.findByIdWithFields(userId, 'streakCount lastLoginAt');
        // Get recent activity context
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const [quizzesThisWeek, lastLogin] = await Promise.all([
            QuizAttemptRepository_1.default.find({
                studentId: new mongoose_1.Types.ObjectId(userId),
                completedAt: { $gte: weekStart },
            }),
            user ? user.lastLoginAt : null,
        ]);
        const lastLoginDaysAgo = lastLogin
            ? Math.floor((now.getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : undefined;
        const userContext = {
            currentStreak: user?.streakCount || 0,
            lastLoginDaysAgo,
            quizzesCompletedThisWeek: quizzesThisWeek.length,
        };
        // Try AI-generated nudges first
        if (geminiService_1.GeminiService.isAvailable()) {
            try {
                const aiNudges = await geminiService_1.GeminiService.generateMotivationalNudges(userContext);
                if (aiNudges && aiNudges.length > 0) {
                    return aiNudges.slice(0, maxNudges);
                }
            }
            catch (error) {
                logger_1.logger.error('[BehavioralService] AI nudge generation failed, using templates', error);
            }
        }
        // Fallback to template-based nudges
        return this.getTemplateNudges(userContext, maxNudges);
    }
    /**
     * Template-based nudges (fallback when AI unavailable)
     * Enhanced with more variety for Behavior Nudges feature
     */
    static getTemplateNudges(context, maxNudges) {
        const nudges = [];
        // Streak-based nudges
        if (context.currentStreak && context.currentStreak > 0) {
            if (context.currentStreak >= 7) {
                nudges.push(`Incredible! You're on a ${context.currentStreak}-day streak! 🎉 You're unstoppable!`);
            }
            else if (context.currentStreak >= 3) {
                nudges.push(`Amazing! You're on a ${context.currentStreak}-day streak! 🔥 Keep it up!`);
            }
            else {
                nudges.push(`Great start! You're on a ${context.currentStreak}-day streak! Keep going!`);
            }
        }
        else {
            nudges.push('Try setting a goal for tomorrow!');
            nudges.push('Start a learning streak today - every day counts!');
        }
        // Activity-based nudges
        if (context.lastLoginDaysAgo !== undefined && context.lastLoginDaysAgo > 2) {
            nudges.push('Welcome back! Ready to continue your learning journey?');
            nudges.push("It's been a while! Let's get back on track together.");
        }
        if (context.quizzesCompletedThisWeek && context.quizzesCompletedThisWeek > 0) {
            if (context.quizzesCompletedThisWeek >= 5) {
                nudges.push(`Outstanding! You've completed ${context.quizzesCompletedThisWeek} quizzes this week! 🌟`);
            }
            else {
                nudges.push(`Great work! You've completed ${context.quizzesCompletedThisWeek} quiz${context.quizzesCompletedThisWeek > 1 ? 'zes' : ''} this week!`);
            }
        }
        else {
            nudges.push('Ready to test your knowledge? Try a quiz today!');
        }
        // General motivational nudges (expanded list)
        const generalNudges = [
            "Every study session counts. You've got this!",
            'Small steps lead to big achievements!',
            "You're doing great! Keep up the momentum.",
            'Progress, not perfection. Keep learning!',
            'Your future self will thank you for studying today!',
            'Learning is a journey - enjoy every step!',
            "You're building great habits. Keep it up!",
            'Remember: every expert was once a beginner.',
            'Take a break if needed, then come back stronger!',
            "You're capable of amazing things. Believe in yourself!",
        ];
        // Shuffle and add general nudges until we reach maxNudges
        const shuffled = generalNudges.sort(() => Math.random() - 0.5);
        while (nudges.length < maxNudges && shuffled.length > 0) {
            const nudge = shuffled.shift();
            if (!nudges.includes(nudge)) {
                nudges.push(nudge);
            }
        }
        return nudges.slice(0, maxNudges);
    }
    // ============ Reflection Prompts ============
    /**
     * Get reflection prompts for post-session (AI-generated or template-based)
     */
    static async getReflectionPrompts(sessionContext) {
        // Try AI-generated prompts first
        if (geminiService_1.GeminiService.isAvailable()) {
            try {
                const aiPrompts = await geminiService_1.GeminiService.generateReflectionPrompts(sessionContext);
                if (aiPrompts && aiPrompts.length > 0) {
                    return aiPrompts;
                }
            }
            catch (error) {
                console.error('[BehavioralService] AI reflection prompt generation failed, using templates:', error);
            }
        }
        // Fallback to template-based prompts
        return this.getTemplateReflectionPrompts(sessionContext);
    }
    /**
     * Template-based reflection prompts (fallback when AI unavailable)
     */
    static getTemplateReflectionPrompts(sessionContext) {
        const prompts = [
            "What effort did you put in today that you're proud of?",
            'What mistake or challenge helped you learn something new?',
        ];
        if (sessionContext?.quizCompleted) {
            if (sessionContext.score && sessionContext.score >= 80) {
                prompts.push('Your effort paid off! What strategy helped you succeed?');
            }
            else {
                prompts.push('What did you learn from the questions you got wrong? What will you work toward next time?');
            }
        }
        else {
            prompts.push("What skill are you working toward mastering? What's your next step?");
        }
        return prompts;
    }
    // ============ Legacy Methods (kept for backward compatibility) ============
    static async trackEvent(userId, data) {
        return CustomEventRepository_1.default.createEvent({
            userId: new mongoose_1.Types.ObjectId(userId),
            eventType: data.eventType,
            eventData: data.eventData || {},
            page: data.page,
            sessionId: data.sessionId,
            timestamp: new Date(),
        });
    }
    static async getEventHistory(userId, eventType, limit) {
        return CustomEventRepository_1.default.getHistory(userId, eventType, limit);
    }
    static async getEventCounts(userId, days) {
        return CustomEventRepository_1.default.getCounts(userId, days);
    }
    static async getPageViews(userId, days) {
        return CustomEventRepository_1.default.getPageViews(userId, days);
    }
    // ============ Legacy Methods (Not in MVP - Stub implementations) ============
    // These are kept for backward compatibility but return minimal data
    static async getBehavioralInsights(userId, days) {
        // Return minimal insights based on progress summary
        const summary = await this.getWeeklyProgressSummary(userId);
        return [
            {
                type: 'progress',
                title: 'Weekly Progress',
                description: `You completed ${summary.sessions.completed} sessions and ${summary.quizzes.completed} quizzes this week.`,
            },
        ];
    }
    static async getStudyConsistency(userId, days) {
        const summary = await this.getWeeklyProgressSummary(userId);
        return {
            dailyPattern: [],
            weeklyPattern: [],
            currentStreak: 0,
            lastActive: new Date(),
        };
    }
    static async getRecommendations(userId, type, limit) {
        return [];
    }
    static async generateRecommendations(userId) {
        return [];
    }
    static async markRecommendationAsRead(id, userId) {
        throw new errorHandler_1.AppError('Recommendations not available in MVP', 501);
    }
    static async markRecommendationAsActioned(id, userId) {
        throw new errorHandler_1.AppError('Recommendations not available in MVP', 501);
    }
    static async getProgressReports(userId, period, limit) {
        return [];
    }
    static async generateProgressReport(userId, period) {
        throw new errorHandler_1.AppError('Progress reports not available in MVP. Use weekly progress summary instead.', 501);
    }
    static async getSentimentAnalysis(userId, days) {
        // Return minimal sentiment based on engagement
        const summary = await this.getWeeklyProgressSummary(userId);
        return {
            overall: summary.engagement.averageScore >= 70 ? 'positive' : 'neutral',
            moodScore: summary.engagement.averageScore,
            engagementScore: summary.engagement.averageScore,
            dataPoints: {
                engagementRecords: summary.engagement.totalTime,
            },
            source: 'rule-based',
        };
    }
}
exports.BehavioralService = BehavioralService;
exports.default = BehavioralService;
//# sourceMappingURL=behavioralService.js.map