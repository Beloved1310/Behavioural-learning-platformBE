/**
 * Unit Tests for NotificationRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import notificationRepository from '../../../repositories/NotificationRepository';
import { Types } from 'mongoose';

jest.mock('../../../models/Notification', () => ({
  Notification: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
}));

describe('NotificationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find notifications by user ID', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        type: 'goal_assigned',
        isRead: false,
        createdAt: new Date(),
      };

      jest.spyOn(notificationRepository as any, 'find').mockResolvedValue([mockNotification]);

      // Act
      const result = await notificationRepository.findByUserId(userId);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find unread notifications only', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        isRead: false,
      };

      jest.spyOn(notificationRepository as any, 'find').mockResolvedValue([mockNotification]);

      // Act
      const result = await notificationRepository.findByUserId(userId, { unreadOnly: true });

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('countByUserId', () => {
    it('should count notifications by user ID', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();

      jest.spyOn(notificationRepository as any, 'count').mockResolvedValue(5);

      // Act
      const result = await notificationRepository.countByUserId(userId);

      // Assert
      expect(result).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread count for user', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();

      jest.spyOn(notificationRepository as any, 'count').mockResolvedValue(3);

      // Act
      const result = await notificationRepository.getUnreadCount(userId);

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      // Arrange
      const notificationId = new Types.ObjectId().toString();

      jest.spyOn(notificationRepository as any, 'updateOne').mockResolvedValue({
        _id: new Types.ObjectId(notificationId),
        isRead: true,
      });

      // Act
      const result = await notificationRepository.markAsRead(notificationId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const { Notification } = await import('../../../models/Notification');

      // @ts-expect-error - Mock type inference issue
      (Notification.updateMany as any) = jest.fn().mockResolvedValue({ modifiedCount: 5 });

      // Act
      const result = await notificationRepository.markAllAsRead(userId);

      // Assert
      expect(result).toBeDefined();
    });
  });
});

