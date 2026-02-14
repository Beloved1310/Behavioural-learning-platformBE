"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parentReportsController_1 = require("../controllers/parentReportsController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const errorHandler_1 = require("../middleware/errorHandler");
const parentEmailScheduler_1 = __importDefault(require("../services/parentEmailScheduler"));
const config_1 = __importDefault(require("../config"));
const middleware_1 = require("../validation/middleware");
const parentReports_1 = require("../validation/parentReports");
const router = (0, express_1.Router)();
// All routes require authentication and parent role
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(types_1.UserRole.PARENT));
// Send periodic reports
router.post('/progress-report', (0, middleware_1.validate)(parentReports_1.sendProgressReportSchema), parentReportsController_1.ParentReportsController.sendProgressReport);
router.post('/study-habits-report', (0, middleware_1.validate)(parentReports_1.sendStudyHabitsReportSchema), parentReportsController_1.ParentReportsController.sendStudyHabitsReport);
router.post('/behavioral-insights-report', (0, middleware_1.validate)(parentReports_1.sendBehavioralInsightsReportSchema), parentReportsController_1.ParentReportsController.sendBehavioralInsightsReport);
// Test endpoint to manually trigger weekly email scheduler (for testing only)
router.post('/test-trigger-weekly-reports', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Only allow in development or if explicitly enabled
    if (config_1.default.nodeEnv === 'production' && process.env.ALLOW_TEST_EMAIL_TRIGGER !== 'true') {
        return res.status(403).json({
            success: false,
            message: 'This endpoint is only available in development or when ALLOW_TEST_EMAIL_TRIGGER=true',
        });
    }
    try {
        console.log('[Test] Manually triggering weekly parent email reports...');
        await parentEmailScheduler_1.default.triggerWeeklyReports();
        res.json({
            success: true,
            message: 'Weekly parent email reports triggered successfully. Check server logs and parent email inboxes.',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('[Test] Error triggering weekly reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger weekly reports',
            error: error.message,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=parentReports.js.map