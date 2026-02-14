import { Router } from 'express';
import { SessionsController } from '../controllers/sessionsController';
import { TutorAvailabilityController } from '../controllers/tutorAvailabilityController';
import { TutorSessionController } from '../controllers/tutorSessionController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionsSchema,
  getSessionByIdSchema,
  updateSessionStatusSchema,
  getAvailabilitySchema,
  bookTutorSessionSchema,
  tutorCreateSessionSchema,
  tutorRescheduleSessionSchema,
  setAvailabilitySchema,
  addAvailabilitySchema,
  deleteAvailabilitySchema,
} from '../validation/session';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Session management routes
router.get('/sessions', validate(getSessionsSchema), SessionsController.getUserSessions);
router.get('/sessions/stats', SessionsController.getSessionStats);
router.get('/sessions/:id', validate(getSessionByIdSchema), SessionsController.getSessionById);
router.post('/sessions', validate(createSessionSchema), SessionsController.createSession);
router.put('/sessions/:id', validate(updateSessionSchema), SessionsController.updateSession);
router.delete('/sessions/:id', validate(getSessionByIdSchema), SessionsController.deleteSession);
router.patch(
  '/sessions/:id/status',
  validate(updateSessionStatusSchema),
  SessionsController.updateSessionStatus
);

// Tutor-related routes (for students to search and book tutors)
router.get('/sessions/tutors/search', SessionsController.searchTutors);
router.get(
  '/sessions/tutors/:tutorId/availability',
  validate(getAvailabilitySchema),
  SessionsController.getTutorAvailability
);
router.post(
  '/sessions/tutors/book',
  validate(bookTutorSessionSchema),
  SessionsController.bookTutorSession
);

// Tutor availability management (for tutors to set their calendar)
router.get('/tutor/availability', TutorAvailabilityController.getAvailability);
router.post('/tutor/availability', validate(setAvailabilitySchema), TutorAvailabilityController.setAvailability);
router.post(
  '/tutor/availability/add',
  validate(addAvailabilitySchema),
  TutorAvailabilityController.addAvailability
);
router.delete(
  '/tutor/availability/:id',
  validate(deleteAvailabilitySchema),
  TutorAvailabilityController.deleteAvailability
);

// Teacher-centric session management
router.get('/tutor/requests', TutorSessionController.getPendingRequests);
router.post('/tutor/requests/:id/approve', validate(getSessionByIdSchema), TutorSessionController.approveRequest);
router.post('/tutor/requests/:id/reject', validate(getSessionByIdSchema), TutorSessionController.rejectRequest);
router.post(
  '/tutor/sessions/create',
  validate(tutorCreateSessionSchema),
  TutorSessionController.createSession
);
router.post(
  '/tutor/sessions/:id/reschedule',
  validate(tutorRescheduleSessionSchema),
  TutorSessionController.rescheduleSession
);
router.post('/tutor/sessions/:id/cancel', validate(getSessionByIdSchema), TutorSessionController.cancelSession);

export default router;
