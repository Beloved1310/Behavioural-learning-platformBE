import { Router } from 'express';
import { CommitmentsController } from '../controllers/commitmentsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  createCommitmentsSchema,
  toggleCommitmentSchema,
  deleteCommitmentSchema,
} from '../validation/commitments';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Commitments routes
router.get('/current', CommitmentsController.getCurrentCommitments);
router.post('/weekly', validate(createCommitmentsSchema), CommitmentsController.createCommitments);
router.patch(
  '/:commitmentId/complete/:itemIndex',
  validate(toggleCommitmentSchema),
  CommitmentsController.toggleCommitment
);
router.get('/history', CommitmentsController.getHistory);
router.delete('/:commitmentId', validate(deleteCommitmentSchema), CommitmentsController.deleteCommitment);

export default router;
