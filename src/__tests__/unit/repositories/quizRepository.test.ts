/**
 * Unit Tests for QuizRepository
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';
import { quizRepository } from '../../../repositories/QuizRepository';
import { Quiz } from '../../../models/Quiz';

// Mock the Quiz model
jest.mock('../../../models/Quiz');

describe('QuizRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findActive', () => {
    it('should find active quizzes', async () => {
      const mockQuizzes = [
        { _id: new Types.ObjectId(), title: 'Quiz 1', isActive: true },
        { _id: new Types.ObjectId(), title: 'Quiz 2', isActive: true },
      ];

      (Quiz.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockQuizzes);

      const result = await quizRepository.findActive();

      expect(Quiz.find).toHaveBeenCalledWith({ isActive: true }, null, { sort: { createdAt: -1 } });
      expect(result).toEqual(mockQuizzes);
    });

    it('should find active quizzes with additional filter', async () => {
      const mockQuizzes = [{ _id: new Types.ObjectId(), title: 'Math Quiz', isActive: true }];

      (Quiz.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockQuizzes);

      const result = await quizRepository.findActive({ subject: 'Math' });

      expect(Quiz.find).toHaveBeenCalledWith({ isActive: true, subject: 'Math' }, null, {
        sort: { createdAt: -1 },
      });
      expect(result).toEqual(mockQuizzes);
    });

    it('should return empty array when no active quizzes found', async () => {
      (Quiz.find as jest.Mock) = (jest.fn() as any).mockResolvedValue([]);

      const result = await quizRepository.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('findActiveById', () => {
    it('should find active quiz by ID', async () => {
      const quizId = new Types.ObjectId().toString();
      const mockQuiz = {
        _id: new Types.ObjectId(quizId),
        title: 'Test Quiz',
        isActive: true,
      };

      (Quiz.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockQuiz);

      const result = await quizRepository.findActiveById(quizId);

      expect(Quiz.findOne).toHaveBeenCalledWith({ _id: quizId, isActive: true }, null, undefined);
      expect(result).toEqual(mockQuiz);
    });

    it('should return null when quiz not found', async () => {
      const quizId = new Types.ObjectId().toString();

      (Quiz.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await quizRepository.findActiveById(quizId);

      expect(result).toBeNull();
    });

    it('should return null when quiz is not active', async () => {
      const quizId = new Types.ObjectId().toString();

      (Quiz.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await quizRepository.findActiveById(quizId);

      expect(result).toBeNull();
    });
  });
});
