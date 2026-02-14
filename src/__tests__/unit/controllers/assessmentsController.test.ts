/**
 * Unit Tests for AssessmentsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { AssessmentsController } from '../../../controllers/assessmentsController';
import assessmentService from '../../../services/assessmentService';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../services/assessmentService');

describe('AssessmentsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
      },
      body: {},
      query: {},
    } as any;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
  });

  describe('getCurrentAssessment', () => {
    it('should return current assessment', async () => {
      // Arrange
      const mockAssessment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        weekRating: 4,
        whatWentWell: 'Good progress',
        challenges: 'Some difficulties',
        nextWeekFocus: 'Continue studying',
        commitmentLevel: 5,
        weekStart: new Date(),
        createdAt: new Date(),
      };

      (assessmentService.getCurrentAssessment as jest.MockedFunction<any>).mockResolvedValue(
        mockAssessment
      );

      // Act
      await AssessmentsController.getCurrentAssessment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(assessmentService.getCurrentAssessment).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        assessment: mockAssessment,
      });
    });

    it('should return null when no assessment exists', async () => {
      // Arrange
      (assessmentService.getCurrentAssessment as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      await AssessmentsController.getCurrentAssessment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(assessmentService.getCurrentAssessment).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        assessment: null,
      });
    });
  });

  describe('submitAssessment', () => {
    it('should submit assessment successfully', async () => {
      // Arrange
      const assessmentData = {
        weekRating: 4,
        whatWentWell: 'Good progress',
        challenges: 'Some difficulties',
        nextWeekFocus: 'Continue studying',
        commitmentLevel: 5,
      };

      mockRequest.body = assessmentData;

      const mockAssessment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        ...assessmentData,
        weekStart: new Date(),
        createdAt: new Date(),
      };

      (assessmentService.submitAssessment as jest.MockedFunction<any>).mockResolvedValue(
        mockAssessment
      );

      // Act
      await AssessmentsController.submitAssessment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(assessmentService.submitAssessment).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        assessmentData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        assessment: mockAssessment,
      });
    });
  });

  describe('getTrends', () => {
    it('should return assessment trends with default weeks', async () => {
      // Arrange
      const mockTrends = {
        averageRating: 4.2,
        averageCommitment: 4.5,
        trends: [
          { week: '2024-01-01', rating: 4, commitment: 5 },
          { week: '2024-01-08', rating: 4.5, commitment: 4 },
        ],
      };

      (assessmentService.getTrends as jest.MockedFunction<any>).mockResolvedValue(mockTrends);

      // Act
      await AssessmentsController.getTrends(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(assessmentService.getTrends).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 8);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        trends: mockTrends,
      });
    });

    it('should return assessment trends with custom weeks', async () => {
      // Arrange
      mockRequest.query = { weeks: '12' };

      const mockTrends = {
        averageRating: 4.0,
        averageCommitment: 4.3,
        trends: [],
      };

      (assessmentService.getTrends as jest.MockedFunction<any>).mockResolvedValue(mockTrends);

      // Act
      await AssessmentsController.getTrends(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(assessmentService.getTrends).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 12);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        trends: mockTrends,
      });
    });
  });
});
