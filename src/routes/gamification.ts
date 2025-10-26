import { Router } from 'express';
import { GamificationController } from '../controllers/gamificationController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quiz routes
router.get('/quizzes', GamificationController.getQuizzes);
router.get('/quizzes/:id', GamificationController.getQuizById);

// Quiz attempt routes (students only)
router.post(
  '/quiz-attempts',
  authorize(UserRole.STUDENT),
  GamificationController.submitQuizAttempt
); 
router.get(
  '/quiz-attempts/recent',
  authorize(UserRole.STUDENT),
  GamificationController.getRecentAttempts
);

// User profile and progress routes (students only)
router.get(
  '/profile',
  authorize(UserRole.STUDENT),
  GamificationController.getUserProfile
);
router.get(
  '/progress',
  authorize(UserRole.STUDENT),
  GamificationController.getUserProgress
);

// Badge routes
router.get('/badges', GamificationController.getAvailableBadges);

// Leaderboard route
router.get('/leaderboard', GamificationController.getLeaderboard);

export default router;
