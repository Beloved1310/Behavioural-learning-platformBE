/**
 * Unit Tests for UserRepository
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';
import { userRepository } from '../../../repositories/UserRepository';
import { User } from '../../../models/User';
import { UserRole } from '../../../types';

// Mock the User model
jest.mock('../../../models/User');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email (lowercase)', async () => {
      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      (User.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, null, undefined);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (User.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should find user with password field', async () => {
      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
      };

      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      const result = await userRepository.findByEmailWithPassword('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should normalize email (lowercase and trim)', async () => {
      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(null),
      });

      await userRepository.findByEmailWithPassword('  TEST@EXAMPLE.COM  ');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('findByIdWithFields', () => {
    it('should find user by ID with selected fields', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(userId),
        email: 'test@example.com',
        firstName: 'Test',
      };

      (User.findById as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      const result = await userRepository.findByIdWithFields(userId, 'email firstName');

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login timestamp', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(userId),
        email: 'test@example.com',
        lastLoginAt: new Date(),
      };

      (User.findByIdAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockUser);

      const result = await userRepository.updateLastLogin(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { lastLoginAt: expect.any(Date) },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const mockUsers = [
        { _id: new Types.ObjectId(), email: 'student1@example.com', role: UserRole.STUDENT },
        { _id: new Types.ObjectId(), email: 'student2@example.com', role: UserRole.STUDENT },
      ];

      (User.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockUsers);

      const result = await userRepository.findByRole(UserRole.STUDENT);

      expect(User.find).toHaveBeenCalledWith({ role: UserRole.STUDENT }, null, undefined);
      expect(result).toEqual(mockUsers);
    });

    it('should find users by role with additional filters', async () => {
      const mockUsers = [
        { _id: new Types.ObjectId(), email: 'tutor@example.com', role: UserRole.TUTOR },
      ];

      (User.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockUsers);

      const result = await userRepository.findByRole(UserRole.TUTOR, { isVerified: true });

      expect(User.find).toHaveBeenCalledWith(
        { role: UserRole.TUTOR, isVerified: true },
        null,
        undefined
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      const mockQuery = {
        limit: (jest.fn() as any).mockResolvedValue(1),
      };
      (User.countDocuments as jest.Mock) = (jest.fn() as any).mockReturnValue(mockQuery);

      const result = await userRepository.emailExists('test@example.com');

      expect(User.countDocuments).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const mockQuery = {
        limit: (jest.fn() as any).mockResolvedValue(0),
      };
      (User.countDocuments as jest.Mock) = (jest.fn() as any).mockReturnValue(mockQuery);

      const result = await userRepository.emailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findByVerificationToken', () => {
    it('should find user by verification token', async () => {
      const token = 'test-token-123';
      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        verificationToken: token,
        verificationTokenExpiry: new Date(Date.now() + 3600000),
      };

      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (User.findById as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue({ ...mockUser, verificationToken: token }),
      });

      const result = await userRepository.findByVerificationToken(token);

      expect(result).toBeDefined();
      expect((result as any)?.verificationToken).toBe(token);
    });

    it('should return null for empty token', async () => {
      const result = await userRepository.findByVerificationToken('');

      expect(result).toBeNull();
    });

    it('should return null when token not found', async () => {
      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(null),
      });

      const result = await userRepository.findByVerificationToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should include expired tokens when includeExpired is true', async () => {
      const token = 'expired-token';
      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        verificationToken: token,
      };

      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (User.findById as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue({ ...mockUser, verificationToken: token }),
      });

      const result = await userRepository.findByVerificationToken(token, true);

      expect(result).toBeDefined();
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify user and clear verification token', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(userId),
        email: 'test@example.com',
        isVerified: true,
      };

      (User.findByIdAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockUser);

      const result = await userRepository.verifyUserEmail(userId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          isVerified: true,
          $unset: { verificationToken: '', verificationTokenExpiry: '' },
        },
        { new: true }
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateVerificationToken', () => {
    it('should update verification token and expiry', async () => {
      const userId = new Types.ObjectId().toString();
      const token = 'new-token';
      const expiry = new Date(Date.now() + 3600000);

      (User.findByIdAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue({
        _id: userId,
        verificationToken: token,
        verificationTokenExpiry: expiry,
      });

      const result = await userRepository.updateVerificationToken(userId, token, expiry);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { verificationToken: token, verificationTokenExpiry: expiry },
        { new: true, runValidators: true }
      );
      expect(result).toBeDefined();
    });
  });

  describe('findByResetPasswordToken', () => {
    it('should find user by reset password token', async () => {
      const token = 'reset-token-123';
      const mockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        resetPasswordToken: token,
        resetPasswordTokenExpiry: new Date(Date.now() + 3600000),
      };

      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      const result = await userRepository.findByResetPasswordToken(token);

      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { $gt: expect.any(Date) },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when token not found', async () => {
      (User.findOne as jest.Mock) = jest.fn().mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(null),
      });

      const result = await userRepository.findByResetPasswordToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('updateResetPasswordToken', () => {
    it('should update reset password token and expiry', async () => {
      const userId = new Types.ObjectId().toString();
      const token = 'new-reset-token';
      const expiry = new Date(Date.now() + 3600000);

      (User.findByIdAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue({
        _id: userId,
        resetPasswordToken: token,
        resetPasswordTokenExpiry: expiry,
      });

      const result = await userRepository.updateResetPasswordToken(userId, token, expiry);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { resetPasswordToken: token, resetPasswordTokenExpiry: expiry },
        { new: true, runValidators: true }
      );
      expect(result).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password and clear reset token', async () => {
      const userId = new Types.ObjectId().toString();
      const hashedPassword = 'new-hashed-password';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        email: 'test@example.com',
        password: hashedPassword,
      };

      (User.findByIdAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockUser);

      const result = await userRepository.resetPassword(userId, hashedPassword);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          password: hashedPassword,
          $unset: { resetPasswordToken: '', resetPasswordTokenExpiry: '' },
        },
        { new: true }
      );
      expect(result).toEqual(mockUser);
    });
  });
});
