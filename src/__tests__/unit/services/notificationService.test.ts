/**
 * Unit Tests for NotificationService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import notificationService from '../../../services/notificationService';
import notificationRepository from '../../../repositories/NotificationRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/NotificationRepository');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      // Arrange
      const mockNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        type: 'system_announcement',
        title: 'Test Notification',
        message: 'Test message',
        data: {},
        isRead: false,
        createdAt: new Date(),
      };

      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      const result = await notificationService.createNotification({
        userId: '507f1f77bcf86cd799439011',
        type: 'system_announcement',
        title: 'Test Notification',
        message: 'Test message',
      });

      // Assert
      expect(result).toBeDefined();
      expect(notificationRepository.create).toHaveBeenCalled();
    });

    it('should include optional data field', async () => {
      // Arrange
      const mockNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        type: 'system_announcement',
        title: 'Test Notification',
        message: 'Test message',
        data: { key: 'value' },
        isRead: false,
        createdAt: new Date(),
      };

      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      const result = await notificationService.createNotification({
        userId: '507f1f77bcf86cd799439011',
        type: 'system_announcement',
        title: 'Test Notification',
        message: 'Test message',
        data: { key: 'value' },
      });

      // Assert
      expect(result).toBeDefined();
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { key: 'value' },
        })
      );
    });
  });

  describe('createBulkNotifications', () => {
    it('should create multiple notifications', async () => {
      // Arrange
      const notifications = [
        {
          userId: '507f1f77bcf86cd799439011',
          type: 'system_announcement',
          title: 'Notification 1',
          message: 'Message 1',
        },
        {
          userId: '507f1f77bcf86cd799439011',
          type: 'message_received',
          title: 'Notification 2',
          message: 'Message 2',
        },
      ];

      (notificationRepository.createMany as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await notificationService.createBulkNotifications(notifications);

      // Assert
      expect(result).toBeDefined();
      expect(notificationRepository.createMany).toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should get notifications with pagination', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockNotifications = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          type: 'system_announcement',
          title: 'Test',
          message: 'Test message',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      (notificationRepository.countByUserId as jest.MockedFunction<any>).mockResolvedValue(1);
      (notificationRepository.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(1);
      (notificationRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue(
        mockNotifications
      );

      // Act
      const result = await notificationService.getNotifications(userId, {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.notifications).toBeDefined();
      expect(result.unreadCount).toBe(1);
      expect(result.pagination).toBeDefined();
    });

    it('should filter by unreadOnly', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (notificationRepository.countByUserId as jest.MockedFunction<any>).mockResolvedValue(0);
      (notificationRepository.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(0);
      (notificationRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      await notificationService.getNotifications(userId, {
        unreadOnly: true,
      });

      // Assert
      expect(notificationRepository.countByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ unreadOnly: true })
      );
    });

    it('should filter by type', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (notificationRepository.countByUserId as jest.MockedFunction<any>).mockResolvedValue(0);
      (notificationRepository.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(0);
      (notificationRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      await notificationService.getNotifications(userId, {
        type: 'system_announcement',
      });

      // Assert
      expect(notificationRepository.countByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ type: 'system_announcement' })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (notificationRepository.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(5);

      // Act
      const result = await notificationService.getUnreadCount(userId);

      // Assert
      expect(result).toBe(5);
      expect(notificationRepository.getUnreadCount).toHaveBeenCalledWith(userId);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const notificationId = '507f1f77bcf86cd799439012';
      const mockNotification = {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
        type: 'system_announcement',
        title: 'Test',
        message: 'Test message',
        isRead: true,
        createdAt: new Date(),
      };

      (notificationRepository.findById as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );
      (notificationRepository.markAsRead as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      const result = await notificationService.markAsRead(userId, notificationId);

      // Assert
      expect(result).toBeDefined();
      expect(result.isRead).toBe(true);
    });

    it('should throw error when notification not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const notificationId = '507f1f77bcf86cd799439012';
      (notificationRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(notificationService.markAsRead(userId, notificationId)).rejects.toThrow(
        AppError
      );
      await expect(notificationService.markAsRead(userId, notificationId)).rejects.toThrow(
        'Notification not found'
      );
    });

    it('should throw error when notification belongs to different user', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const notificationId = '507f1f77bcf86cd799439012';
      const mockNotification = {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
        type: 'system_announcement',
        title: 'Test',
        message: 'Test message',
        isRead: false,
        createdAt: new Date(),
      };

      (notificationRepository.findById as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act & Assert
      await expect(notificationService.markAsRead(userId, notificationId)).rejects.toThrow(
        AppError
      );
      await expect(notificationService.markAsRead(userId, notificationId)).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (notificationRepository.markAllAsRead as jest.MockedFunction<any>).mockResolvedValue({
        modifiedCount: 5,
      });

      // Act
      const result = await notificationService.markAllAsRead(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.updatedCount).toBe(5);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const notificationId = '507f1f77bcf86cd799439012';
      const mockNotification = {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
        type: 'system_announcement',
        title: 'Test',
        message: 'Test message',
        isRead: false,
        createdAt: new Date(),
      };

      (notificationRepository.findById as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );
      (notificationRepository.deleteById as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      const result = await notificationService.deleteNotification(userId, notificationId);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should throw error when notification not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const notificationId = '507f1f77bcf86cd799439012';
      (notificationRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(notificationService.deleteNotification(userId, notificationId)).rejects.toThrow(
        AppError
      );
    });
  });

  describe('notifyGoalApproved', () => {
    it('should create goal approved notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const goalTitle = 'Complete 100 exercises';
      const mockNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        type: 'system_announcement',
        title: 'Goal Approved! 🎉',
        message: `Your goal "${goalTitle}" has been approved by your tutor.`,
        data: { goalTitle },
      };

      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      const result = await notificationService.notifyGoalApproved(userId, goalTitle);

      // Assert
      expect(result).toBeDefined();
      expect(notificationRepository.create).toHaveBeenCalled();
    });
  });

  describe('notifyGoalRejected', () => {
    it('should create goal rejected notification with feedback', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const goalTitle = 'Complete 100 exercises';
      const feedback = 'Please be more specific';
      const mockNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        type: 'system_announcement',
        title: 'Goal Needs Revision',
        message: `Your goal "${goalTitle}" was not approved. Feedback: ${feedback}`,
        data: { goalTitle, feedback },
      };

      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      const result = await notificationService.notifyGoalRejected(userId, goalTitle, feedback);

      // Assert
      expect(result).toBeDefined();
    });

    it('should create goal rejected notification without feedback', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const goalTitle = 'Complete 100 exercises';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyGoalRejected(userId, goalTitle);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifyGoalAssigned', () => {
    it('should create goal assigned notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const goalTitle = 'Complete 100 exercises';
      const tutorName = 'John Doe';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyGoalAssigned(userId, goalTitle, tutorName);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifyCommitmentAssigned', () => {
    it('should create commitment assigned notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const tutorName = 'John Doe';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyCommitmentAssigned(userId, tutorName);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifyReflectionFeedback', () => {
    it('should create reflection feedback notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const tutorName = 'John Doe';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyReflectionFeedback(userId, tutorName);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifyAssessmentFeedback', () => {
    it('should create assessment feedback notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const tutorName = 'John Doe';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyAssessmentFeedback(userId, tutorName);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifyMilestoneAchieved', () => {
    it('should create milestone achieved notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const milestoneTitle = '7-Day Streak';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyMilestoneAchieved(userId, milestoneTitle);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifySessionReminder', () => {
    it('should create session reminder notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const sessionTitle = 'Math Tutoring';
      const scheduledAt = new Date();
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifySessionReminder(
        userId,
        sessionTitle,
        scheduledAt
      );

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('notifyStudyReminder', () => {
    it('should create study reminder notification', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const reminderTitle = 'Time to study!';
      (notificationRepository.create as jest.MockedFunction<any>).mockResolvedValue({});

      // Act
      const result = await notificationService.notifyStudyReminder(userId, reminderTitle);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
