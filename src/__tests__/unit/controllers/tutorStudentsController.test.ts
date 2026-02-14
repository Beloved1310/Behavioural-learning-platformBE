/**
 * Unit Tests for TutorStudentsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { TutorStudentsController } from '../../../controllers/tutorStudentsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import userRepository from '../../../repositories/UserRepository';
import goalRepository from '../../../repositories/GoalRepository';
import weeklyCommitmentRepository from '../../../repositories/WeeklyCommitmentRepository';
import customEventRepository from '../../../repositories/CustomEventRepository';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Mock repositories
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../repositories/GoalRepository');
jest.mock('../../../repositories/WeeklyCommitmentRepository');
jest.mock('../../../repositories/CustomEventRepository');

describe('TutorStudentsController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: new Types.ObjectId().toString(),
      role: UserRole.TUTOR,
      email: 'tutor@example.com',
    };

    mockRequest = {
      user: mockUser,
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn();
  });

  describe('getAllStudentsProgress', () => {
    it('should return empty array when no students exist', async () => {
      // Arrange
      (userRepository as any).model = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockResolvedValue(0),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                // @ts-expect-error - Mock type inference issue
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      };

      // Act
      TutorStudentsController.getAllStudentsProgress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        students: [],
        total: 0,
      });
    });

    it('should return students with progress metrics', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'student@example.com',
        streakCount: 5,
        lastLoginAt: new Date(),
        role: UserRole.STUDENT,
      };

      const mockGoals = [
        { isActive: true, status: 'active', current: 50, target: 100 },
        { isActive: true, status: 'active', current: 75, target: 100 },
      ];

      const mockCommitment = {
        commitments: [
          { completed: true },
          { completed: false },
          { completed: true },
        ],
      };

      (userRepository as any).model = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                // @ts-expect-error - Mock type inference issue
                lean: jest.fn().mockResolvedValue([mockStudent]),
              }),
            }),
          }),
        }),
      };

      // @ts-expect-error - Mock type inference issue
      (goalRepository.findByUser as any) = jest.fn().mockResolvedValue(mockGoals);
      (weeklyCommitmentRepository.findCurrentWeek as any) = jest
        .fn()
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValue(mockCommitment);

      // Act
      TutorStudentsController.getAllStudentsProgress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.students).toBeDefined();
      expect(callArgs.students.length).toBeGreaterThan(0);
      expect(callArgs.students[0].name).toBe('John Doe');
      expect(callArgs.students[0].streak).toBe(5);
    });

    it('should handle errors gracefully and return empty array', async () => {
      // Arrange
      (userRepository as any).model = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockRejectedValue(new Error('Database error')),
        find: jest.fn(),
      };

      // Act
      TutorStudentsController.getAllStudentsProgress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        students: [],
        total: 0,
      });
    });
  });

  describe('getAtRiskStudents', () => {
    it('should return at-risk students with broken streaks', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        streakCount: 0,
        lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        role: UserRole.STUDENT,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.find as any) = jest.fn().mockResolvedValue([mockStudent]);
      // @ts-expect-error - Mock type inference issue
      (weeklyCommitmentRepository.findCurrentWeek as any) = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock type inference issue
      (customEventRepository.find as any) = jest.fn().mockResolvedValue([]);

      // Act
      TutorStudentsController.getAtRiskStudents(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.students.length).toBeGreaterThan(0);
      expect(callArgs.students[0].reasons.some((r: string) => r.includes('Streak broken'))).toBe(true);
    });

    it('should return at-risk students with missed commitments', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        streakCount: 2,
        lastLoginAt: new Date(),
        role: UserRole.STUDENT,
      };

      const mockCommitment = {
        commitments: [
          { completed: false },
          { completed: false },
          { completed: true },
        ],
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.find as any) = jest.fn().mockResolvedValue([mockStudent]);
      (weeklyCommitmentRepository.findCurrentWeek as jest.Mock) = jest
        .fn()
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValue(mockCommitment);
      // @ts-expect-error - Mock type inference issue
      (customEventRepository.find as jest.Mock) = jest.fn().mockResolvedValue([{}]);

      // Act
      TutorStudentsController.getAtRiskStudents(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.students.length).toBeGreaterThan(0);
      expect(callArgs.students[0].reasons.some((r: string) => r.includes('Missed commitments'))).toBe(true);
    });

    it('should return at-risk students with no activity', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice@example.com',
        streakCount: 1,
        lastLoginAt: new Date(),
        role: UserRole.STUDENT,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.find as any) = jest.fn().mockResolvedValue([mockStudent]);
      // @ts-expect-error - Mock type inference issue
      (weeklyCommitmentRepository.findCurrentWeek as any) = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock type inference issue
      (customEventRepository.find as any) = jest.fn().mockResolvedValue([]);

      // Act
      TutorStudentsController.getAtRiskStudents(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.students.length).toBeGreaterThan(0);
      expect(callArgs.students[0].reasons.some((r: string) => r.includes('No activity'))).toBe(true);
    });
  });

  describe('getStudentDetail', () => {
    it('should return student detail with full information', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'student@example.com',
        streakCount: 5,
        lastLoginAt: new Date(),
        role: UserRole.STUDENT,
        gradeLevel: '10',
        academicGoals: ['Goal 1'],
        totalPoints: 100,
        createdAt: new Date(),
      };

      const mockGoals = [
        { isActive: true, status: 'active', current: 50, target: 100 },
      ];

      const mockCommitment = {
        commitments: [
          { completed: true },
          { completed: false },
        ],
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockStudent);
      (userRepository as any).model = {
        find: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            // @ts-expect-error - Mock type inference issue
            lean: jest.fn().mockResolvedValue([mockStudent]),
          }),
        }),
      };
      // @ts-expect-error - Mock type inference issue
      (goalRepository.findByUser as any) = jest.fn().mockResolvedValue(mockGoals);
      (weeklyCommitmentRepository.findCurrentWeek as any) = jest
        .fn()
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValue(mockCommitment);

      mockRequest.params = { studentId: studentId.toString() };

      // Act
      TutorStudentsController.getStudentDetail(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.student).toBeDefined();
      expect(callArgs.student.name).toBe('John Doe');
      expect(callArgs.student.streak).toBe(5);
      expect(callArgs.student.goalProgress).toBeDefined();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };
      mockRequest.params = { studentId: new Types.ObjectId().toString() };

      // Act & Assert
      TutorStudentsController.getStudentDetail(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      // Arrange
      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as jest.Mock) = jest.fn().mockResolvedValue(null);
      mockRequest.params = { studentId: new Types.ObjectId().toString() };

      // Act & Assert
      TutorStudentsController.getStudentDetail(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('searchStudents', () => {
    it('should search students by query', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'student@example.com',
        streakCount: 3,
        lastLoginAt: new Date(),
        role: UserRole.STUDENT,
      };

      (userRepository as any).model = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                // @ts-expect-error - Mock type inference issue
                lean: jest.fn().mockResolvedValue([mockStudent]),
              }),
            }),
          }),
        }),
      };

      // @ts-expect-error - Mock type inference issue
      (goalRepository.findByUser as any) = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (weeklyCommitmentRepository.findCurrentWeek as jest.Mock) = jest.fn().mockResolvedValue(null);

      mockRequest.query = { query: 'John' };

      // Act
      TutorStudentsController.searchStudents(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.students).toBeDefined();
    });

    it('should filter students by status', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const mockStudent = {
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'student@example.com',
        streakCount: 0,
        lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        role: UserRole.STUDENT,
      };

      (userRepository as any).model = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                // @ts-expect-error - Mock type inference issue
                lean: jest.fn().mockResolvedValue([mockStudent]),
              }),
            }),
          }),
        }),
      };

      // @ts-expect-error - Mock type inference issue
      (goalRepository.findByUser as any) = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (weeklyCommitmentRepository.findCurrentWeek as jest.Mock) = jest.fn().mockResolvedValue(null);

      mockRequest.query = { status: 'at-risk' };

      // Act
      TutorStudentsController.searchStudents(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };

      // Act & Assert
      TutorStudentsController.searchStudents(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('inviteStudent', () => {
    it('should invite student successfully', async () => {
      // Arrange
      mockRequest.body = {
        email: 'newstudent@example.com',
        message: 'Welcome!',
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.find as any) = jest.fn().mockResolvedValue([]);

      // Act
      TutorStudentsController.inviteStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Invitation sent successfully',
        email: 'newstudent@example.com',
      });
    });

    it('should throw error if email is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act & Assert
      TutorStudentsController.inviteStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if student already exists', async () => {
      // Arrange
      mockRequest.body = {
        email: 'existing@example.com',
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository as any).find = jest.fn().mockResolvedValue([{ email: 'existing@example.com', role: UserRole.STUDENT }]);

      // Act & Assert
      TutorStudentsController.inviteStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };
      mockRequest.body = { email: 'student@example.com' };

      // Act & Assert
      TutorStudentsController.inviteStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createStudent', () => {
    it('should create student successfully', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      mockRequest.body = {
        firstName: 'New',
        lastName: 'Student',
        email: 'newstudent@example.com',
        gradeLevel: '10',
        academicGoals: ['Goal 1'],
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository as any).find = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (userRepository as any).create = jest.fn().mockResolvedValue({
        _id: studentId,
        firstName: 'New',
        lastName: 'Student',
        email: 'newstudent@example.com',
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      // Act
      TutorStudentsController.createStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.message).toBe('Student created successfully');
    });

    it('should throw error if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        firstName: 'New',
        // Missing lastName and email
      };

      // Act & Assert
      TutorStudentsController.createStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if student already exists', async () => {
      // Arrange
      mockRequest.body = {
        firstName: 'Existing',
        lastName: 'Student',
        email: 'existing@example.com',
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository as any).find = jest.fn().mockResolvedValue([{ email: 'existing@example.com', role: UserRole.STUDENT }]);

      // Act & Assert
      TutorStudentsController.createStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };
      mockRequest.body = {
        firstName: 'New',
        lastName: 'Student',
        email: 'newstudent@example.com',
      };

      // Act & Assert
      TutorStudentsController.createStudent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

