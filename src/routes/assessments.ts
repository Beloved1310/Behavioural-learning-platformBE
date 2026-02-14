import { Router } from 'express';
import { AssessmentsController } from '../controllers/assessmentsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import { submitAssessmentSchema, getAssessmentTrendsSchema } from '../validation/assessments';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Assessments routes
router.get('/current', AssessmentsController.getCurrentAssessment);
router.post('/weekly', validate(submitAssessmentSchema), AssessmentsController.submitAssessment);
router.get('/trends', validate(getAssessmentTrendsSchema), AssessmentsController.getTrends);

export default router;
