import { Router } from 'express';
import { SessionsController } from '../controllers/sessionsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Session management routes
router.get('/sessions', SessionsController.getUserSessions);
router.get('/sessions/stats', SessionsController.getSessionStats);
router.get('/sessions/:id', SessionsController.getSessionById);
router.post('/sessions', SessionsController.createSession);
router.put('/sessions/:id', SessionsController.updateSession);
router.delete('/sessions/:id', SessionsController.deleteSession);
router.patch('/sessions/:id/status', SessionsController.updateSessionStatus);

// Tutor-related routes
router.get('/tutors/search', SessionsController.searchTutors);
router.get('/tutors/:tutorId/availability', SessionsController.getTutorAvailability);
router.post('/tutors/book', SessionsController.bookTutorSession);

export default router;
