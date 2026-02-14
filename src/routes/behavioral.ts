import { Router } from 'express';
import { BehavioralController } from '../controllers/behavioralController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  trackEventSchema,
  generateProgressReportSchema,
  daysQuerySchema,
  limitQuerySchema,
  eventTypeQuerySchema,
  recommendationTypeQuerySchema,
  progressReportQuerySchema,
  maxPromptsQuerySchema,
  generateRecommendationsSchema,
  markRecommendationReadSchema,
  markRecommendationActionedSchema,
  trackEngagementSchema,
} from '../validation/behavioral';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Event Tracking Routes ============
router.post('/events', validate({ body: trackEventSchema }), BehavioralController.trackEvent);

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
  '/insights/consistency-score',
  validate({ query: daysQuerySchema }),
  BehavioralController.getConsistencyScore
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
  validate(generateRecommendationsSchema),
  BehavioralController.generateRecommendations
);

router.patch(
  '/recommendations/:id/read',
  validate(markRecommendationReadSchema),
  BehavioralController.markRecommendationAsRead
);

router.patch(
  '/recommendations/:id/actioned',
  validate(markRecommendationActionedSchema),
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

// ============ MVP: Engagement Tracking Routes ============
router.post(
  '/engagement/track',
  validate({ body: trackEngagementSchema }),
  BehavioralController.trackEngagement
);

router.post('/engagement/data', BehavioralController.recordBehavioralData); // Has manual validation in controller

// ============ MVP: Basic Progress Summary Routes ============
router.get('/progress/weekly', BehavioralController.getWeeklyProgressSummary);

// ============ MVP: Motivational Nudges Routes ============
router.get(
  '/nudges',
  validate({ query: maxPromptsQuerySchema }),
  BehavioralController.getMotivationalNudges
);

// ============ MVP: Reflection Prompts Routes ============
router.get('/reflection-prompts', BehavioralController.getReflectionPrompts);

// ============ Legacy: Motivational System Routes (kept for backward compatibility) ============
router.get(
  '/motivational-prompts',
  validate({ query: maxPromptsQuerySchema }),
  BehavioralController.getMotivationalPrompts
);

export default router;
