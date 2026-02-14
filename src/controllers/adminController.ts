import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AdminService } from '../services/adminService';
import { UserRole } from '../types';
import { getPaginationParams } from '../utils/pagination';

export class AdminController {
  // Get admin dashboard stats
  static getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const stats = await AdminService.getDashboardStats();
    res.json({ success: true, stats });
  });

  // Get pending tutors
  static getPendingTutors = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { page, limit } = getPaginationParams(req, 20, 50);
    const result = await AdminService.getPendingTutors(page, limit);

    res.json({
      success: true,
      tutors: result.tutors,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  });

  // Get tutor by ID for review
  static getTutorById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { tutorId } = req.params;
    const tutor = await AdminService.getTutorById(tutorId);

    res.json({ success: true, tutor });
  });

  // Approve tutor
  static approveTutor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { tutorId } = req.params;
    const { adminNotes } = req.body;

    const tutor = await AdminService.approveTutor(tutorId, adminNotes);

    res.json({
      success: true,
      message: 'Tutor approved successfully',
      tutor,
    });
  });

  // Reject tutor
  static rejectTutor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { tutorId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const result = await AdminService.rejectTutor(tutorId, reason);

    res.json({
      success: true,
      message: 'Tutor application rejected',
      tutorId: result.id,
    });
  });

  // Set background check status
  static setBackgroundCheckStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (req.user!.role !== UserRole.ADMIN) {
        throw new AppError('Admin access required', 403);
      }

      const { tutorId } = req.params;
      const { isBackgroundChecked } = req.body;

      if (typeof isBackgroundChecked !== 'boolean') {
        throw new AppError('isBackgroundChecked must be a boolean', 400);
      }

      const result = await AdminService.setBackgroundCheckStatus(tutorId, isBackgroundChecked);

      res.json({
        success: true,
        message: 'Background check status updated',
        tutor: {
          id: result.id,
          isBackgroundChecked: result.isBackgroundChecked,
        },
      });
    }
  );

  // Get all users
  static getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { role, search, isVerified } = req.query;
    const { page, limit } = getPaginationParams(req, 20, 100);

    const filters: any = { page, limit };
    if (role) filters.role = role as UserRole;
    if (search) filters.search = search as string;
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';

    const result = await AdminService.getAllUsers(filters);

    res.json({
      success: true,
      users: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  });

  // Get user by ID
  static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { userId } = req.params;
    const user = await AdminService.getUserById(userId);

    res.json({ success: true, user });
  });

  // Update user status (suspend/activate)
  static updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean', 400);
    }

    const result = await AdminService.updateUserStatus(userId, isActive);

    res.json({
      success: true,
      message: result.message,
      user: result,
    });
  });
}
