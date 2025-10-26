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
// ============ Mood Tracking Routes ============
router.post('/mood', (0, middleware_1.validate)({ body: behavioral_1.logMoodSchema }), behavioralController_1.BehavioralController.logMood);
router.get('/mood/history', (0, middleware_1.validate)({ query: behavioral_1.limitQuerySchema }), behavioralController_1.BehavioralController.getMoodHistory);
router.get('/mood/distribution', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getMoodDistribution);
router.get('/mood/trends', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getMoodTrends);
// ============ Event Tracking Routes ============
router.post('/events', (0, middleware_1.validate)({ body: behavioral_1.trackEventSchema }), behavioralController_1.BehavioralController.trackEvent);
router.get('/events/history', (0, middleware_1.validate)({ query: behavioral_1.eventTypeQuerySchema }), behavioralController_1.BehavioralController.getEventHistory);
router.get('/events/counts', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getEventCounts);
router.get('/events/page-views', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getPageViews);
// ============ Insights Routes ============
router.get('/insights', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getBehavioralInsights);
router.get('/insights/consistency', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getStudyConsistency);
router.get('/insights/sentiment', (0, middleware_1.validate)({ query: behavioral_1.daysQuerySchema }), behavioralController_1.BehavioralController.getSentimentAnalysis);
// ============ Recommendations Routes ============
router.get('/recommendations', (0, middleware_1.validate)({ query: behavioral_1.recommendationTypeQuerySchema }), behavioralController_1.BehavioralController.getRecommendations);
router.post('/recommendations/generate', behavioralController_1.BehavioralController.generateRecommendations);
router.patch('/recommendations/:id/read', behavioralController_1.BehavioralController.markRecommendationAsRead);
router.patch('/recommendations/:id/actioned', behavioralController_1.BehavioralController.markRecommendationAsActioned);
// ============ Progress Reports Routes ============
router.get('/reports', (0, middleware_1.validate)({ query: behavioral_1.progressReportQuerySchema }), behavioralController_1.BehavioralController.getProgressReports);
router.post('/reports/generate', (0, middleware_1.validate)({ body: behavioral_1.generateProgressReportSchema }), behavioralController_1.BehavioralController.generateProgressReport);
// ============ Motivational System Routes ============
router.get('/motivational-prompts', (0, middleware_1.validate)({ query: behavioral_1.maxPromptsQuerySchema }), behavioralController_1.BehavioralController.getMotivationalPrompts);
exports.default = router;
//# sourceMappingURL=behavioral.js.map