"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const behavioralController_1 = require("../controllers/behavioralController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const behavioral_1 = require("../validation/behavioral");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// ============ Event Tracking Routes ============
router.post('/events', (0, middleware_1.validate)({ body: behavioral_1.trackEventSchema }), behavioralController_1.BehavioralController.trackEvent);
router.get('/events/history', (0, middleware_1.validate)({ query: behavioral_1.eventTypeQuerySchema }), behavioralController_1.BehavioralController.getEventHistory);
router.get('/events/counts', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getEventCounts);
router.get('/events/page-views', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getPageViews);
// ============ Insights Routes ============
router.get('/insights', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getBehavioralInsights);
router.get('/insights/consistency', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getStudyConsistency);
router.get('/insights/consistency-score', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getConsistencyScore);
router.get('/insights/sentiment', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getSentimentAnalysis);
// ============ Recommendations Routes ============
router.get('/recommendations', (0, middleware_1.validate)({ query: behavioral_1.recommendationTypeQuerySchema }), behavioralController_1.BehavioralController.getRecommendations);
router.post('/recommendations/generate', (0, middleware_1.validate)(behavioral_1.generateRecommendationsSchema), behavioralController_1.BehavioralController.generateRecommendations);
router.patch('/recommendations/:id/read', (0, middleware_1.validate)(behavioral_1.markRecommendationReadSchema), behavioralController_1.BehavioralController.markRecommendationAsRead);
router.patch('/recommendations/:id/actioned', (0, middleware_1.validate)(behavioral_1.markRecommendationActionedSchema), behavioralController_1.BehavioralController.markRecommendationAsActioned);
// ============ Progress Reports Routes ============
router.get('/reports', (0, middleware_1.validate)({ query: behavioral_1.progressReportQuerySchema }), behavioralController_1.BehavioralController.getProgressReports);
router.post('/reports/generate', (0, middleware_1.validate)({ body: behavioral_1.generateProgressReportSchema }), behavioralController_1.BehavioralController.generateProgressReport);
// ============ MVP: Engagement Tracking Routes ============
router.post('/engagement/track', (0, middleware_1.validate)({ body: behavioral_1.trackEngagementSchema }), behavioralController_1.BehavioralController.trackEngagement);
router.post('/engagement/data', behavioralController_1.BehavioralController.recordBehavioralData); // Has manual validation in controller
// ============ MVP: Basic Progress Summary Routes ============
router.get('/progress/weekly', behavioralController_1.BehavioralController.getWeeklyProgressSummary);
// ============ MVP: Motivational Nudges Routes ============
router.get('/nudges', (0, middleware_1.validate)({ query: behavioral_1.maxPromptsQuerySchema }), behavioralController_1.BehavioralController.getMotivationalNudges);
// ============ MVP: Reflection Prompts Routes ============
router.get('/reflection-prompts', behavioralController_1.BehavioralController.getReflectionPrompts);
// ============ Legacy: Motivational System Routes (kept for backward compatibility) ============
router.get('/motivational-prompts', (0, middleware_1.validate)({ query: behavioral_1.maxPromptsQuerySchema }), behavioralController_1.BehavioralController.getMotivationalPrompts);
exports.default = router;
//# sourceMappingURL=behavioral.js.map