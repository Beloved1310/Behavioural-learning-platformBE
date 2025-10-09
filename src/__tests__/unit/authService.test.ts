import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/authService';
import { userRepository } from '../../repositories/UserRepository';
import { userPreferencesRepository } from '../../repositories/UserPreferencesRepository';
import { sendEmail } from '../../services/emailService';
import { UserRole } from '../../types';
import { validUserData, validTutorData, generateValidToken, generateFutureDate, generateExpiredDate } from '../helpers/testData';

// Mock repositories and email service
jest.mock('../../repositories/UserRepository');
jest.mock('../../repositories/UserPreferencesRepository');
jest.mock('../../services/emailService');

// Type for mocked functions
type MockedFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        isVerified: false,
        subscriptionTier: 'BASIC',
        createdAt: new Date(),
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(null);
      (userRepository.create as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (userPreferencesRepository.create as jest.MockedFunction<any>).mockResolvedValue({});
      (sendEmail as jest.MockedFunction<any>).mockResolvedValue(undefined);

      // Act
      const result = await AuthService.register(validUserData);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userPreferencesRepository.create).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(result.user.email).toBe(validUserData.email);
      expect(result.message).toContain('verify your account');
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue({ email: validUserData.email });

      // Act & Assert
      await expect(AuthService.register(validUserData)).rejects.toThrow('User with this email already exists');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should validate student age between 13-18', async () => {
      // Arrange
      const youngStudent = {
        ...validUserData,
        dateOfBirth: new Date().getFullYear() - 10 + '-01-15', // 10 years old
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.register(youngStudent)).rejects.toThrow('Students must be between 13 and 18 years old');
    });

    it('should require parent email for students under 18', async () => {
      // Arrange
      const minorStudent = {
        ...validUserData,
        dateOfBirth: new Date().getFullYear() - 16 + '-01-15', // 16 years old
        parentEmail: undefined,
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.register(minorStudent)).rejects.toThrow('Parent email is required for users under 18');
    });

    it('should create tutor with correct fields', async () => {
      // Arrange
      const mockTutor = {
        _id: '507f1f77bcf86cd799439012',
        ...validTutorData,
        isVerified: false,
        subjects: [],
        qualifications: [],
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(null);
      (userRepository.create as jest.MockedFunction<any>).mockResolvedValue(mockTutor);
      (userPreferencesRepository.create as jest.MockedFunction<any>).mockResolvedValue({});
      (sendEmail as jest.MockedFunction<any>).mockResolvedValue(undefined);

      // Act
      await AuthService.register(validTutorData);

      // Assert
      const createCallArgs: any = (userRepository.create as jest.MockedFunction<any>).mock.calls[0][0];
      expect(createCallArgs.subjects).toEqual([]);
      expect(createCallArgs.qualifications).toEqual([]);
    });
  });

  describe('login', () => {
    it('should successfully login a verified user', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        password: await AuthService.hashPassword(validUserData.password),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        isVerified: true,
        subscriptionTier: 'BASIC',
        profileImage: null,
        lastLoginAt: null,
      };

      (userRepository.findByEmailWithPassword as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (userRepository.updateLastLogin as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.login({
        email: validUserData.email,
        password: validUserData.password,
      });

      // Assert
      expect(result.user.email).toBe(validUserData.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(userRepository.updateLastLogin).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      (userRepository.findByEmailWithPassword as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.login({ email: 'nonexistent@example.com', password: 'password' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const mockUser = {
        email: validUserData.email,
        password: await AuthService.hashPassword('differentpassword'),
        isVerified: true,
      };

      (userRepository.findByEmailWithPassword as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        AuthService.login({ email: validUserData.email, password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for unverified user', async () => {
      // Arrange
      const mockUser = {
        email: validUserData.email,
        password: await AuthService.hashPassword(validUserData.password),
        isVerified: false,
      };

      (userRepository.findByEmailWithPassword as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        AuthService.login({ email: validUserData.email, password: validUserData.password })
      ).rejects.toThrow('Please verify your email');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      // Arrange
      const token = generateValidToken();
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        isVerified: false,
        verificationToken: token,
        verificationTokenExpiry: generateFutureDate(),
      };

      (userRepository.findByVerificationToken as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (userRepository.verifyUserEmail as jest.MockedFunction<any>).mockResolvedValue({ ...mockUser, isVerified: true });

      // Act
      const result = await AuthService.verifyEmail(token);

      // Assert
      expect(result.message).toContain('verified successfully');
      expect(userRepository.verifyUserEmail).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      (userRepository.findByVerificationToken as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
    });

    it('should return success message if already verified', async () => {
      // Arrange
      const token = generateValidToken();
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        isVerified: true,
        verificationToken: token,
        verificationTokenExpiry: generateFutureDate(),
      };

      (userRepository.findByVerificationToken as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.verifyEmail(token);

      // Assert
      expect(result.message).toContain('already verified');
      expect(userRepository.verifyUserEmail).not.toHaveBeenCalled();
    });

    it('should throw error if token is missing', async () => {
      // Act & Assert
      await expect(AuthService.verifyEmail('')).rejects.toThrow('Verification token is required');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email for unverified user', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        isVerified: false,
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (userRepository.updateVerificationToken as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (sendEmail as jest.MockedFunction<any>).mockResolvedValue(undefined);

      // Act
      const result = await AuthService.resendVerificationEmail(validUserData.email);

      // Assert
      expect(result.message).toContain('verification email');
      expect(userRepository.updateVerificationToken).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should throw error if user is already verified', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        isVerified: true,
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(AuthService.resendVerificationEmail(validUserData.email)).rejects.toThrow('Email is already verified');
    });

    it('should return generic message for non-existent email', async () => {
      // Arrange
      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      const result = await AuthService.resendVerificationEmail('nonexistent@example.com');

      // Assert
      expect(result.message).toContain('verification email');
      expect(userRepository.updateVerificationToken).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
      };

      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (userRepository.updateResetPasswordToken as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (sendEmail as jest.MockedFunction<any>).mockResolvedValue(undefined);

      // Act
      const result = await AuthService.forgotPassword(validUserData.email);

      // Assert
      expect(result.message).toContain('password reset link');
      expect(userRepository.updateResetPasswordToken).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should return generic message for non-existent email', async () => {
      // Arrange
      (userRepository.findByEmail as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      const result = await AuthService.forgotPassword('nonexistent@example.com');

      // Assert
      expect(result.message).toContain('password reset link');
      expect(userRepository.updateResetPasswordToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      const token = generateValidToken();
      const newPassword = 'NewPassword123!';
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        resetPasswordToken: token,
        resetPasswordTokenExpiry: generateFutureDate(),
      };

      (userRepository.findByResetPasswordToken as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (userRepository.resetPassword as jest.MockedFunction<any>).mockResolvedValue({ ...mockUser, password: 'hashed' });

      // Act
      const result = await AuthService.resetPassword(token, newPassword);

      // Assert
      expect(result.message).toContain('Password reset successful');
      expect(userRepository.resetPassword).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      (userRepository.findByResetPasswordToken as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.resetPassword('invalid-token', 'NewPassword123!')).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const token = generateValidToken();

      // Act & Assert
      await expect(AuthService.resetPassword(token, 'short')).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error if token is missing', async () => {
      // Act & Assert
      await expect(AuthService.resetPassword('', 'NewPassword123!')).rejects.toThrow('Reset token is required');
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        role: UserRole.STUDENT,
        isVerified: true,
      };

      // Generate a valid refresh token
      const tokens = AuthService.generateTokens(mockUser._id.toString());

      (userRepository.findByIdWithFields as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.refreshToken(tokens.refreshToken);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      // Act & Assert
      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for unverified user', async () => {
      // Arrange
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: validUserData.email,
        role: UserRole.STUDENT,
        isVerified: false,
      };

      const tokens = AuthService.generateTokens(mockUser._id.toString());
      (userRepository.findByIdWithFields as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(AuthService.refreshToken(tokens.refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('Password hashing and comparison', () => {
    it('should hash password correctly', async () => {
      // Act
      const hashed = await AuthService.hashPassword('password123');

      // Assert
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe('password123');
      expect(hashed.startsWith('$2a$') || hashed.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });

    it('should compare password correctly', async () => {
      // Arrange
      const password = 'password123';
      const hashed = await AuthService.hashPassword(password);

      // Act
      const isValid = await AuthService.comparePassword(password, hashed);
      const isInvalid = await AuthService.comparePassword('wrongpassword', hashed);

      // Assert
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Token generation', () => {
    it('should generate valid JWT tokens', () => {
      // Act
      const tokens = AuthService.generateTokens('user-id-123');

      // Assert
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });
});
