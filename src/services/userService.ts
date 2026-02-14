import { userRepository } from '../repositories/UserRepository';
import { userPreferencesRepository } from '../repositories/UserPreferencesRepository';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../utils/cloudinary';
import { IUser, IUserPreferences } from '../types';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

function normalizeStringList(input: string[] | string | undefined): string[] | undefined {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) {
    return input.filter((item) => item && item.trim()).map((item) => item.trim());
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

export class UserService {
  static async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    let preferences = await userPreferencesRepository.findByUserId(userId);
    if (!preferences) {
      preferences = await userPreferencesRepository.create({
        userId: new Types.ObjectId(userId),
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      } as Partial<IUserPreferences>);
    }

    const safeUser = await userRepository.findByIdWithFields(userId, '-password');
    return { user: safeUser!, preferences };
  }

  static async updateProfile(userId: string, payload: Partial<IUser>) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      profileImage,
      gradeLevel,
      learningStyle,
      academicGoals,
      subjects,
      bio,
      qualifications,
    } = payload as any;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber as any;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth as any;
    if (profileImage !== undefined) user.profileImage = profileImage as any;

    if (user.role === 'STUDENT') {
      if (gradeLevel !== undefined) user.gradeLevel = gradeLevel as any;
      if (learningStyle !== undefined) user.learningStyle = learningStyle as any;
      const normalizedGoals = normalizeStringList(academicGoals as any);
      if (normalizedGoals !== undefined) user.academicGoals = normalizedGoals;
    }

    if (user.role === 'TUTOR') {
      const normalizedSubjects = normalizeStringList(subjects as any);
      if (normalizedSubjects !== undefined) user.subjects = normalizedSubjects;
      if (bio !== undefined) user.bio = bio as any;
      const normalizedQualifications = normalizeStringList(qualifications as any);
      if (normalizedQualifications !== undefined) user.qualifications = normalizedQualifications;
    }

    await user.save();

    const updatedUser = await userRepository.findByIdWithFields(userId, '-password');
    return updatedUser!;
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await (user as any).comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    (user as any).password = newPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  static async deleteAccount(userId: string, password: string) {
    if (!password) {
      throw new AppError('Password is required to delete account', 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await (user as any).comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Incorrect password', 401);
    }

    await userRepository.deleteById(userId);
    return { message: 'Account deleted successfully' };
  }

  static async uploadProfileImage(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new AppError('No image file provided', 400);
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new AppError('Image size must be less than 2MB', 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    const uploadResult = await uploadToCloudinary(file.buffer, 'profile-images', `user-${userId}`);

    user.profileImage = uploadResult.secure_url;
    await user.save();

    return {
      imageUrl: uploadResult.secure_url,
      user,
    };
  }

  static async deleteProfileImage(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.profileImage) {
      throw new AppError('No profile image to delete', 400);
    }

    const publicId = extractPublicId(user.profileImage);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    user.profileImage = undefined as any;
    await user.save();

    return { message: 'Profile image deleted successfully' };
  }

  static async exportUserData(userId: string) {
    try {
      const user = await userRepository.findByIdWithFields(userId, '-password');
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get user preferences
      const preferences = await userPreferencesRepository.findByUserId(userId);

      // Get related data based on user role
      const exportData: any = {
        exportDate: new Date().toISOString(),
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phoneNumber: (user as any).phoneNumber || null,
          dateOfBirth: (user as any).dateOfBirth || null,
          profileImage: user.profileImage || null,
          subscriptionTier: (user as any).subscriptionTier || null,
          subscriptionStatus: (user as any).subscriptionStatus || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: (user as any).lastLoginAt || null,
        },
        preferences: preferences
          ? {
              emailNotifications: preferences.emailNotifications,
              pushNotifications: preferences.pushNotifications,
              sessionReminders: preferences.sessionReminders,
              weeklyReport: preferences.weeklyReport,
              studyReminders: preferences.studyReminders,
              language: preferences.language,
              timezone: preferences.timezone,
            }
          : null,
      };

      // Add role-specific data
      if (user.role === 'STUDENT') {
        exportData.studentData = {
          gradeLevel: (user as any).gradeLevel || null,
          learningStyle: (user as any).learningStyle || null,
          academicGoals: (user as any).academicGoals || [],
          streakCount: (user as any).streakCount || 0,
          totalPoints: (user as any).totalPoints || 0,
        };

        // Get quiz attempts
        try {
          const { QuizAttempt } = await import('../models/QuizAttempt');
          const quizAttempts = await QuizAttempt.find({ userId: new Types.ObjectId(userId) })
            .populate('quizId', 'title subject difficulty')
            .limit(100)
            .sort({ createdAt: -1 })
            .lean();
          exportData.quizAttempts = quizAttempts.map((attempt: any) => ({
            quizTitle: attempt.quizId?.title || 'Unknown',
            subject: attempt.quizId?.subject || null,
            difficulty: attempt.quizId?.difficulty || null,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            completedAt: attempt.completedAt,
          }));
        } catch (error: any) {
          logger.error('[UserService] Error fetching quiz attempts', error);
          exportData.quizAttempts = [];
        }
      }

      if (user.role === 'TUTOR') {
        exportData.tutorData = {
          subjects: (user as any).subjects || [],
          bio: (user as any).bio || null,
          qualifications: (user as any).qualifications || [],
          hourlyRate: (user as any).hourlyRate || null,
          rating: (user as any).rating || 0,
          totalSessions: (user as any).totalSessions || 0,
          isBackgroundChecked: (user as any).isBackgroundChecked || false,
        };

        // Get sessions
        try {
          const { Session } = await import('../models/Session');
          const sessions = await Session.find({
            $or: [
              { studentId: new Types.ObjectId(userId) },
              { tutorId: new Types.ObjectId(userId) },
            ],
          })
            .populate('studentId', 'firstName lastName email')
            .populate('tutorId', 'firstName lastName email')
            .limit(100)
            .sort({ createdAt: -1 })
            .lean();
          exportData.sessions = sessions.map((session: any) => ({
            title: session.title,
            status: session.status,
            scheduledAt: session.scheduledAt,
            duration: session.duration,
            student: session.studentId
              ? {
                  name: `${session.studentId.firstName} ${session.studentId.lastName}`,
                  email: session.studentId.email,
                }
              : null,
            tutor: session.tutorId
              ? {
                  name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
                  email: session.tutorId.email,
                }
              : null,
            createdAt: session.createdAt,
          }));
        } catch (error: any) {
          logger.error('[UserService] Error fetching sessions', error);
          exportData.sessions = [];
        }
      }

      // Generate export ID
      const exportId = `export-${userId}-${Date.now()}`;

      return {
        exportId,
        data: exportData,
        message: 'Data export generated successfully',
      };
    } catch (error: any) {
      logger.error('[UserService] Error in exportUserData', error);
      throw new AppError(error?.message || 'Failed to export user data', 500);
    }
  }
}

export default UserService;
