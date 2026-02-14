/**
 * Unit Tests for NotificationController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { NotificationController } from '../../../controllers/notificationController';
import notificationService from '../../../services/notificationService';

// Mock dependencies
jest.mock('../../../services/notificationService');

describe('NotificationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
      },
      query: {},
      params: {},
    } as any;

    mockResponse = {
      json: jest.fn(),
    } as any;

    mockNext = jest.fn();
  });

  describe('getNotifications', () => {
    it('should return all notifications with default pagination', async () => {
      // Arrange
      const mockResult = {
        notifications: [{ id: '1', message: 'Test notification', read: false }],
        total: 1,
        page: 1,
        limit: 20,
      };

      (notificationService.getNotifications as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      // Act
      await NotificationController.getNotifications(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          page: 1,
          limit: 20,
          unreadOnly: false,
          type: undefined,
        }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should return only unread notifications when unreadOnly is true', async () => {
      // Arrange
      mockRequest.query = { unreadOnly: 'true' };

      const mockResult = {
        notifications: [{ id: '1', message: 'Unread notification', read: false }],
        total: 1,
        page: 1,
        limit: 20,
      };

      (notificationService.getNotifications as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      // Act
      await NotificationController.getNotifications(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          page: 1,
          limit: 20,
          unreadOnly: true,
          type: undefined,
        }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should filter by notification type', async () => {
      // Arrange
      mockRequest.query = { type: 'ACHIEVEMENT' };

      const mockResult = {
        notifications: [{ id: '1', message: 'Achievement notification', type: 'ACHIEVEMENT' }],
        total: 1,
        page: 1,
        limit: 20,
      };

      (notificationService.getNotifications as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      // Act
      await NotificationController.getNotifications(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          page: 1,
          limit: 20,
          unreadOnly: false,
          type: 'ACHIEVEMENT',
        }
      );
    });

    it('should use custom pagination parameters', async () => {
      // Arrange
      mockRequest.query = { page: '2', limit: '10' };

      const mockResult = {
        notifications: [],
        total: 0,
        page: 2,
        limit: 10,
      };

      (notificationService.getNotifications as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      // Act
      await NotificationController.getNotifications(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          page: 2,
          limit: 10,
          unreadOnly: false,
          type: undefined,
        }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      // Arrange
      (notificationService.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(5);

      // Act
      await NotificationController.getUnreadCount(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getUnreadCount).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({ unreadCount: 5 });
    });

    it('should return zero when no unread notifications', async () => {
      // Arrange
      (notificationService.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(0);

      // Act
      await NotificationController.getUnreadCount(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({ unreadCount: 0 });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      // Arrange
      mockRequest.params = { notificationId: 'notification123' };

      const mockNotification = {
        id: 'notification123',
        message: 'Test notification',
        read: true,
      };

      (notificationService.markAsRead as jest.MockedFunction<any>).mockResolvedValue(
        mockNotification
      );

      // Act
      await NotificationController.markAsRead(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'notification123'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Notification marked as read',
        notification: mockNotification,
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      // Arrange
      const mockResult = {
        updatedCount: 5,
      };

      (notificationService.markAllAsRead as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await NotificationController.markAllAsRead(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'All notifications marked as read',
        ...mockResult,
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      // Arrange
      mockRequest.params = { notificationId: 'notification123' };

      (notificationService.deleteNotification as jest.MockedFunction<any>).mockResolvedValue(
        undefined
      );

      // Act
      await NotificationController.deleteNotification(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.deleteNotification).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'notification123'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Notification deleted successfully',
      });
    });
  });
});
