import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User, UserPreferences } from '../models';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../utils/cloudinary';

export class UserController {
  // Get current user profile
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await User.findById(userId).select('-password');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get user preferences
      let preferences = await UserPreferences.findOne({ userId });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await UserPreferences.create({
          userId,
          studyReminders: true,
          darkMode: false,
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          sessionReminders: true,
          progressReports: true,
          weeklyReport: true
        });
      }

      res.json({
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage || null,
          phoneNumber: user.phoneNumber || null,
          dateOfBirth: user.dateOfBirth || null,
          // Student-specific fields
          gradeLevel: user.gradeLevel || null,
          learningStyle: user.learningStyle || null,
          academicGoals: user.academicGoals || [],
          // Tutor-specific fields
          subjects: user.subjects || [],
          bio: user.bio || null,
          qualifications: user.qualifications || [],
          // Gamification
          totalPoints: user.totalPoints || 0,
          streakCount: user.streakCount || 0,
          // Subscription
          subscriptionTier: user.subscriptionTier || 'FREE',
          subscriptionStatus: user.subscriptionStatus || 'INACTIVE',
          // Preferences
          preferences: {
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
            sessionReminders: preferences.sessionReminders,
            weeklyReport: preferences.weeklyReport,
            studyReminders: preferences.studyReminders,
            darkMode: preferences.darkMode,
            language: preferences.language,
            timezone: preferences.timezone
          },
          // Timestamps
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        profileImage,
        // Student-specific fields
        gradeLevel,
        learningStyle,
        academicGoals,
        // Tutor-specific fields
        subjects,
        bio,
        qualifications
      } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update basic fields (common to all roles)
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (profileImage !== undefined) user.profileImage = profileImage;

      // Update role-specific fields
      if (user.role === 'STUDENT') {
        if (gradeLevel !== undefined) user.gradeLevel = gradeLevel;
        if (learningStyle !== undefined) user.learningStyle = learningStyle;
        if (academicGoals !== undefined) {
          // Handle both array and comma-separated string
          if (Array.isArray(academicGoals)) {
            user.academicGoals = academicGoals.filter(goal => goal && goal.trim());
          } else if (typeof academicGoals === 'string') {
            user.academicGoals = academicGoals
              .split(',')
              .map(goal => goal.trim())
              .filter(Boolean);
          }
        }
      }

      if (user.role === 'TUTOR') {
        if (subjects !== undefined) {
          // Handle both array and comma-separated string
          if (Array.isArray(subjects)) {
            user.subjects = subjects.filter(subject => subject && subject.trim());
          } else if (typeof subjects === 'string') {
            user.subjects = subjects
              .split(',')
              .map(subject => subject.trim())
              .filter(Boolean);
          }
        }
        if (bio !== undefined) user.bio = bio;
        if (qualifications !== undefined) {
          if (Array.isArray(qualifications)) {
            user.qualifications = qualifications.filter(qual => qual && qual.trim());
          } else if (typeof qualifications === 'string') {
            user.qualifications = qualifications
              .split(',')
              .map(qual => qual.trim())
              .filter(Boolean);
          }
        }
      }

      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(userId).select('-password');

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser!._id.toString(),
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          email: updatedUser!.email,
          role: updatedUser!.role,
          profileImage: updatedUser!.profileImage || null,
          phoneNumber: updatedUser!.phoneNumber || null,
          dateOfBirth: updatedUser!.dateOfBirth || null,
          // Student-specific fields
          gradeLevel: updatedUser!.gradeLevel || null,
          learningStyle: updatedUser!.learningStyle || null,
          academicGoals: updatedUser!.academicGoals || [],
          // Tutor-specific fields
          subjects: updatedUser!.subjects || [],
          bio: updatedUser!.bio || null,
          qualifications: updatedUser!.qualifications || [],
          // Gamification
          totalPoints: updatedUser!.totalPoints || 0,
          streakCount: updatedUser!.streakCount || 0,
          // Subscription
          subscriptionTier: updatedUser!.subscriptionTier || 'FREE',
          subscriptionStatus: updatedUser!.subscriptionStatus || 'INACTIVE',
          // Timestamps
          createdAt: updatedUser!.createdAt,
          updatedAt: updatedUser!.updatedAt,
          lastLoginAt: updatedUser!.lastLoginAt
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Update password
  static async updatePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters long', 400);
      }

      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        message: 'Password updated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete account
  static async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { password } = req.body;

      if (!password) {
        throw new AppError('Password is required to delete account', 400);
      }

      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError('Incorrect password', 401);
      }

      // Delete user
      await User.findByIdAndDelete(userId);

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  // Upload profile image
  static async uploadProfileImage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        throw new AppError('No image file provided', 400);
      }

      // Validate file size (already validated by multer, but double-check)
      if (file.size > 2 * 1024 * 1024) {
        throw new AppError('Image size must be less than 2MB', 400);
      }

      // Get current user to check for existing profile image
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Delete old image from Cloudinary if exists
      if (user.profileImage) {
        const publicId = extractPublicId(user.profileImage);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        'profile-images',
        `user-${userId}`
      );

      // Update user profile with new image URL
      user.profileImage = uploadResult.secure_url;
      await user.save();

      res.json({
        message: 'Profile image uploaded successfully',
        imageUrl: uploadResult.secure_url,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImage: user.profileImage
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete profile image
  static async deleteProfileImage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.profileImage) {
        throw new AppError('No profile image to delete', 400);
      }

      // Delete image from Cloudinary
      const publicId = extractPublicId(user.profileImage);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }

      // Remove image URL from user profile
      user.profileImage = undefined;
      await user.save();

      res.json({
        message: 'Profile image deleted successfully'
      });
    } catch (error) {
      throw error;
    }
  }
}
