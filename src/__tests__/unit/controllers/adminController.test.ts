/**
 * Unit Tests for AdminController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { AdminController } from '../../../controllers/adminController';
import { AdminService } from '../../../services/adminService';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import { AppError } from '../../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../../services/adminService');

describe('AdminController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
        role: UserRole.ADMIN,
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

  describe('getDashboardStats', () => {
    it('should return dashboard stats for admin', async () => {
      const mockStats = {
        totalUsers: 100,
        totalStudents: 50,
        totalTutors: 30,
        totalParents: 20,
        pendingTutors: 5,
        verifiedTutors: 25,
        activeUsers: 80,
      };

      (AdminService.getDashboardStats as jest.MockedFunction<any>).mockResolvedValue(mockStats);

      AdminController.getDashboardStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getDashboardStats).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        stats: mockStats,
      });
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.getDashboardStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Admin access required');
    });
  });

  describe('getPendingTutors', () => {
    it('should return pending tutors with pagination', async () => {
      const mockResult = {
        tutors: [{ id: 'tutor1', firstName: 'John', lastName: 'Doe', isVerified: false }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (AdminService.getPendingTutors as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { page: '1', limit: '20' };

      AdminController.getPendingTutors(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getPendingTutors).toHaveBeenCalledWith(1, 20);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        tutors: mockResult.tutors,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.TUTOR;

      AdminController.getPendingTutors(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getTutorById', () => {
    it('should return tutor by ID', async () => {
      const mockTutor = {
        id: 'tutor1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (AdminService.getTutorById as jest.MockedFunction<any>).mockResolvedValue(mockTutor);
      (mockRequest.params as any) = { tutorId: 'tutor1' };

      AdminController.getTutorById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getTutorById).toHaveBeenCalledWith('tutor1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        tutor: mockTutor,
      });
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.getTutorById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('approveTutor', () => {
    it('should approve tutor successfully', async () => {
      const mockTutor = {
        id: 'tutor1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isVerified: true,
        isBackgroundChecked: true,
      };

      (AdminService.approveTutor as jest.MockedFunction<any>).mockResolvedValue(mockTutor);
      (mockRequest.params as any) = { tutorId: 'tutor1' };
      (mockRequest.body as any) = { adminNotes: 'Approved' };

      AdminController.approveTutor(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.approveTutor).toHaveBeenCalledWith('tutor1', 'Approved');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tutor approved successfully',
        tutor: mockTutor,
      });
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.approveTutor(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('rejectTutor', () => {
    it('should reject tutor with reason', async () => {
      const mockResult = {
        id: 'tutor1',
      };

      (AdminService.rejectTutor as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.params as any) = { tutorId: 'tutor1' };
      (mockRequest.body as any) = { reason: 'Incomplete profile' };

      AdminController.rejectTutor(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.rejectTutor).toHaveBeenCalledWith('tutor1', 'Incomplete profile');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tutor application rejected',
        tutorId: 'tutor1',
      });
    });

    it('should throw error when reason is missing', async () => {
      (mockRequest.params as any) = { tutorId: 'tutor1' };
      (mockRequest.body as any) = {};

      AdminController.rejectTutor(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Rejection reason is required');
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.rejectTutor(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('setBackgroundCheckStatus', () => {
    it('should update background check status', async () => {
      const mockResult = {
        id: 'tutor1',
        isBackgroundChecked: true,
      };

      (AdminService.setBackgroundCheckStatus as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );
      (mockRequest.params as any) = { tutorId: 'tutor1' };
      (mockRequest.body as any) = { isBackgroundChecked: true };

      AdminController.setBackgroundCheckStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.setBackgroundCheckStatus).toHaveBeenCalledWith('tutor1', true);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Background check status updated',
        tutor: {
          id: 'tutor1',
          isBackgroundChecked: true,
        },
      });
    });

    it('should throw error when isBackgroundChecked is not boolean', async () => {
      (mockRequest.params as any) = { tutorId: 'tutor1' };
      (mockRequest.body as any) = { isBackgroundChecked: 'true' };

      AdminController.setBackgroundCheckStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('isBackgroundChecked must be a boolean');
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.setBackgroundCheckStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with filters', async () => {
      const mockResult = {
        users: [{ id: 'user1', firstName: 'John', lastName: 'Doe', role: UserRole.STUDENT }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (AdminService.getAllUsers as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { role: 'STUDENT', page: '1', limit: '20' };

      AdminController.getAllUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.STUDENT,
          page: 1,
          limit: 20,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        users: mockResult.users,
        pagination: expect.objectContaining({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
      });
    });

    it('should handle search query', async () => {
      const mockResult = {
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      (AdminService.getAllUsers as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { search: 'john', page: '1', limit: '20' };

      AdminController.getAllUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john',
        })
      );
    });

    it('should handle isVerified filter', async () => {
      const mockResult = {
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      (AdminService.getAllUsers as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.query as any) = { isVerified: 'true', page: '1', limit: '20' };

      AdminController.getAllUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: true,
        })
      );
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.getAllUsers(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: UserRole.STUDENT,
      };

      (AdminService.getUserById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (mockRequest.params as any) = { userId: 'user1' };

      AdminController.getUserById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.getUserById).toHaveBeenCalledWith('user1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        user: mockUser,
      });
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.getUserById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updateUserStatus', () => {
    it('should activate user account', async () => {
      const mockResult = {
        id: 'user1',
        isVerified: true,
        message: 'Account activated',
      };

      (AdminService.updateUserStatus as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.params as any) = { userId: 'user1' };
      (mockRequest.body as any) = { isActive: true };

      AdminController.updateUserStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.updateUserStatus).toHaveBeenCalledWith('user1', true);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account activated',
        user: mockResult,
      });
    });

    it('should suspend user account', async () => {
      const mockResult = {
        id: 'user1',
        isVerified: false,
        message: 'Account suspended',
      };

      (AdminService.updateUserStatus as jest.MockedFunction<any>).mockResolvedValue(mockResult);
      (mockRequest.params as any) = { userId: 'user1' };
      (mockRequest.body as any) = { isActive: false };

      AdminController.updateUserStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(AdminService.updateUserStatus).toHaveBeenCalledWith('user1', false);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account suspended',
        user: mockResult,
      });
    });

    it('should throw error when isActive is not boolean', async () => {
      (mockRequest.params as any) = { userId: 'user1' };
      (mockRequest.body as any) = { isActive: 'true' };

      AdminController.updateUserStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('isActive must be a boolean');
    });

    it('should throw error for non-admin user', async () => {
      (mockRequest.user as any).role = UserRole.STUDENT;

      AdminController.updateUserStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
