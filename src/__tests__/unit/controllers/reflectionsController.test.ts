/**
 * Unit Tests for ReflectionsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { ReflectionsController } from '../../../controllers/reflectionsController';
import reflectionEntryRepository from '../../../repositories/ReflectionEntryRepository';
import { BehavioralService } from '../../../services/behavioralService';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/ReflectionEntryRepository');
jest.mock('../../../services/behavioralService');

describe('ReflectionsController', () => {
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
    if (!reflectionEntryRepository.findByWeek)
      (reflectionEntryRepository as any).findByWeek = jest.fn();
    if (!reflectionEntryRepository.findByUser)
      (reflectionEntryRepository as any).findByUser = jest.fn();
    if (!reflectionEntryRepository.findToday)
      (reflectionEntryRepository as any).findToday = jest.fn();
    if (!reflectionEntryRepository.create) (reflectionEntryRepository as any).create = jest.fn();
    if (!reflectionEntryRepository.getReflectionStreak)
      (reflectionEntryRepository as any).getReflectionStreak = jest.fn();
    if (!BehavioralService.getReflectionPrompts)
      (BehavioralService as any).getReflectionPrompts = jest.fn();
  });

  describe('getReflections', () => {
    it('should return reflections for week period', async () => {
      // Arrange
      mockRequest.query = { period: 'week' };

      const mockReflections = [
        {
          _id: new Types.ObjectId(),
          date: new Date(),
          prompt: 'How was your day?',
          response: 'Great!',
        },
      ];

      (reflectionEntryRepository as any).findByWeek = jest.fn();
      (reflectionEntryRepository.findByWeek as jest.MockedFunction<any>).mockResolvedValue(
        mockReflections as any
      );

      // Act
      await ReflectionsController.getReflections(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reflectionEntryRepository.findByWeek).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reflections: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should return reflections for all period', async () => {
      // Arrange
      mockRequest.query = { period: 'all' };

      const mockReflections = [
        {
          _id: new Types.ObjectId(),
          date: new Date(),
          prompt: 'How was your day?',
          response: 'Great!',
        },
      ];

      (reflectionEntryRepository as any).findByUser = jest.fn();
      (reflectionEntryRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue(
        mockReflections as any
      );

      // Act
      await ReflectionsController.getReflections(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reflectionEntryRepository.findByUser).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        1000
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reflections: expect.any(Array),
        })
      );
    });
  });

  describe('createReflection', () => {
    it('should create reflection successfully', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'How was your day?',
        response: 'Great!',
        type: 'weekly',
        mood: 'happy',
      };

      const mockReflection = {
        _id: new Types.ObjectId(),
        date: new Date(),
        prompt: 'How was your day?',
        response: 'Great!',
        type: 'weekly',
        mood: 'happy',
      };

      (reflectionEntryRepository as any).create = jest.fn();
      (reflectionEntryRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockReflection as any
      );

      // Act
      await ReflectionsController.createReflection(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reflectionEntryRepository.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reflection: expect.any(Object),
        })
      );
    });

    it('should throw error when prompt is missing', async () => {
      // Arrange
      mockRequest.body = {
        response: 'Great!',
      };

      // Act
      await ReflectionsController.createReflection(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Prompt and response are required');
      expect(error.statusCode).toBe(400);
    });

    it('should throw error when response is missing', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'How was your day?',
      };

      // Act
      await ReflectionsController.createReflection(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should throw error when daily reflection already exists', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'How was your day?',
        response: 'Great!',
        type: 'daily',
      };

      (reflectionEntryRepository as any).findToday = jest.fn();
      (reflectionEntryRepository.findToday as jest.MockedFunction<any>).mockResolvedValue({
        _id: new Types.ObjectId(),
      } as any);

      // Act
      ReflectionsController.createReflection(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Daily reflection already completed today');
    });
  });

  describe('getInsights', () => {
    it('should return reflection insights', async () => {
      // Arrange
      const mockReflections = [
        {
          _id: new Types.ObjectId(),
          response: 'I struggled with math today',
        },
      ];

      (reflectionEntryRepository as any).findByWeek = jest.fn();
      (reflectionEntryRepository.findByWeek as jest.MockedFunction<any>).mockResolvedValue(
        mockReflections as any
      );
      (reflectionEntryRepository as any).getReflectionStreak = jest.fn();
      (reflectionEntryRepository.getReflectionStreak as jest.MockedFunction<any>).mockResolvedValue(
        5
      );

      // Act
      ReflectionsController.getInsights(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.insights).toBeDefined();
      expect(callArgs.insights.streak).toBe(5);
      expect(callArgs.insights.totalReflections).toBe(1);
      expect(Array.isArray(callArgs.insights.patterns)).toBe(true);
    });

    it('should return default patterns when no patterns detected', async () => {
      // Arrange
      const mockReflections = [
        {
          _id: new Types.ObjectId(),
          response: 'Normal day',
        },
      ];

      (reflectionEntryRepository as any).findByWeek = jest.fn();
      (reflectionEntryRepository.findByWeek as jest.MockedFunction<any>).mockResolvedValue(
        mockReflections as any
      );
      (reflectionEntryRepository as any).getReflectionStreak = jest.fn();
      (reflectionEntryRepository.getReflectionStreak as jest.MockedFunction<any>).mockResolvedValue(
        0
      );

      // Act
      ReflectionsController.getInsights(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.insights.patterns).toContain('Keep reflecting to see insights!');
    });
  });

  describe('getTodayPrompt', () => {
    it("should return today's reflection prompts", async () => {
      // Arrange
      const mockPrompts = ['How was your day?', 'What did you learn?'];

      (BehavioralService as any).getReflectionPrompts = jest.fn();
      (BehavioralService.getReflectionPrompts as jest.MockedFunction<any>).mockResolvedValue(
        mockPrompts as any
      );

      // Act
      await ReflectionsController.getTodayPrompt(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(BehavioralService.getReflectionPrompts).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        prompts: mockPrompts,
      });
    });
  });
});
