import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import { getUserNotificationsSchema, markNotificationReadSchema } from '../validation/user';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', validate(getUserNotificationsSchema), NotificationController.getNotifications);

// Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  validate(markNotificationReadSchema),
  NotificationController.markAsRead
);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Delete notification
router.delete(
  '/:notificationId',
  validate(markNotificationReadSchema),
  NotificationController.deleteNotification
);

export default router;
