import { Router } from 'express';
import { MilestonesController } from '../controllers/milestonesController';
import { authenticate } from '../middleware/auth';
// Note: checkMilestones doesn't require validation (no body/params)

const router = Router();

// All routes require authentication
router.use(authenticate);

// Milestones routes
router.get('/upcoming', MilestonesController.getUpcoming);
router.post('/check', MilestonesController.checkMilestones);

export default router;
