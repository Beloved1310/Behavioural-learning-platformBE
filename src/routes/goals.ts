import { Router } from 'express';
import { GoalsController } from '../controllers/goalsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  createGoalSchema,
  updateGoalProgressSchema,
  getGoalMilestonesSchema,
  deleteGoalSchema,
} from '../validation/goals';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Goals routes
router.get('/progress', GoalsController.getGoals);
router.post('/', validate(createGoalSchema), GoalsController.createGoal);
router.get('/:goalId/milestones', validate(getGoalMilestonesSchema), GoalsController.getMilestones);
router.post('/:goalId/progress', validate(updateGoalProgressSchema), GoalsController.updateProgress);
router.delete('/:goalId', validate(deleteGoalSchema), GoalsController.deleteGoal);

export default router;
