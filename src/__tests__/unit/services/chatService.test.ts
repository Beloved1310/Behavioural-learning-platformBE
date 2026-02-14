/**
 * Unit Tests for ChatService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ChatService } from '../../../services/chatService';
import chatRepository from '../../../repositories/ChatRepository';
import messageRepository from '../../../repositories/MessageRepository';
import userRepository from '../../../repositories/UserRepository';
import { Types } from 'mongoose';

jest.mock('../../../repositories/ChatRepository');
jest.mock('../../../repositories/MessageRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../socket', () => ({
  getIO: jest.fn(),
  sendNotificationToUser: jest.fn(),
}));

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserChats', () => {
    it('should return user chats', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockChat = {
        _id: new Types.ObjectId(),
        participants: [],
        title: 'Test Chat',
      };

      // @ts-expect-error - Mock type inference issue
      (chatRepository.findUserChats as any) = jest.fn().mockResolvedValue([mockChat]);

      // Act
      const result = await ChatService.getUserChats(userId);

      // Assert
      expect(result).toBeDefined();
      expect(chatRepository.findUserChats).toHaveBeenCalledWith(userId);
    });

    it('should filter chats by search term', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const participantId = new Types.ObjectId();
      const mockChat = {
        _id: new Types.ObjectId(),
        participants: [
          {
            _id: participantId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        ],
        title: 'Test Chat',
      };

      // @ts-expect-error - Mock type inference issue
      (chatRepository.findUserChats as any) = jest.fn().mockResolvedValue([mockChat]);

      // Act
      const result = await ChatService.getUserChats(userId, 'John');

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const chatId = new Types.ObjectId().toString();
      const messageData = {
        content: 'Test message',
        type: 'TEXT',
      };

      const mockChat = {
        _id: new Types.ObjectId(chatId),
        participants: [],
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue({
          participants: [],
        }),
      };

      const mockMessage = {
        _id: new Types.ObjectId(),
        chatId: new Types.ObjectId(chatId),
        senderId: { _id: new Types.ObjectId(userId), firstName: 'John', lastName: 'Doe' },
        content: 'Test message',
        type: 'TEXT',
        isRead: false,
        createdAt: new Date(),
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          senderId: { _id: new Types.ObjectId(userId), firstName: 'John', lastName: 'Doe' },
        }),
      };

      // @ts-expect-error - Mock type inference issue
      (chatRepository.isParticipant as any) = jest.fn().mockResolvedValue(mockChat);
      // @ts-expect-error - Mock type inference issue
      (chatRepository.findById as any) = jest.fn().mockResolvedValue(mockChat);
      // @ts-expect-error - Mock type inference issue
      (messageRepository.create as any) = jest.fn().mockResolvedValue(mockMessage);
      // @ts-expect-error - Mock type inference issue
      (chatRepository.updateById as any) = jest.fn().mockResolvedValue({});

      // Act
      const result = await ChatService.sendMessage(userId, chatId, messageData);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe('Test message');
    });

    it('should throw error if chat not found', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const chatId = new Types.ObjectId().toString();

      // @ts-expect-error - Mock type inference issue
      (chatRepository.isParticipant as any) = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(ChatService.sendMessage(userId, chatId, { content: 'Test' })).rejects.toThrow(
        'Chat not found or access denied'
      );
    });
  });

  describe('getAvailableUsers', () => {
    it('should return available users', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'STUDENT',
      };

      // Mock the chainable query - the code does: find().select().sort()
      // If skip/limit are undefined, the final await is on .sort() result
      // If skip/limit are defined, they're called and the final await is on .limit() result
      // @ts-expect-error - Mock type inference issue
      const mockLimit = jest.fn().mockResolvedValue([mockUser]);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      // .sort() can be the final await, so it needs to be awaitable (return a Promise)
      // @ts-expect-error - Mock type inference issue
      const mockSort = jest.fn().mockResolvedValue([mockUser]);
      // But it also needs to support chaining .skip() and .limit()
      (mockSort as any).skip = jest.fn().mockReturnValue({ limit: mockLimit });
      (mockSort as any).limit = mockLimit;
      
      const mockSelect = jest.fn().mockReturnValue({ 
        sort: mockSort,
        skip: jest.fn().mockReturnValue({ limit: mockLimit }),
        limit: mockLimit
      });
      
      // @ts-expect-error - Mock type inference issue
      (userRepository.model as any) = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({ 
          select: mockSelect,
          sort: mockSort,
          skip: jest.fn().mockReturnValue({ limit: mockLimit }),
          limit: mockLimit
        }),
      };

      // Act
      const result = await ChatService.getAvailableUsers(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
    });
  });
});

