/**
 * Unit Tests for AssessmentService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import assessmentService from '../../../services/assessmentService';
import weeklyAssessmentRepository from '../../../repositories/WeeklyAssessmentRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/WeeklyAssessmentRepository');

describe('AssessmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentAssessment', () => {
    it('should return current assessment when it exists', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockAssessment = {
        _id: new Types.ObjectId(),
        weekStart: new Date('2024-01-01'),
        weekRating: 4,
        whatWentWell: 'Good progress',
        challenges: 'Time management',
        nextWeekFocus: 'Better planning',
        commitmentLevel: 5,
        tutorFeedback: 'Great work!',
        completedAt: new Date(),
      };

      (weeklyAssessmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        mockAssessment
      );

      // Act
      const result = await assessmentService.getCurrentAssessment(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockAssessment._id.toString());
      expect(result?.weekRating).toBe(4);
      expect(weeklyAssessmentRepository.findCurrentWeek).toHaveBeenCalledWith(userId);
    });

    it('should return null when no assessment exists', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (weeklyAssessmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        null
      );

      // Act
      const result = await assessmentService.getCurrentAssessment(userId);

      // Assert
      expect(result).toBeNull();
      expect(weeklyAssessmentRepository.findCurrentWeek).toHaveBeenCalledWith(userId);
    });
  });

  describe('submitAssessment', () => {
    const validAssessmentData = {
      weekRating: 4,
      whatWentWell: 'Made good progress',
      challenges: 'Time management',
      nextWeekFocus: 'Better planning',
      commitmentLevel: 5,
    };

    it('should successfully submit assessment', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockAssessment = {
        _id: new Types.ObjectId(),
        weekStart: new Date('2024-01-01'),
        weekRating: 4,
        commitmentLevel: 5,
      };

      (weeklyAssessmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        null
      );
      (weeklyAssessmentRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockAssessment
      );

      // Act
      const result = await assessmentService.submitAssessment(userId, validAssessmentData);

      // Assert
      expect(result).toBeDefined();
      expect(result.weekRating).toBe(4);
      expect(result.commitmentLevel).toBe(5);
      expect(weeklyAssessmentRepository.create).toHaveBeenCalled();
    });

    it('should throw error when required fields are missing', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const invalidData = {
        weekRating: 4,
        whatWentWell: '',
        challenges: 'Time management',
        nextWeekFocus: 'Better planning',
        commitmentLevel: 5,
      };

      // Act & Assert
      await expect(assessmentService.submitAssessment(userId, invalidData as any)).rejects.toThrow(
        AppError
      );
    });

    it('should throw error when weekRating is out of range', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const invalidData = {
        ...validAssessmentData,
        weekRating: 6,
      };

      // Act & Assert
      await expect(assessmentService.submitAssessment(userId, invalidData)).rejects.toThrow(
        'Ratings must be between 1 and 5'
      );
    });

    it('should throw error when commitmentLevel is out of range', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const invalidData = {
        ...validAssessmentData,
        commitmentLevel: 6, // Use 6 instead of 0, since 0 is falsy and triggers "All fields are required"
      };

      (weeklyAssessmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(assessmentService.submitAssessment(userId, invalidData)).rejects.toThrow(
        'Ratings must be between 1 and 5'
      );
    });

    it('should throw error when assessment already exists for this week', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const existingAssessment = {
        _id: new Types.ObjectId(),
        weekStart: new Date(),
      };

      (weeklyAssessmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        existingAssessment
      );

      // Act & Assert
      await expect(assessmentService.submitAssessment(userId, validAssessmentData)).rejects.toThrow(
        'Assessment already submitted for this week'
      );
    });
  });

  describe('getTrends', () => {
    it('should return assessment trends', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const weeks = 8;
      const mockTrends = {
        weekRatings: [
          { week: '2024-01-01', rating: 4 },
          { week: '2024-01-08', rating: 5 },
        ],
        commitmentLevels: [
          { week: '2024-01-01', level: 4 },
          { week: '2024-01-08', level: 5 },
        ],
      };

      (weeklyAssessmentRepository.getTrends as jest.MockedFunction<any>).mockResolvedValue(
        mockTrends
      );

      // Act
      const result = await assessmentService.getTrends(userId, weeks);

      // Assert
      expect(result).toBeDefined();
      expect(result.weekRatings).toHaveLength(2);
      expect(result.commitmentLevels).toHaveLength(2);
      expect(weeklyAssessmentRepository.getTrends).toHaveBeenCalledWith(userId, weeks);
    });

    it('should use default weeks parameter when not provided', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockTrends = {
        weekRatings: [],
        commitmentLevels: [],
      };

      (weeklyAssessmentRepository.getTrends as jest.MockedFunction<any>).mockResolvedValue(
        mockTrends
      );

      // Act
      await assessmentService.getTrends(userId);

      // Assert
      expect(weeklyAssessmentRepository.getTrends).toHaveBeenCalledWith(userId, 8);
    });
  });
});
