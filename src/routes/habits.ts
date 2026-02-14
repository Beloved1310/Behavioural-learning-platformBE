import { Router } from 'express';
import { HabitsController } from '../controllers/habitsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Habits routes
router.get('/heatmap', HabitsController.getHeatmap);
router.get('/streaks', HabitsController.getStreaks);

export default router;
