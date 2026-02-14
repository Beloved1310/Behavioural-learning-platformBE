import { Types } from 'mongoose';
import notificationRepository from '../repositories/NotificationRepository';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { AppError } from '../middleware/errorHandler';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationData) {
    return await notificationRepository.create({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
    } as any);
  }

  /**
   * Create multiple notifications (bulk)
   */
  async createBulkNotifications(notifications: CreateNotificationData[]) {
    const notificationDocs = notifications.map((notif) => ({
      userId: new Types.ObjectId(notif.userId),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data || {},
    }));

    return await notificationRepository.createMany(notificationDocs as any[]);
  }

  /**
   * Get user notifications with pagination
   */
  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ) {
    const { page, limit, skip } = getPaginationParams(
      { query: options } as any,
      options.limit || 20,
      100
    );

    const total = await notificationRepository.countByUserId(userId, {
      unreadOnly: options.unreadOnly,
      type: options.type,
    });

    const unreadCount = await notificationRepository.getUnreadCount(userId);

    const notifications = await notificationRepository.findByUserId(userId, {
      unreadOnly: options.unreadOnly,
      type: options.type,
      page,
      limit,
      skip,
    });

    const transformedNotifications = (notifications as any[]).map((notif) => ({
      id: (notif as any)._id.toString(),
      userId: (notif as any).userId.toString(),
      type: (notif as any).type,
      title: (notif as any).title,
      message: (notif as any).message,
      data: (notif as any).data || {},
      isRead: (notif as any).isRead,
      createdAt: (notif as any).createdAt,
    }));

    const paginationResult = createPaginationResult(transformedNotifications, total, page, limit);

    return {
      notifications: paginationResult.data,
      unreadCount,
      pagination: paginationResult.pagination,
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await notificationRepository.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    // First verify the notification exists and belongs to user
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if ((notification as any).userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    const updated = await notificationRepository.markAsRead(notificationId);

    if (!updated) {
      throw new AppError('Failed to update notification', 500);
    }

    return {
      id: (updated as any)._id.toString(),
      userId: (updated as any).userId.toString(),
      type: (updated as any).type,
      title: (updated as any).title,
      message: (updated as any).message,
      data: (updated as any).data || {},
      isRead: (updated as any).isRead,
      createdAt: (updated as any).createdAt,
    };
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string) {
    const result = await notificationRepository.markAllAsRead(userId);
    return {
      updatedCount: result.modifiedCount,
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    // First verify the notification exists and belongs to user
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if ((notification as any).userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    await notificationRepository.deleteById(notificationId);
    return { success: true };
  }

  /**
   * Create notification when goal is approved
   */
  async notifyGoalApproved(userId: string, goalTitle: string) {
    return await this.createNotification({
      userId,
      type: 'system_announcement',
      title: 'Goal Approved! 🎉',
      message: `Your goal "${goalTitle}" has been approved by your tutor.`,
      data: { goalTitle },
    });
  }

  /**
   * Create notification when goal is rejected
   */
  async notifyGoalRejected(userId: string, goalTitle: string, feedback?: string) {
    return await this.createNotification({
      userId,
      type: 'system_announcement',
      title: 'Goal Needs Revision',
      message: `Your goal "${goalTitle}" was not approved. ${feedback ? `Feedback: ${feedback}` : 'Please review and resubmit.'}`,
      data: { goalTitle, feedback },
    });
  }

  /**
   * Create notification when tutor assigns goal
   */
  async notifyGoalAssigned(userId: string, goalTitle: string, tutorName: string) {
    return await this.createNotification({
      userId,
      type: 'system_announcement',
      title: 'New Goal Assigned',
      message: `${tutorName} has assigned you a new goal: "${goalTitle}"`,
      data: { goalTitle, tutorName },
    });
  }

  /**
   * Create notification when tutor assigns commitment
   */
  async notifyCommitmentAssigned(userId: string, tutorName: string) {
    return await this.createNotification({
      userId,
      type: 'system_announcement',
      title: 'New Weekly Commitment',
      message: `${tutorName} has assigned you weekly commitments. Check your dashboard to see them.`,
      data: { tutorName },
    });
  }

  /**
   * Create notification when tutor provides reflection feedback
   */
  async notifyReflectionFeedback(userId: string, tutorName: string) {
    return await this.createNotification({
      userId,
      type: 'message_received',
      title: 'Reflection Feedback',
      message: `${tutorName} has provided feedback on your reflection.`,
      data: { tutorName },
    });
  }

  /**
   * Create notification when tutor provides assessment feedback
   */
  async notifyAssessmentFeedback(userId: string, tutorName: string) {
    return await this.createNotification({
      userId,
      type: 'message_received',
      title: 'Assessment Feedback',
      message: `${tutorName} has provided feedback on your weekly assessment.`,
      data: { tutorName },
    });
  }

  /**
   * Create notification when milestone is achieved
   */
  async notifyMilestoneAchieved(userId: string, milestoneTitle: string) {
    return await this.createNotification({
      userId,
      type: 'badge_earned',
      title: 'Milestone Achieved! 🎉',
      message: `Congratulations! You've achieved: ${milestoneTitle}`,
      data: { milestoneTitle },
    });
  }

  /**
   * Create notification for session reminder
   */
  async notifySessionReminder(userId: string, sessionTitle: string, scheduledAt: Date) {
    return await this.createNotification({
      userId,
      type: 'session_reminder',
      title: 'Session Reminder',
      message: `You have a session "${sessionTitle}" coming up soon.`,
      data: { sessionTitle, scheduledAt },
    });
  }

  /**
   * Create notification for study reminder
   */
  async notifyStudyReminder(userId: string, reminderTitle: string) {
    return await this.createNotification({
      userId,
      type: 'study_reminder',
      title: 'Study Reminder',
      message: reminderTitle,
      data: { reminderTitle },
    });
  }
}

export default new NotificationService();
