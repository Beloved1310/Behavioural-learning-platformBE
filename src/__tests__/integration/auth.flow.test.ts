import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/authService';
import { userRepository } from '../../repositories/UserRepository';
import { userPreferencesRepository } from '../../repositories/UserPreferencesRepository';
import { User } from '../../models/User';
import { UserPreferences } from '../../models/UserPreferences';
import { UserRole } from '../../types';
import { validUserData, validTutorData } from '../helpers/testData';

// Mock email service for integration tests
jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendSessionReminderEmail: jest.fn().mockResolvedValue(undefined),
  sendProgressReportEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(async () => {
    // Database is cleared by setup.ts after each test
  });

  describe('Complete Registration Flow', () => {
    it('should register a new student and create user preferences', async () => {
      // Act - Register
      const result = await AuthService.register(validUserData);

      // Assert - User created
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validUserData.email);
      expect(result.user.isVerified).toBe(false);
      expect(result.message).toContain('verify your account');

      // Assert - User exists in database
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      expect(dbUser).toBeDefined();
      expect(dbUser?.role).toBe(UserRole.STUDENT);
      expect(dbUser?.isVerified).toBe(false);
      expect(dbUser?.verificationToken).toBeDefined();

      // Assert - User preferences created
      const prefs = await UserPreferences.findOne({ userId: dbUser?._id });
      expect(prefs).toBeDefined();
      expect(prefs?.studyReminders).toBe(true);
      expect(prefs?.darkMode).toBe(false);
    });

    it('should register a new tutor with role-specific fields', async () => {
      // Act
      const result = await AuthService.register(validTutorData);

      // Assert
      const dbUser = await User.findOne({ email: validTutorData.email });
      expect(dbUser).toBeDefined();
      expect(dbUser?.role).toBe(UserRole.TUTOR);
      expect(dbUser?.subjects).toEqual([]);
      expect(dbUser?.qualifications).toEqual([]);
      expect(dbUser?.isBackgroundChecked).toBe(false);
    });
  });

  describe('Complete Email Verification Flow', () => {
    it('should verify email after registration', async () => {
      // Step 1: Register
      const registerResult = await AuthService.register(validUserData);

      // Step 2: Get verification token
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      expect(dbUser?.verificationToken).toBeDefined();
      const token = dbUser!.verificationToken!;

      // Step 3: Verify email
      const verifyResult = await AuthService.verifyEmail(token);
      expect(verifyResult.message).toContain('verified successfully');

      // Step 4: Check user is verified in database
      const verifiedUser = await User.findById(dbUser?._id).select('+verificationToken');
      expect(verifiedUser?.isVerified).toBe(true);

      // Step 5: Verify token is cleared after successful verification
      expect(verifiedUser?.verificationToken).toBeFalsy();
    });

    it('should resend verification email', async () => {
      // Step 1: Register
      await AuthService.register(validUserData);

      // Step 2: Resend verification
      const resendResult = await AuthService.resendVerificationEmail(validUserData.email);
      expect(resendResult.message).toContain('verification email');

      // Step 3: Verify new token was generated
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      expect(dbUser?.verificationToken).toBeDefined();
    });
  });

  describe('Complete Login Flow', () => {
    it('should prevent login before email verification', async () => {
      // Step 1: Register
      await AuthService.register(validUserData);

      // Step 2: Try to login (should fail - not verified)
      await expect(
        AuthService.login({ email: validUserData.email, password: validUserData.password })
      ).rejects.toThrow('verify your email');
    });

    it('should successfully login after email verification', async () => {
      // Step 1: Register
      await AuthService.register(validUserData);

      // Step 2: Get and verify email
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);

      // Step 3: Login
      const loginResult = await AuthService.login({
        email: validUserData.email,
        password: validUserData.password,
      });

      // Assert
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.email).toBe(validUserData.email);
      expect(loginResult.tokens.accessToken).toBeDefined();
      expect(loginResult.tokens.refreshToken).toBeDefined();

      // Step 4: Check last login updated
      const updatedUser = await User.findById(dbUser?._id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
    });
  });

  describe('Complete Password Reset Flow', () => {
    it('should reset password for verified user', async () => {
      // Step 1: Register and verify
      await AuthService.register(validUserData);
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);

      // Step 2: Request password reset
      const forgotResult = await AuthService.forgotPassword(validUserData.email);
      expect(forgotResult.message).toContain('password reset link');

      // Step 3: Get reset token
      const userWithToken = await User.findById(dbUser?._id).select('+resetPasswordToken');
      expect(userWithToken?.resetPasswordToken).toBeDefined();
      const resetToken = userWithToken!.resetPasswordToken!;

      // Step 4: Reset password
      const newPassword = 'NewPassword123!';
      const resetResult = await AuthService.resetPassword(resetToken, newPassword);
      expect(resetResult.message).toContain('Password reset successful');

      // Step 5: Verify old password doesn't work
      await expect(
        AuthService.login({ email: validUserData.email, password: validUserData.password })
      ).rejects.toThrow('Invalid email or password');

      // Step 6: Login with new password
      const loginResult = await AuthService.login({
        email: validUserData.email,
        password: newPassword,
      });
      expect(loginResult.user.email).toBe(validUserData.email);
      expect(loginResult.tokens).toBeDefined();
    });

    it('should prevent password reset with expired token', async () => {
      // Step 1: Register and verify
      await AuthService.register(validUserData);
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);

      // Step 2: Request password reset
      await AuthService.forgotPassword(validUserData.email);

      // Step 3: Manually expire the token
      await User.findByIdAndUpdate(dbUser?._id, {
        resetPasswordTokenExpiry: new Date(Date.now() - 1000),
      });

      // Step 4: Get reset token
      const userWithToken = await User.findById(dbUser?._id).select('+resetPasswordToken');
      const resetToken = userWithToken!.resetPasswordToken!;

      // Step 5: Try to reset password (should fail)
      await expect(
        AuthService.resetPassword(resetToken, 'NewPassword123!')
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('Complete Token Refresh Flow', () => {
    it('should refresh tokens for authenticated user', async () => {
      // Step 1: Register and verify
      await AuthService.register(validUserData);
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);

      // Step 2: Login
      const loginResult = await AuthService.login({
        email: validUserData.email,
        password: validUserData.password,
      });

      // Step 3: Wait 1 second to ensure different token (JWT includes timestamp)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Refresh tokens
      const refreshResult = await AuthService.refreshToken(loginResult.tokens.refreshToken);

      // Assert
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(loginResult.tokens.accessToken);
    });
  });

  describe('End-to-End User Journey', () => {
    it('should complete full user lifecycle', async () => {
      // 1. User registers
      const registerResult = await AuthService.register(validUserData);
      expect(registerResult.user.isVerified).toBe(false);

      // 2. User verifies email
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);

      // 3. User logs in
      const loginResult = await AuthService.login({
        email: validUserData.email,
        password: validUserData.password,
      });
      expect(loginResult.tokens).toBeDefined();

      // 4. User forgets password
      await AuthService.forgotPassword(validUserData.email);

      // 5. User resets password
      const userWithResetToken = await User.findById(dbUser?._id).select(
        '+resetPasswordToken'
      );
      const newPassword = 'NewPassword123!';
      await AuthService.resetPassword(userWithResetToken!.resetPasswordToken!, newPassword);

      // 6. User logs in with new password
      const newLoginResult = await AuthService.login({
        email: validUserData.email,
        password: newPassword,
      });
      expect(newLoginResult.tokens).toBeDefined();

      // 7. User refreshes tokens
      const refreshResult = await AuthService.refreshToken(newLoginResult.tokens.refreshToken);
      expect(refreshResult.accessToken).toBeDefined();

      // 8. Verify user preferences exist
      const prefs = await userPreferencesRepository.findByUserId(dbUser!._id.toString());
      expect(prefs).toBeDefined();

      // 9. Update user preferences
      await userPreferencesRepository.updateByUserId(dbUser!._id.toString(), {
        darkMode: true,
        language: 'es',
      });

      const updatedPrefs = await userPreferencesRepository.findByUserId(dbUser!._id.toString());
      expect(updatedPrefs?.darkMode).toBe(true);
      expect(updatedPrefs?.language).toBe('es');
    });
  });

  describe('Security and Edge Cases', () => {
    it('should not allow duplicate email registration', async () => {
      // Step 1: Register first user
      await AuthService.register(validUserData);

      // Step 2: Try to register again
      await expect(AuthService.register(validUserData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should enforce password strength', async () => {
      // Arrange
      const weakPasswordData = {
        ...validUserData,
        email: 'weak@example.com',
      };

      await AuthService.register(weakPasswordData);
      const dbUser = await User.findOne({ email: weakPasswordData.email }).select(
        '+verificationToken +resetPasswordToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);
      await AuthService.forgotPassword(weakPasswordData.email);

      const userWithResetToken = await User.findById(dbUser?._id).select('+resetPasswordToken');

      // Act & Assert
      await expect(
        AuthService.resetPassword(userWithResetToken!.resetPasswordToken!, 'weak')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should clear tokens after use', async () => {
      // Step 1: Register
      await AuthService.register(validUserData);

      // Step 2: Verify email
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      const verificationToken = dbUser!.verificationToken!;
      await AuthService.verifyEmail(verificationToken);

      // Step 3: Verify token is cleared after verification
      const userAfterVerify = await User.findById(dbUser?._id).select('+verificationToken');
      expect(userAfterVerify?.verificationToken).toBeFalsy();

      // Step 4: Request password reset
      await AuthService.forgotPassword(validUserData.email);
      const userWithResetToken = await User.findById(dbUser?._id).select('+resetPasswordToken');
      const resetToken = userWithResetToken!.resetPasswordToken!;

      // Step 5: Reset password
      await AuthService.resetPassword(resetToken, 'NewPassword123!');

      // Step 6: Verify reset token is cleared
      const userAfterReset = await User.findById(dbUser?._id).select('+resetPasswordToken');
      expect(userAfterReset?.resetPasswordToken).toBeFalsy();
    });

    it('should handle case-insensitive email lookups', async () => {
      // Step 1: Register with lowercase
      await AuthService.register(validUserData);

      // Step 2: Verify email
      const dbUser = await User.findOne({ email: validUserData.email }).select(
        '+verificationToken'
      );
      await AuthService.verifyEmail(dbUser!.verificationToken!);

      // Step 3: Login with uppercase (should work)
      const loginResult = await AuthService.login({
        email: validUserData.email.toUpperCase(),
        password: validUserData.password,
      });

      expect(loginResult.user.email).toBe(validUserData.email.toLowerCase());
    });
  });

  describe('Repository Integration', () => {
    it('should correctly use repository methods throughout auth flow', async () => {
      // Register
      await AuthService.register(validUserData);

      // Verify email exists
      const emailExists = await userRepository.emailExists(validUserData.email);
      expect(emailExists).toBe(true);

      // Find by email
      const user = await userRepository.findByEmail(validUserData.email);
      expect(user).toBeDefined();

      // Count users
      const count = await userRepository.count();
      expect(count).toBe(1);

      // Increment streak
      await userRepository.increment({ _id: user!._id } as any, 'streakCount', 1);
      const updatedUser = await userRepository.findById(user!._id.toString());
      expect(updatedUser?.streakCount).toBe(1);

      // Find by role
      const students = await userRepository.findByRole(UserRole.STUDENT);
      expect(students).toHaveLength(1);
    });
  });
});
