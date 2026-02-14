/**
 * Unit Tests for ChatRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import chatRepository from '../../../repositories/ChatRepository';
import { Types } from 'mongoose';

jest.mock('../../../models/Chat', () => ({
  Chat: {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        sort: jest.fn().mockResolvedValue([]),
      }),
    }),
    findOne: jest.fn().mockReturnValue({
      // @ts-expect-error - Mock type inference issue
      populate: jest.fn().mockResolvedValue(null),
    }),
    create: jest.fn(),
  },
}));

describe('ChatRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserChats', () => {
    it('should find user chats', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const { Chat } = await import('../../../models/Chat');
      const mockChat = {
        _id: new Types.ObjectId(),
        participants: [],
        title: 'Test Chat',
      };

      (Chat.find as any) = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          // @ts-expect-error - Mock type inference issue
          sort: jest.fn().mockResolvedValue([mockChat]),
        }),
      });

      // Act
      const result = await chatRepository.findUserChats(userId);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find user chats with search term', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const { Chat } = await import('../../../models/Chat');

      (Chat.find as any) = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          // @ts-expect-error - Mock type inference issue
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      // Act
      const result = await chatRepository.findUserChats(userId, 'test');

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('findOrCreate', () => {
    it('should find existing chat', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const otherUserId = new Types.ObjectId().toString();
      const { Chat } = await import('../../../models/Chat');
      const mockChat = {
        _id: new Types.ObjectId(),
        participants: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
      };

      (Chat.findOne as any) = jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue(mockChat),
      });

      // Act
      const result = await chatRepository.findOrCreate(userId, otherUserId);

      // Assert
      expect(result).toBeDefined();
    });

    it('should create new chat if not found', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const otherUserId = new Types.ObjectId().toString();
      const { Chat } = await import('../../../models/Chat');
      const mockChat = {
        _id: new Types.ObjectId(),
        participants: [],
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue({}),
      };

      (Chat.findOne as any) = jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue(null),
      });
      // @ts-expect-error - Mock type inference issue
      (Chat.create as any) = jest.fn().mockResolvedValue(mockChat);

      // Act
      const result = await chatRepository.findOrCreate(userId, otherUserId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('isParticipant', () => {
    it('should check if user is participant', async () => {
      // Arrange
      const chatId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const { Chat } = await import('../../../models/Chat');
      const mockChat = {
        _id: new Types.ObjectId(chatId),
        participants: [new Types.ObjectId(userId)],
      };

      // @ts-expect-error - Mock type inference issue
      (Chat.findOne as any) = jest.fn().mockResolvedValue(mockChat);

      // Act
      const result = await chatRepository.isParticipant(chatId, userId);

      // Assert
      expect(result).toBeDefined();
    });
  });
});

