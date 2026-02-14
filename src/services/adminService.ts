import userRepository from '../repositories/UserRepository';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../types';
import notificationService from './notificationService';
import { logger } from '../utils/logger';

export class AdminService {
  // Get pending tutors (not verified or not background checked)
  static async getPendingTutors(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const query: any = {
      role: UserRole.TUTOR,
      $or: [{ isVerified: false }, { isBackgroundChecked: false }],
    };

    const total = await (userRepository as any).model.countDocuments(query);

    const tutors = await (userRepository as any).model
      .find(query)
      .select(
        'firstName lastName email profileImage subjects qualifications bio hourlyRate isVerified isBackgroundChecked createdAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      tutors: tutors.map((tutor: any) => ({
        id: tutor._id.toString(),
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        email: tutor.email,
        profileImage: tutor.profileImage,
        subjects: tutor.subjects || [],
        qualifications: tutor.qualifications || [],
        bio: tutor.bio,
        hourlyRate: tutor.hourlyRate,
        isVerified: tutor.isVerified || false,
        isBackgroundChecked: tutor.isBackgroundChecked || false,
        createdAt: tutor.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get tutor by ID for review
  static async getTutorById(tutorId: string) {
    const tutor = await userRepository.findById(tutorId);

    if (!tutor) {
      throw new AppError('Tutor not found', 404);
    }

    if ((tutor as any).role !== UserRole.TUTOR) {
      throw new AppError('User is not a tutor', 400);
    }

    return {
      id: (tutor as any)._id.toString(),
      firstName: (tutor as any).firstName,
      lastName: (tutor as any).lastName,
      email: (tutor as any).email,
      profileImage: (tutor as any).profileImage,
      subjects: (tutor as any).subjects || [],
      qualifications: (tutor as any).qualifications || [],
      bio: (tutor as any).bio,
      hourlyRate: (tutor as any).hourlyRate,
      rating: (tutor as any).rating || 0,
      totalSessions: (tutor as any).totalSessions || 0,
      isVerified: (tutor as any).isVerified || false,
      isBackgroundChecked: (tutor as any).isBackgroundChecked || false,
      createdAt: (tutor as any).createdAt,
      updatedAt: (tutor as any).updatedAt,
    };
  }

  // Approve tutor
  static async approveTutor(tutorId: string, adminNotes?: string) {
    const tutor = await userRepository.findById(tutorId);

    if (!tutor) {
      throw new AppError('Tutor not found', 404);
    }

    if ((tutor as any).role !== UserRole.TUTOR) {
      throw new AppError('User is not a tutor', 400);
    }

    // Update tutor status
    const updatedTutor = await userRepository.updateById(tutorId, {
      isVerified: true,
      isBackgroundChecked: true,
    } as any);

    if (!updatedTutor) {
      throw new AppError('Failed to approve tutor', 500);
    }

    // Send notification to tutor
    try {
      await notificationService.createNotification({
        userId: tutorId,
        type: 'system_announcement',
        title: '✅ Tutor Account Approved',
        message: 'Your tutor account has been approved! You can now start accepting students.',
        data: { adminNotes },
      });
    } catch (error) {
      logger.error('Failed to send approval notification', error);
    }

    return {
      id: (updatedTutor as any)._id.toString(),
      firstName: (updatedTutor as any).firstName,
      lastName: (updatedTutor as any).lastName,
      email: (updatedTutor as any).email,
      isVerified: (updatedTutor as any).isVerified,
      isBackgroundChecked: (updatedTutor as any).isBackgroundChecked,
    };
  }

  // Reject tutor
  static async rejectTutor(tutorId: string, reason: string) {
    const tutor = await userRepository.findById(tutorId);

    if (!tutor) {
      throw new AppError('Tutor not found', 404);
    }

    if ((tutor as any).role !== UserRole.TUTOR) {
      throw new AppError('User is not a tutor', 400);
    }

    // Send notification to tutor
    try {
      await notificationService.createNotification({
        userId: tutorId,
        type: 'system_announcement',
        title: '❌ Tutor Application Rejected',
        message: `Your tutor application has been rejected. Reason: ${reason}`,
        data: { reason },
      });
    } catch (error) {
      logger.error('Failed to send rejection notification', error);
    }

    return {
      id: (tutor as any)._id.toString(),
      message: 'Tutor application rejected',
    };
  }

  // Set background check status
  static async setBackgroundCheckStatus(tutorId: string, isBackgroundChecked: boolean) {
    const tutor = await userRepository.findById(tutorId);

    if (!tutor) {
      throw new AppError('Tutor not found', 404);
    }

    if ((tutor as any).role !== UserRole.TUTOR) {
      throw new AppError('User is not a tutor', 400);
    }

    const updatedTutor = await userRepository.updateById(tutorId, {
      isBackgroundChecked,
    } as any);

    if (!updatedTutor) {
      throw new AppError('Failed to update background check status', 500);
    }

    return {
      id: (updatedTutor as any)._id.toString(),
      isBackgroundChecked: (updatedTutor as any).isBackgroundChecked,
    };
  }

  // Get all users with filters
  static async getAllUsers(filters: {
    role?: UserRole;
    search?: string;
    isVerified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { role, search, isVerified, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
    }

    const total = await (userRepository as any).model.countDocuments(query);

    const users = await (userRepository as any).model
      .find(query)
      .select(
        'firstName lastName email role profileImage isVerified isBackgroundChecked lastLoginAt createdAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      users: users.map((user: any) => ({
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified || false,
        isBackgroundChecked: user.isBackgroundChecked || false,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get user by ID
  static async getUserById(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userData: any = {
      id: (user as any)._id.toString(),
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      email: (user as any).email,
      role: (user as any).role,
      profileImage: (user as any).profileImage,
      isVerified: (user as any).isVerified || false,
      isBackgroundChecked: (user as any).isBackgroundChecked || false,
      lastLoginAt: (user as any).lastLoginAt,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };

    // Add role-specific fields
    if ((user as any).role === UserRole.STUDENT) {
      userData.gradeLevel = (user as any).gradeLevel;
      userData.academicGoals = (user as any).academicGoals || [];
      userData.streakCount = (user as any).streakCount || 0;
      userData.totalPoints = (user as any).totalPoints || 0;
    } else if ((user as any).role === UserRole.TUTOR) {
      userData.subjects = (user as any).subjects || [];
      userData.qualifications = (user as any).qualifications || [];
      userData.bio = (user as any).bio;
      userData.hourlyRate = (user as any).hourlyRate;
      userData.rating = (user as any).rating || 0;
      userData.totalSessions = (user as any).totalSessions || 0;
    }

    return userData;
  }

  // Suspend/activate user account
  static async updateUserStatus(userId: string, isActive: boolean) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // For now, we'll use isVerified as a proxy for account status
    // In production, you might want a separate 'isActive' or 'isSuspended' field
    const updatedUser = await userRepository.updateById(userId, {
      isVerified: isActive,
    } as any);

    if (!updatedUser) {
      throw new AppError('Failed to update user status', 500);
    }

    // Send notification
    try {
      await notificationService.createNotification({
        userId,
        type: 'system_announcement',
        title: isActive ? '✅ Account Activated' : '⚠️ Account Suspended',
        message: isActive
          ? 'Your account has been activated. You can now use the platform.'
          : 'Your account has been suspended. Please contact support for more information.',
        data: { isActive },
      });
    } catch (error) {
      console.error('Failed to send status notification:', error);
    }

    return {
      id: (updatedUser as any)._id.toString(),
      isVerified: (updatedUser as any).isVerified,
      message: isActive ? 'Account activated' : 'Account suspended',
    };
  }

  // Get admin dashboard stats
  static async getDashboardStats() {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalParents,
      pendingTutors,
      verifiedTutors,
      activeUsers,
    ] = await Promise.all([
      (userRepository as any).model.countDocuments({}),
      (userRepository as any).model.countDocuments({ role: UserRole.STUDENT }),
      (userRepository as any).model.countDocuments({ role: UserRole.TUTOR }),
      (userRepository as any).model.countDocuments({ role: UserRole.PARENT }),
      (userRepository as any).model.countDocuments({
        role: UserRole.TUTOR,
        $or: [{ isVerified: false }, { isBackgroundChecked: false }],
      }),
      (userRepository as any).model.countDocuments({
        role: UserRole.TUTOR,
        isVerified: true,
        isBackgroundChecked: true,
      }),
      (userRepository as any).model.countDocuments({
        isVerified: true,
        lastLoginAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      }),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalTutors,
      totalParents,
      pendingTutors,
      verifiedTutors,
      activeUsers,
    };
  }
}
