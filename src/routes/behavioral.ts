import { Router } from 'express';
import { BehavioralController } from '../controllers/behavioralController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  logMoodSchema,
  trackEventSchema,
  generateProgressReportSchema,
  daysQuerySchema,
  limitQuerySchema,
  eventTypeQuerySchema,
  recommendationTypeQuerySchema,
  progressReportQuerySchema,
  maxPromptsQuerySchema
} from '../validation/behavioral';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Mood Tracking Routes ============
router.post(
  '/mood',
  validate({ body: logMoodSchema }),
  BehavioralController.logMood
);

router.get(
  '/mood/history',
  validate({ query: limitQuerySchema }),
  BehavioralController.getMoodHistory
);

router.get(
  '/mood/distribution',
  validate({ query: daysQuerySchema }),
  BehavioralController.getMoodDistribution
);

router.get(
  '/mood/trends',
  validate({ query: daysQuerySchema }),
  BehavioralController.getMoodTrends
);

// ============ Event Tracking Routes ============
router.post(
  '/events',
  validate({ body: trackEventSchema }),
  BehavioralController.trackEvent
);

router.get(
  '/events/history',
  validate({ query: eventTypeQuerySchema }),
  BehavioralController.getEventHistory
);

router.get(
  '/events/counts',
  validate({ query: daysQuerySchema }),
  BehavioralController.getEventCounts
);

router.get(
  '/events/page-views',
  validate({ query: daysQuerySchema }),
  BehavioralController.getPageViews
);

// ============ Insights Routes ============
router.get(
  '/insights',
  validate({ query: daysQuerySchema }),
  BehavioralController.getBehavioralInsights
);

router.get(
  '/insights/consistency',
  validate({ query: daysQuerySchema }),
  BehavioralController.getStudyConsistency
);

router.get(
  '/insights/sentiment',
  validate({ query: daysQuerySchema }),
  BehavioralController.getSentimentAnalysis
);

// ============ Recommendations Routes ============
router.get(
  '/recommendations',
  validate({ query: recommendationTypeQuerySchema }),
  BehavioralController.getRecommendations
);

router.post(
  '/recommendations/generate',
  BehavioralController.generateRecommendations
);

router.patch(
  '/recommendations/:id/read',
  BehavioralController.markRecommendationAsRead
);

router.patch(
  '/recommendations/:id/actioned',
  BehavioralController.markRecommendationAsActioned
);

// ============ Progress Reports Routes ============
router.get(
  '/reports',
  validate({ query: progressReportQuerySchema }),
  BehavioralController.getProgressReports
);

router.post(
  '/reports/generate',
  validate({ body: generateProgressReportSchema }),
  BehavioralController.generateProgressReport
);

// ============ Motivational System Routes ============
router.get(
  '/motivational-prompts',
  validate({ query: maxPromptsQuerySchema }),
  BehavioralController.getMotivationalPrompts
);

export default router;
