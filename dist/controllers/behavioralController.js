"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehavioralController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const behavioralService_1 = require("../services/behavioralService");
const logger_1 = require("../utils/logger");
class BehavioralController {
}
exports.BehavioralController = BehavioralController;
_a = BehavioralController;
// ============ Custom Event Tracking Endpoints ============
BehavioralController.trackEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { eventType, eventData, page, sessionId } = req.body;
    const userId = req.user.id;
    const event = await behavioralService_1.BehavioralService.trackEvent(userId, {
        eventType,
        eventData,
        page,
        sessionId,
    });
    res
        .status(201)
        .json({
        success: true,
        event: {
            id: event._id.toString(),
            eventType: event.eventType,
            timestamp: event.timestamp,
        },
    });
});
BehavioralController.getEventHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const eventType = req.query.eventType;
    const limit = parseInt(req.query.limit) || 50;
    const events = await behavioralService_1.BehavioralService.getEventHistory(userId, eventType, limit);
    const transformed = events.map((event) => ({
        id: event._id.toString(),
        eventType: event.eventType,
        eventData: event.eventData,
        page: event.page,
        timestamp: event.timestamp,
    }));
    res.json({ success: true, events: transformed, count: transformed.length });
});
BehavioralController.getEventCounts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const counts = await behavioralService_1.BehavioralService.getEventCounts(userId, days);
    res.json({ success: true, eventCounts: counts, period: `${days} days` });
});
BehavioralController.getPageViews = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const pageViews = await behavioralService_1.BehavioralService.getPageViews(userId, days);
    res.json({ success: true, pageViews, period: `${days} days` });
});
// ============ Behavioral Insights Endpoints ============
BehavioralController.getBehavioralInsights = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const insights = await behavioralService_1.BehavioralService.getBehavioralInsights(userId, days);
    res.json({ success: true, insights, period: `${days} days` });
});
// Get study consistency analysis
BehavioralController.getStudyConsistency = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const result = await behavioralService_1.BehavioralService.getStudyConsistency(userId, days);
    res.json({ success: true, consistency: result, period: `${days} days` });
});
// Get consistency score (for dashboard stats)
BehavioralController.getConsistencyScore = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const result = await behavioralService_1.BehavioralService.getStudyConsistency(userId, days);
    // Calculate consistency score (0-100)
    const consistencyScore = result.consistencyScore || 0;
    res.json({
        success: true,
        consistencyScore,
        streak: result.currentStreak || 0,
        period: `${days} days`,
    });
});
// ============ Recommendations Endpoints ============
// Get personalized recommendations
BehavioralController.getRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const recs = await behavioralService_1.BehavioralService.getRecommendations(userId, type, limit);
    const transformed = recs.map((rec) => ({
        id: rec._id.toString(),
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        metadata: rec.metadata,
        isRead: rec.isRead,
        isActioned: rec.isActioned,
        generatedAt: rec.generatedAt,
    }));
    res.json({ success: true, recommendations: transformed, count: transformed.length });
});
// Generate new recommendations based on behavior
BehavioralController.generateRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const newRecs = await behavioralService_1.BehavioralService.generateRecommendations(userId);
    const transformed = newRecs.map((rec) => ({
        id: rec._id.toString(),
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        metadata: rec.metadata,
        generatedAt: rec.generatedAt,
    }));
    res
        .status(201)
        .json({ success: true, recommendations: transformed, count: transformed.length });
});
// Mark recommendation as read
BehavioralController.markRecommendationAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await behavioralService_1.BehavioralService.markRecommendationAsRead(id, userId);
    res.json({ success: true, message: 'Recommendation marked as read' });
});
// Mark recommendation as actioned
BehavioralController.markRecommendationAsActioned = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await behavioralService_1.BehavioralService.markRecommendationAsActioned(id, userId);
    res.json({ success: true, message: 'Recommendation marked as actioned' });
});
// ============ Progress Reports Endpoints ============
// Get progress reports
BehavioralController.getProgressReports = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const period = req.query.period || 'weekly';
    const limit = parseInt(req.query.limit) || 10;
    const reports = await behavioralService_1.BehavioralService.getProgressReports(userId, period, limit);
    const transformed = reports.map((report) => ({
        id: report._id.toString(),
        period: report.period,
        startDate: report.startDate,
        endDate: report.endDate,
        totalStudyTime: report.totalStudyTime,
        sessionsCompleted: report.sessionsCompleted,
        quizzesTaken: report.quizzesTaken,
        averageScore: report.averageScore,
        streakDays: report.streakDays,
        badgesEarned: report.badgesEarned,
        pointsEarned: report.pointsEarned,
        insights: report.insights,
        recommendations: report.recommendations,
        generatedAt: report.generatedAt,
    }));
    res.json({ success: true, reports: transformed, count: transformed.length });
});
// Generate new progress report
BehavioralController.generateProgressReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Not available in MVP - return error
    throw new errorHandler_1.AppError('Progress reports not available in MVP. Use weekly progress summary instead.', 501);
});
// ============ Sentiment Analysis Endpoints ============
// Get sentiment analysis from mood and engagement data
BehavioralController.getSentimentAnalysis = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const sentiment = await behavioralService_1.BehavioralService.getSentimentAnalysis(userId, days);
    res.json({ success: true, sentiment, period: `${days} days` });
});
// ============ MVP: Engagement Tracking ============
BehavioralController.trackEngagement = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    let { eventType, sessionId, duration, metadata } = req.body;
    if (!eventType) {
        throw new errorHandler_1.AppError('eventType is required', 400);
    }
    // Map legacy event types to MVP event types
    const eventTypeMap = {
        page_view: 'login',
        session_join: 'session_start',
        session_leave: 'session_end',
        quiz_attempt: 'quiz_complete',
        button_click: 'login',
        click: 'login',
        form_submit: 'login',
        chat_message: 'login',
        resource_view: 'login',
        search: 'login',
        custom: 'login',
    };
    // If it's a legacy event type, map it
    if (eventTypeMap[eventType]) {
        eventType = eventTypeMap[eventType];
    }
    else if (!['login', 'session_start', 'session_end', 'quiz_start', 'quiz_complete'].includes(eventType)) {
        // For any other unknown event type, default to 'login' to avoid errors
        logger_1.logger.warn(`[BehavioralController] Unknown event type "${eventType}", mapping to "login"`);
        eventType = 'login';
    }
    // At this point, eventType is guaranteed to be one of the valid MVP types
    const event = await behavioralService_1.BehavioralService.trackEngagement(userId, {
        eventType: eventType,
        sessionId,
        duration,
        metadata,
    });
    res.status(201).json({
        success: true,
        data: {
            id: event._id.toString(),
            eventType: event.eventType,
            timestamp: event.timestamp,
        },
    });
});
BehavioralController.recordBehavioralData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { sessionDuration, actionsPerformed, mood, engagementScore, pageViews } = req.body;
    // Validate required fields (allow 0 values)
    if (sessionDuration === undefined ||
        sessionDuration === null ||
        typeof sessionDuration !== 'number') {
        throw new errorHandler_1.AppError('sessionDuration is required and must be a number', 400);
    }
    if (actionsPerformed === undefined ||
        actionsPerformed === null ||
        typeof actionsPerformed !== 'number') {
        throw new errorHandler_1.AppError('actionsPerformed is required and must be a number', 400);
    }
    if (engagementScore === undefined ||
        engagementScore === null ||
        typeof engagementScore !== 'number') {
        throw new errorHandler_1.AppError('engagementScore is required and must be a number', 400);
    }
    // Validate ranges
    if (sessionDuration < 0) {
        throw new errorHandler_1.AppError('sessionDuration must be >= 0', 400);
    }
    if (actionsPerformed < 0) {
        throw new errorHandler_1.AppError('actionsPerformed must be >= 0', 400);
    }
    if (engagementScore < 0 || engagementScore > 100) {
        throw new errorHandler_1.AppError('engagementScore must be between 0 and 100', 400);
    }
    const data = await behavioralService_1.BehavioralService.recordBehavioralData(userId, {
        sessionDuration,
        actionsPerformed,
        mood,
        engagementScore,
        pageViews,
    });
    res.status(201).json({
        success: true,
        data: {
            id: data._id.toString(),
            timestamp: data.timestamp,
        },
    });
});
// ============ MVP: Basic Progress Summary ============
BehavioralController.getWeeklyProgressSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const summary = await behavioralService_1.BehavioralService.getWeeklyProgressSummary(userId);
    res.json({ success: true, summary });
});
// ============ MVP: Motivational Nudges ============
BehavioralController.getMotivationalNudges = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const maxNudges = parseInt(req.query.max) || 3;
    const nudges = await behavioralService_1.BehavioralService.getMotivationalNudges(userId, maxNudges);
    res.json({ success: true, nudges });
});
// ============ MVP: Reflection Prompts ============
BehavioralController.getReflectionPrompts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { subject, duration, quizCompleted, score } = req.query;
    const sessionContext = {
        subject: subject,
        duration: duration ? parseInt(duration) : undefined,
        quizCompleted: quizCompleted === 'true',
        score: score ? parseInt(score) : undefined,
    };
    const prompts = await behavioralService_1.BehavioralService.getReflectionPrompts(sessionContext);
    res.json({ success: true, prompts });
});
// ============ Legacy: Motivational Prompts (kept for backward compatibility) ============
BehavioralController.getMotivationalPrompts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const maxPrompts = parseInt(req.query.max) || 3;
    const nudges = await behavioralService_1.BehavioralService.getMotivationalNudges(userId, maxPrompts);
    // Transform to old format for backward compatibility
    const prompts = nudges.map((nudge, index) => ({
        message: nudge,
        icon: ['🔥', '💪', '🎯', '🌟', '🚀'][index] || '✨',
        priority: 3,
    }));
    res.json({ success: true, prompts });
});
//# sourceMappingURL=behavioralController.js.map