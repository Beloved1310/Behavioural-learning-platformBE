import { Router } from 'express';
import { GamificationController } from '../controllers/gamificationController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import { validate } from '../validation/middleware';
import {
  createQuizSchema,
  getQuizzesSchema,
  getQuizByIdSchema,
  submitQuizAttemptSchema,
} from '../validation/quiz';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quiz routes
router.post(
  '/quizzes',
  authorize(UserRole.TUTOR, UserRole.ADMIN),
  validate(createQuizSchema),
  GamificationController.createQuiz
);
router.get('/quizzes', validate(getQuizzesSchema), GamificationController.getQuizzes);
router.get('/quizzes/:id', validate(getQuizByIdSchema), GamificationController.getQuizById);

// Quiz attempt routes (students only)
router.post(
  '/quiz-attempts',
  authorize(UserRole.STUDENT),
  validate(submitQuizAttemptSchema),
  GamificationController.submitQuizAttempt
);
router.get(
  '/quiz-attempts/recent',
  authorize(UserRole.STUDENT),
  GamificationController.getRecentAttempts
);
router.get(
  '/quiz-attempts',
  authorize(UserRole.STUDENT, UserRole.PARENT),
  GamificationController.getQuizAttempts
);

// User profile and progress routes (students only)
router.get('/profile', authorize(UserRole.STUDENT), GamificationController.getUserProfile);
router.get('/progress', authorize(UserRole.STUDENT), GamificationController.getUserProgress);

// Badge routes
router.get('/badges', GamificationController.getAvailableBadges);

// Leaderboard route
router.get('/leaderboard', GamificationController.getLeaderboard);

export default router;
