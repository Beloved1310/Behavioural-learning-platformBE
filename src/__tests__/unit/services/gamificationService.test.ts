/**
 * Unit Tests for GamificationService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GamificationService } from '../../../services/gamificationService';
import quizRepository from '../../../repositories/QuizRepository';
import quizAttemptRepository from '../../../repositories/QuizAttemptRepository';
import userRepository from '../../../repositories/UserRepository';
import userProgressRepository from '../../../repositories/UserProgressRepository';
import badgeRepository from '../../../repositories/BadgeRepository';
import userBadgeRepository from '../../../repositories/UserBadgeRepository';
import { Types } from 'mongoose';

jest.mock('../../../repositories/QuizRepository');
jest.mock('../../../repositories/QuizAttemptRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../repositories/UserProgressRepository');
jest.mock('../../../repositories/BadgeRepository');
jest.mock('../../../repositories/UserBadgeRepository');

describe('GamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('should create quiz successfully', async () => {
      // Arrange
      const quizData = {
        title: 'Test Quiz',
        subject: 'Math',
        description: 'Test Description',
        difficulty: 'easy',
        passingScore: 70,
        points: 100,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            points: 10,
            order: 1,
          },
        ],
      };

      const mockQuiz = {
        _id: new Types.ObjectId(),
        ...quizData,
      };

      // @ts-expect-error - Mock type inference issue
      (quizRepository.create as any) = jest.fn().mockResolvedValue(mockQuiz);

      // Act
      const result = await GamificationService.createQuiz(quizData);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Quiz');
    });
  });

  describe('getQuizById', () => {
    it('should return quiz by ID', async () => {
      // Arrange
      const quizId = new Types.ObjectId().toString();
      const mockQuiz = {
        _id: new Types.ObjectId(quizId),
        title: 'Test Quiz',
        questions: [
          {
            _id: new Types.ObjectId(),
            question: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            points: 10,
            order: 1,
          },
        ],
      };

      // @ts-expect-error - Mock type inference issue
      (quizRepository.findActiveById as any) = jest.fn().mockResolvedValue(mockQuiz);

      // Act
      const result = await GamificationService.getQuizById(quizId);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Quiz');
    });
  });

  describe('submitQuizAttempt', () => {
    it('should submit quiz attempt and calculate score', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const quizId = new Types.ObjectId().toString();
      const questionId = new Types.ObjectId().toString();

      const mockQuiz = {
        _id: new Types.ObjectId(quizId),
        title: 'Test Quiz',
        questions: [
          {
            _id: new Types.ObjectId(questionId),
            question: 'What is 2+2?',
            correctAnswer: '4',
            points: 10,
          },
        ],
      };

      const mockAttempt = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        quizId: new Types.ObjectId(quizId),
        score: 100,
      };

      const mockUser = {
        _id: new Types.ObjectId(userId),
        totalPoints: 0,
        // @ts-expect-error - Mock type inference issue
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - Mock type inference issue
      (quizRepository.findActiveById as any) = jest.fn().mockResolvedValue(mockQuiz);
      // @ts-expect-error - Mock type inference issue
      (quizAttemptRepository.create as any) = jest.fn().mockResolvedValue(mockAttempt);
      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockUser);
      
      // Mock userProgress with addXP method
      const mockUserProgress = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        subject: 'Math',
        level: 1,
        currentXP: 0,
        nextLevelXP: 100,
        completedQuizzes: 0,
        averageScore: 0,
        studyTime: 0,
        // @ts-expect-error - Mock type inference issue
        addXP: jest.fn().mockResolvedValue(true),
        // @ts-expect-error - Mock type inference issue
        save: jest.fn().mockResolvedValue(true),
      };
      // @ts-expect-error - Mock type inference issue
      (userProgressRepository.findByUserAndSubject as any) = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock type inference issue
      (userProgressRepository.create as any) = jest.fn().mockResolvedValue(mockUserProgress);
      // @ts-expect-error - Mock type inference issue
      (badgeRepository.model as any) = {
        // @ts-expect-error - Mock type inference issue
        find: jest.fn().mockResolvedValue([]),
      };
      // @ts-expect-error - Mock type inference issue
      (userBadgeRepository.model as any) = {
        // @ts-expect-error - Mock type inference issue
        find: jest.fn().mockResolvedValue([]),
      };

      const payload = {
        quizId,
        answers: { [questionId]: '4' },
        timeSpent: 60,
      };

      // Act
      const result = await GamificationService.submitQuizAttempt(userId, payload);

      // Assert
      expect(result).toBeDefined();
      expect(result.attempt).toBeDefined();
    });

    it('should throw error if quiz not found', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const quizId = new Types.ObjectId().toString();

      // @ts-expect-error - Mock type inference issue
      (quizRepository.findActiveById as any) = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        GamificationService.submitQuizAttempt(userId, {
          quizId,
          answers: {},
          timeSpent: 60,
        })
      ).rejects.toThrow('Quiz not found');
    });
  });
});
