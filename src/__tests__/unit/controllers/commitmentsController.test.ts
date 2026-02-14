/**
 * Unit Tests for CommitmentsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { CommitmentsController } from '../../../controllers/commitmentsController';
import weeklyCommitmentRepository from '../../../repositories/WeeklyCommitmentRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/WeeklyCommitmentRepository');

describe('CommitmentsController', () => {
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
      params: {},
    } as any;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();

    // Ensure repository methods are mocked
    if (!weeklyCommitmentRepository.findCurrentWeek)
      (weeklyCommitmentRepository as any).findCurrentWeek = jest.fn();
    if (!weeklyCommitmentRepository.findById)
      (weeklyCommitmentRepository as any).findById = jest.fn();
    if (!weeklyCommitmentRepository.findByUser)
      (weeklyCommitmentRepository as any).findByUser = jest.fn();
    if (!weeklyCommitmentRepository.create) (weeklyCommitmentRepository as any).create = jest.fn();
    if (!weeklyCommitmentRepository.toggleCommitment)
      (weeklyCommitmentRepository as any).toggleCommitment = jest.fn();
    if (!weeklyCommitmentRepository.deleteById)
      (weeklyCommitmentRepository as any).deleteById = jest.fn();
  });

  describe('getCurrentCommitments', () => {
    it('should return current commitments', async () => {
      // Arrange
      const mockCommitment = {
        _id: new Types.ObjectId(),
        weekStart: new Date(),
        weekEnd: new Date(),
        commitments: [
          { text: 'Task 1', completed: true },
          { text: 'Task 2', completed: false },
        ],
      };

      (weeklyCommitmentRepository as any).findCurrentWeek = jest.fn();
      (weeklyCommitmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        mockCommitment as any
      );

      // Act
      await CommitmentsController.getCurrentCommitments(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          commitment: expect.any(Object),
          completionRate: expect.any(Number),
        })
      );
    });

    it('should return null when no commitments exist', async () => {
      // Arrange
      (weeklyCommitmentRepository as any).findCurrentWeek = jest.fn();
      (weeklyCommitmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        null
      );

      // Act
      await CommitmentsController.getCurrentCommitments(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        commitment: null,
        completionRate: 0,
      });
    });
  });

  describe('createCommitments', () => {
    it('should create commitments successfully', async () => {
      // Arrange
      mockRequest.body = {
        commitments: [{ text: 'Task 1', type: 'time', target: 30 }],
      };

      const mockCommitment = {
        _id: new Types.ObjectId(),
        weekStart: new Date(),
        weekEnd: new Date(),
        commitments: [],
      };

      (weeklyCommitmentRepository as any).findCurrentWeek = jest.fn();
      (weeklyCommitmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue(
        null
      );
      (weeklyCommitmentRepository as any).create = jest.fn();
      (weeklyCommitmentRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockCommitment as any
      );

      // Act
      CommitmentsController.createCommitments(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(weeklyCommitmentRepository.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          commitment: expect.any(Object),
        })
      );
    });

    it('should throw error when commitments array is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      CommitmentsController.createCommitments(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Commitments array is required');
      expect(error.statusCode).toBe(400);
    });

    it('should throw error when commitments exceed maximum', async () => {
      // Arrange
      mockRequest.body = {
        commitments: Array(6).fill({ text: 'Task' }),
      };

      // Act
      CommitmentsController.createCommitments(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Maximum 5 commitments per week');
    });

    it('should throw error when commitments already exist for this week', async () => {
      // Arrange
      mockRequest.body = {
        commitments: [{ text: 'Task 1' }],
      };

      (weeklyCommitmentRepository.findCurrentWeek as jest.MockedFunction<any>).mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      // Act
      CommitmentsController.createCommitments(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Commitments already set for this week');
    });
  });

  describe('toggleCommitment', () => {
    it('should toggle commitment successfully', async () => {
      // Arrange
      mockRequest.params = { commitmentId: 'commit123', itemIndex: '0' };

      const mockCommitment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        commitments: [{ text: 'Task 1', completed: false }],
      };

      (weeklyCommitmentRepository as any).findById = jest.fn();
      (weeklyCommitmentRepository.findById as jest.MockedFunction<any>).mockResolvedValue(
        mockCommitment as any
      );
      (weeklyCommitmentRepository as any).toggleCommitment = jest.fn();
      (weeklyCommitmentRepository.toggleCommitment as jest.MockedFunction<any>).mockResolvedValue({
        ...mockCommitment,
        commitments: [{ text: 'Task 1', completed: true }],
      } as any);

      // Act
      CommitmentsController.toggleCommitment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(weeklyCommitmentRepository.toggleCommitment).toHaveBeenCalledWith('commit123', 0);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          commitment: expect.any(Object),
          completionRate: expect.any(Number),
        })
      );
    });

    it('should throw error when commitment not found', async () => {
      // Arrange
      mockRequest.params = { commitmentId: 'commit123', itemIndex: '0' };

      (weeklyCommitmentRepository as any).findById = jest.fn();
      (weeklyCommitmentRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      CommitmentsController.toggleCommitment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should throw error when access denied', async () => {
      // Arrange
      mockRequest.params = { commitmentId: 'commit123', itemIndex: '0' };

      const mockCommitment = {
        _id: new Types.ObjectId(),
        userId: {
          toString: () => '507f1f77bcf86cd799439012',
        },
      };

      (weeklyCommitmentRepository as any).findById = jest.fn();
      (weeklyCommitmentRepository.findById as jest.MockedFunction<any>).mockResolvedValue(
        mockCommitment as any
      );

      // Act
      CommitmentsController.toggleCommitment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getHistory', () => {
    it('should return commitment history', async () => {
      // Arrange
      const mockCommitments = [
        {
          _id: new Types.ObjectId(),
          weekStart: new Date(),
          weekEnd: new Date(),
          commitments: [
            { text: 'Task 1', completed: true },
            { text: 'Task 2', completed: false },
          ],
        },
      ];

      (weeklyCommitmentRepository as any).findByUser = jest.fn();
      (weeklyCommitmentRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue(
        mockCommitments as any
      );

      // Act
      await CommitmentsController.getHistory(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          history: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });
  });

  describe('deleteCommitment', () => {
    it('should delete commitment successfully', async () => {
      // Arrange
      mockRequest.params = { commitmentId: 'commit123' };

      const mockCommitment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      };

      (weeklyCommitmentRepository as any).findById = jest.fn();
      (weeklyCommitmentRepository.findById as jest.MockedFunction<any>).mockResolvedValue(
        mockCommitment as any
      );
      (weeklyCommitmentRepository as any).deleteById = jest.fn();
      (weeklyCommitmentRepository.deleteById as jest.MockedFunction<any>).mockResolvedValue(
        undefined
      );

      // Act
      CommitmentsController.deleteCommitment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(weeklyCommitmentRepository.deleteById).toHaveBeenCalledWith('commit123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Commitment deleted successfully',
      });
    });

    it('should throw error when commitment not found', async () => {
      // Arrange
      mockRequest.params = { commitmentId: 'commit123' };

      (weeklyCommitmentRepository as any).findById = jest.fn();
      (weeklyCommitmentRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      CommitmentsController.deleteCommitment(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
