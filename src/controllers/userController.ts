import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { UserService } from '../services/userService';
import { logger } from '../utils/logger';

export class UserController {
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { user, preferences } = await UserService.getProfile(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage || null,
          phoneNumber: (user as any).phoneNumber || null,
          dateOfBirth: (user as any).dateOfBirth || null,
          gradeLevel: (user as any).gradeLevel || null,
          learningStyle: (user as any).learningStyle || null,
          academicGoals: (user as any).academicGoals || [],
          subjects: (user as any).subjects || [],
          bio: (user as any).bio || null,
          qualifications: (user as any).qualifications || [],
          totalPoints: (user as any).totalPoints || 0,
          streakCount: (user as any).streakCount || 0,
          subscriptionTier: (user as any).subscriptionTier || 'FREE',
          subscriptionStatus: (user as any).subscriptionStatus || 'INACTIVE',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: (user as any).lastLoginAt,
        },
        preferences: {
          emailNotifications: preferences.emailNotifications,
          pushNotifications: preferences.pushNotifications,
          sessionReminders: preferences.sessionReminders,
          weeklyReport: preferences.weeklyReport,
          studyReminders: preferences.studyReminders,
          darkMode: preferences.darkMode ?? false,
          language: preferences.language,
          timezone: preferences.timezone,
        },
      },
    });
  });

  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const updatedUser = await UserService.updateProfile(userId, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser!._id.toString(),
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
        email: updatedUser!.email,
        role: updatedUser!.role,
        profileImage: (updatedUser as any).profileImage || null,
        phoneNumber: (updatedUser as any).phoneNumber || null,
        dateOfBirth: (updatedUser as any).dateOfBirth || null,
        gradeLevel: (updatedUser as any).gradeLevel || null,
        learningStyle: (updatedUser as any).learningStyle || null,
        academicGoals: (updatedUser as any).academicGoals || [],
        subjects: (updatedUser as any).subjects || [],
        bio: (updatedUser as any).bio || null,
        qualifications: (updatedUser as any).qualifications || [],
        totalPoints: (updatedUser as any).totalPoints || 0,
        streakCount: (updatedUser as any).streakCount || 0,
        subscriptionTier: (updatedUser as any).subscriptionTier || 'FREE',
        subscriptionStatus: (updatedUser as any).subscriptionStatus || 'INACTIVE',
        createdAt: updatedUser!.createdAt,
        updatedAt: updatedUser!.updatedAt,
        lastLoginAt: (updatedUser as any).lastLoginAt,
      },
    });
  });

  static updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const result = await UserService.updatePassword(userId, currentPassword, newPassword);
    res.json({
      success: true,
      ...result,
    });
  });

  static deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { password } = req.body;
    const result = await UserService.deleteAccount(userId, password);
    res.json({
      success: true,
      ...result,
    });
  });

  static uploadProfileImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const file = req.file!;
    const result = await UserService.uploadProfileImage(userId, file);
    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl: result.imageUrl,
      user: {
        id: result.user._id.toString(),
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        profileImage: result.user.profileImage,
      },
    });
  });

  static deleteProfileImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await UserService.deleteProfileImage(userId);
    res.json(result);
  });

  static getChildren = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== 'PARENT') {
      throw new AppError('Only parents can access this endpoint', 403);
    }

    const { User } = await import('../models/User');
    const children = await User.find({ parentId: userId }).select('firstName lastName email _id');

    res.json(
      children.map((child) => ({
        id: child._id.toString(),
        name: `${child.firstName} ${child.lastName}`.trim(),
        email: child.email,
      }))
    );
  });

  static requestDataExport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await UserService.exportUserData(userId);

      res.json({
        success: true,
        message: result.message,
        data: {
          exportId: result.exportId,
          data: result.data,
        },
      });
    } catch (error: any) {
      logger.error('[UserController] Error in requestDataExport', error);
      throw error;
    }
  });

  static downloadDataExport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { exportId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Generate export data for the authenticated user
    // We don't need strict validation since we're regenerating the data anyway
    const result = await UserService.exportUserData(userId);

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-export-${exportId || Date.now()}.json"`
    );

    res.json(result.data);
  });
}
