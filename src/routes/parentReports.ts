import { Router } from 'express';
import { Response } from 'express';
import { ParentReportsController } from '../controllers/parentReportsController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import parentEmailScheduler from '../services/parentEmailScheduler';
import config from '../config';
import { validate } from '../validation/middleware';
import {
  sendProgressReportSchema,
  sendStudyHabitsReportSchema,
  sendBehavioralInsightsReportSchema,
} from '../validation/parentReports';

const router = Router();

// All routes require authentication and parent role
router.use(authenticate);
router.use(authorize(UserRole.PARENT));


// Send periodic reports
router.post(
  '/progress-report',
  validate(sendProgressReportSchema),
  ParentReportsController.sendProgressReport
);
router.post(
  '/study-habits-report',
  validate(sendStudyHabitsReportSchema),
  ParentReportsController.sendStudyHabitsReport
);
router.post(
  '/behavioral-insights-report',
  validate(sendBehavioralInsightsReportSchema),
  ParentReportsController.sendBehavioralInsightsReport
);

// Test endpoint to manually trigger weekly email scheduler (for testing only)
router.post(
  '/test-trigger-weekly-reports',
  asyncHandler(async (req: any, res: Response) => {
    // Only allow in development or if explicitly enabled
    if (config.nodeEnv === 'production' && process.env.ALLOW_TEST_EMAIL_TRIGGER !== 'true') {
      return res.status(403).json({
        success: false,
        message:
          'This endpoint is only available in development or when ALLOW_TEST_EMAIL_TRIGGER=true',
      });
    }

    try {
      console.log('[Test] Manually triggering weekly parent email reports...');
      await parentEmailScheduler.triggerWeeklyReports();

      res.json({
        success: true,
        message:
          'Weekly parent email reports triggered successfully. Check server logs and parent email inboxes.',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Test] Error triggering weekly reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger weekly reports',
        error: error.message,
      });
    }
  })
);

export default router;
