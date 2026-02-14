import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import notificationService from '../services/notificationService';

export class NotificationController {
  // Get user notifications
  static getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type as string | undefined;

    const result = await notificationService.getNotifications(userId, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      unreadOnly,
      type,
    });

    res.json({
      success: true,
      ...result,
    });
  });

  // Get unread count
  static getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({ unreadCount: count });
  });

  // Mark notification as read
  static markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(userId, notificationId);

    res.json({
      message: 'Notification marked as read',
      notification,
    });
  });

  // Mark all notifications as read
  static markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await notificationService.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read',
      ...result,
    });
  });

  // Delete notification
  static deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    await notificationService.deleteNotification(userId, notificationId);

    res.json({ message: 'Notification deleted successfully' });
  });
}
