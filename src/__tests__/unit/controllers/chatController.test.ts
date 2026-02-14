/**
 * Unit Tests for ChatController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { ChatController } from '../../../controllers/chatController';
import { ChatService } from '../../../services/chatService';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { AppError } from '../../../middleware/errorHandler';
import { UserRole } from '../../../types';

// Mock dependencies
jest.mock('../../../services/chatService');

describe('ChatController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
        role: UserRole.STUDENT,
      },
      body: {},
      query: {},
      params: {},
    } as AuthenticatedRequest;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
  });

  describe('getUserChats', () => {
    it('should return user chats with pagination', async () => {
      const mockResult = {
        chats: [{ id: 'chat1', participants: [] }],
        total: 1,
      };

      (ChatService.getUserChats as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { page: '1', limit: '20' };

      ChatController.getUserChats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getUserChats).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        undefined,
        1,
        20,
        0
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        chats: expect.any(Array),
        pagination: expect.any(Object),
      });
    });

    it('should handle search query', async () => {
      const mockResult = {
        chats: [],
        total: 0,
      };

      (ChatService.getUserChats as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { search: 'john', page: '1', limit: '20' };

      ChatController.getUserChats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getUserChats).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'john',
        1,
        20,
        0
      );
    });
  });

  describe('getChatById', () => {
    it('should return chat by ID', async () => {
      const mockChat = {
        id: 'chat1',
        participants: [],
        messages: [],
      };

      (ChatService.getChatById as jest.MockedFunction<any>).mockResolvedValue(mockChat);
      (mockRequest.params as any) = { chatId: 'chat1' };

      ChatController.getChatById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getChatById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'chat1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        chat: mockChat,
      });
    });
  });

  describe('getOrCreateChat', () => {
    it('should get or create chat successfully', async () => {
      const mockChat = {
        id: 'chat1',
        participants: [],
      };

      (ChatService.getOrCreateChat as jest.MockedFunction<any>).mockResolvedValue(mockChat);
      (mockRequest.body as any) = { otherUserId: 'otherUserId' };

      ChatController.getOrCreateChat(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getOrCreateChat).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'otherUserId'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        chat: mockChat,
      });
    });

    it('should throw error when otherUserId is missing', async () => {
      (mockRequest.body as any) = {};

      ChatController.getOrCreateChat(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Other user ID is required');
    });
  });

  describe('createNewChat', () => {
    it('should create new chat successfully', async () => {
      const mockChat = {
        id: 'chat1',
        participants: [],
        isExisting: false,
      };

      (ChatService.createNewChat as jest.MockedFunction<any>).mockResolvedValue(mockChat);
      (mockRequest.body as any) = { otherUserId: 'otherUserId', title: 'New Chat' };

      ChatController.createNewChat(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.createNewChat).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'otherUserId',
        UserRole.STUDENT,
        'New Chat',
        true
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'New chat created successfully',
        chat: mockChat,
      });
    });

    it('should return existing chat when returnExisting is true', async () => {
      const mockChat = {
        id: 'chat1',
        participants: [],
        isExisting: true,
      };

      (ChatService.createNewChat as jest.MockedFunction<any>).mockResolvedValue(mockChat);
      (mockRequest.body as any) = { otherUserId: 'otherUserId', returnExisting: true };

      ChatController.createNewChat(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Existing chat retrieved',
        chat: mockChat,
      });
    });

    it('should throw error when otherUserId is missing', async () => {
      (mockRequest.body as any) = {};

      ChatController.createNewChat(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Other user ID is required');
    });
  });

  describe('getChatMessages', () => {
    it('should return chat messages with pagination', async () => {
      const mockResult = {
        messages: [{ id: 'msg1', content: 'Hello', senderId: 'user1' }],
        total: 1,
      };

      (ChatService.getChatMessages as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.params as any) = { chatId: 'chat1' };
      (mockRequest.query as any) = { page: '1', limit: '50' };

      ChatController.getChatMessages(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getChatMessages).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'chat1',
        1,
        50,
        0
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        messages: expect.any(Array),
        pagination: expect.any(Object),
      });
    });

    it('should handle default pagination', async () => {
      const mockResult = {
        messages: [],
        total: 0,
      };

      (ChatService.getChatMessages as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.params as any) = { chatId: 'chat1' };

      ChatController.getChatMessages(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getChatMessages).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'chat1',
        1,
        50,
        0
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      (ChatService.markMessagesAsRead as jest.MockedFunction<any>).mockResolvedValue(undefined);
      (mockRequest.params as any) = { chatId: 'chat1' };

      ChatController.markMessagesAsRead(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.markMessagesAsRead).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'chat1'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Messages marked as read',
      });
    });
  });

  describe('deleteChat', () => {
    it('should delete chat successfully', async () => {
      (ChatService.deleteChat as jest.MockedFunction<any>).mockResolvedValue(undefined);
      (mockRequest.params as any) = { chatId: 'chat1' };

      ChatController.deleteChat(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.deleteChat).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'chat1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Chat deleted successfully',
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      (ChatService.getUnreadCount as jest.MockedFunction<any>).mockResolvedValue(5);

      ChatController.getUnreadCount(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getUnreadCount).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        unreadCount: 5,
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users with pagination', async () => {
      const mockResult = {
        users: [{ id: 'user1', firstName: 'John', lastName: 'Doe' }],
        total: 1,
      };

      (ChatService.searchUsers as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { query: 'john', page: '1', limit: '20' };

      ChatController.searchUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.searchUsers).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'john',
        UserRole.STUDENT,
        1,
        20,
        0
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        users: expect.any(Array),
        pagination: expect.any(Object),
      });
    });
  });

  describe('getAvailableUsers', () => {
    it('should return available users with pagination', async () => {
      const mockResult = {
        users: [{ id: 'user1', firstName: 'John', lastName: 'Doe' }],
        total: 1,
      };

      (ChatService.getAvailableUsers as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { page: '1', limit: '20' };

      ChatController.getAvailableUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getAvailableUsers).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        UserRole.STUDENT,
        1,
        20,
        0
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        users: expect.any(Array),
        pagination: expect.any(Object),
      });
    });

    it('should handle tutor role', async () => {
      const mockResult = {
        users: [],
        total: 0,
      };

      (mockRequest.user as any).role = UserRole.TUTOR;
      (ChatService.getAvailableUsers as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      ChatController.getAvailableUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.getAvailableUsers).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        UserRole.TUTOR,
        1,
        20,
        0
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockMessage = {
        id: 'msg1',
        content: 'Hello',
        senderId: '507f1f77bcf86cd799439011',
        chatId: 'chat1',
      };

      (ChatService.sendMessage as jest.MockedFunction<any>).mockResolvedValue(mockMessage);
      (mockRequest.params as any) = { chatId: 'chat1' };
      (mockRequest.body as any) = {
        content: 'Hello',
        type: 'text',
      };

      ChatController.sendMessage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.sendMessage).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'chat1',
        expect.objectContaining({
          content: 'Hello',
          type: 'text',
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: mockMessage,
      });
    });

    it('should send message with file', async () => {
      const mockMessage = {
        id: 'msg1',
        content: '',
        type: 'file',
        fileUrl: 'https://example.com/file.pdf',
        fileName: 'document.pdf',
      };

      (ChatService.sendMessage as jest.MockedFunction<any>).mockResolvedValue(mockMessage);
      (mockRequest.params as any) = { chatId: 'chat1' };
      (mockRequest.body as any) = {
        type: 'file',
        fileUrl: 'https://example.com/file.pdf',
        fileName: 'document.pdf',
      };

      ChatController.sendMessage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChatService.sendMessage).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'chat1',
        expect.objectContaining({
          type: 'file',
          fileUrl: 'https://example.com/file.pdf',
          fileName: 'document.pdf',
        })
      );
    });
  });
});
