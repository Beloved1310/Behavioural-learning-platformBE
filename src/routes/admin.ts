import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import { validate } from '../validation/middleware';
import {
  getPendingTutorsSchema,
  getTutorByIdSchema,
  approveTutorSchema,
  rejectTutorSchema,
  setBackgroundCheckStatusSchema,
  getUserByIdSchema,
  updateUserStatusSchema,
} from '../validation/admin';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard stats
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Tutor management
router.get('/tutors/pending', validate(getPendingTutorsSchema), AdminController.getPendingTutors);
router.get('/tutors/:tutorId', validate(getTutorByIdSchema), AdminController.getTutorById);
router.post('/tutors/:tutorId/approve', validate(approveTutorSchema), AdminController.approveTutor);
router.post('/tutors/:tutorId/reject', validate(rejectTutorSchema), AdminController.rejectTutor);
router.patch(
  '/tutors/:tutorId/background-check',
  validate(setBackgroundCheckStatusSchema),
  AdminController.setBackgroundCheckStatus
);

// User management
router.get('/users', AdminController.getAllUsers);
router.get('/users/:userId', validate(getUserByIdSchema), AdminController.getUserById);
router.patch('/users/:userId/status', validate(updateUserStatusSchema), AdminController.updateUserStatus);

export default router;
