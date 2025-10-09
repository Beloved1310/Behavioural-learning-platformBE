import { describe, it, expect, beforeEach } from '@jest/globals';
import { userRepository } from '../../repositories/UserRepository';
import { User } from '../../models/User';
import { UserRole } from '../../types';
import { validUserData, validTutorData, generateValidToken, generateFutureDate } from '../helpers/testData';

describe('UserRepository', () => {
  beforeEach(async () => {
    // Clear database before each test (handled by setup.ts)
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData = {
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      };

      // Act
      const user = await userRepository.create(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(validUserData.email.toLowerCase());
      expect(user.firstName).toBe(validUserData.firstName);
      expect(user.role).toBe(UserRole.STUDENT);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByEmail(validUserData.email);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(validUserData.email.toLowerCase());
      expect(foundUser?._id.toString()).toBe(user._id.toString());
    });

    it('should return null for non-existent email', async () => {
      // Act
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(foundUser).toBeNull();
    });

    it('should be case-insensitive', async () => {
      // Arrange
      await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test@example.com');
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should find user with password field', async () => {
      // Arrange
      await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByEmailWithPassword(validUserData.email);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?.password).toBe('hashedpassword');
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findById(user._id.toString());

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(user._id.toString());
    });
  });

  describe('updateById', () => {
    it('should update user by ID', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const updatedUser = await userRepository.updateById(user._id.toString(), {
        firstName: 'UpdatedName',
      } as any);

      // Assert
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe('UpdatedName');
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      // Arrange
      await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const exists = await userRepository.emailExists(validUserData.email);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      // Act
      const exists = await userRepository.emailExists('nonexistent@example.com');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLoginAt timestamp', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const updatedUser = await userRepository.updateLastLogin(user._id.toString());

      // Assert
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('findByRole', () => {
    it('should find all users by role', async () => {
      // Arrange
      await User.create({
        email: 'student1@example.com',
        password: 'hashedpassword',
        firstName: 'Student',
        lastName: 'One',
        role: UserRole.STUDENT,
        academicGoals: [],
      });

      await User.create({
        email: validTutorData.email,
        password: 'hashedpassword',
        firstName: validTutorData.firstName,
        lastName: validTutorData.lastName,
        role: UserRole.TUTOR,
        subjects: [],
        qualifications: [],
      });

      // Act
      const students = await userRepository.findByRole(UserRole.STUDENT);
      const tutors = await userRepository.findByRole(UserRole.TUTOR);

      // Assert
      expect(students).toHaveLength(1);
      expect(tutors).toHaveLength(1);
      expect(students[0].role).toBe(UserRole.STUDENT);
      expect(tutors[0].role).toBe(UserRole.TUTOR);
    });

    it('should find users by role with additional filters', async () => {
      // Arrange
      await User.create({
        email: 'verified@example.com',
        password: 'hashedpassword',
        firstName: 'Verified',
        lastName: 'Student',
        role: UserRole.STUDENT,
        isVerified: true,
        academicGoals: [],
      });

      await User.create({
        email: 'unverified@example.com',
        password: 'hashedpassword',
        firstName: 'Unverified',
        lastName: 'Student',
        role: UserRole.STUDENT,
        isVerified: false,
        academicGoals: [],
      });

      // Act
      const verifiedStudents = await userRepository.findByRole(UserRole.STUDENT, {
        isVerified: true,
      } as any);

      // Assert
      expect(verifiedStudents).toHaveLength(1);
      expect(verifiedStudents[0].isVerified).toBe(true);
    });
  });

  describe('Email Verification', () => {
    it('should find user by verification token', async () => {
      // Arrange
      const token = generateValidToken();
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        verificationToken: token,
        verificationTokenExpiry: generateFutureDate(),
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByVerificationToken(token);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(user._id.toString());
      expect(foundUser?.verificationToken).toBe(token);
    });

    it('should not find user with expired verification token', async () => {
      // Arrange
      const token = generateValidToken();
      await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        verificationToken: token,
        verificationTokenExpiry: new Date(Date.now() - 1000), // Expired
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByVerificationToken(token);

      // Assert
      expect(foundUser).toBeNull();
    });

    it('should verify user email', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        isVerified: false,
        verificationToken: generateValidToken(),
        verificationTokenExpiry: generateFutureDate(),
        academicGoals: [],
      });

      // Act
      const verifiedUser = await userRepository.verifyUserEmail(user._id.toString());

      // Assert
      expect(verifiedUser).toBeDefined();
      expect(verifiedUser?.isVerified).toBe(true);
    });

    it('should update verification token', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      const newToken = generateValidToken();
      const newExpiry = generateFutureDate();

      // Act
      const updatedUser = await userRepository.updateVerificationToken(
        user._id.toString(),
        newToken,
        newExpiry
      );

      // Assert
      expect(updatedUser).toBeDefined();
      // Token fields are select: false, so they won't be in the response
      // But we can verify the operation succeeded
      expect(updatedUser?._id.toString()).toBe(user._id.toString());
    });
  });

  describe('Password Reset', () => {
    it('should find user by reset password token', async () => {
      // Arrange
      const token = generateValidToken();
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        resetPasswordToken: token,
        resetPasswordTokenExpiry: generateFutureDate(),
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByResetPasswordToken(token);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(user._id.toString());
      expect(foundUser?.resetPasswordToken).toBe(token);
    });

    it('should not find user with expired reset token', async () => {
      // Arrange
      const token = generateValidToken();
      await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        resetPasswordToken: token,
        resetPasswordTokenExpiry: new Date(Date.now() - 1000), // Expired
        academicGoals: [],
      });

      // Act
      const foundUser = await userRepository.findByResetPasswordToken(token);

      // Assert
      expect(foundUser).toBeNull();
    });

    it('should reset password and clear token', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'oldpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        resetPasswordToken: generateValidToken(),
        resetPasswordTokenExpiry: generateFutureDate(),
        academicGoals: [],
      });

      // Act
      const updatedUser = await userRepository.resetPassword(
        user._id.toString(),
        'newhashedpassword'
      );

      // Assert
      expect(updatedUser).toBeDefined();
      // Password is select: false, so check the operation succeeded
      expect(updatedUser?._id.toString()).toBe(user._id.toString());

      // Verify password was actually updated
      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword?.password).toBe('newhashedpassword');
    });

    it('should update reset password token', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      const newToken = generateValidToken();
      const newExpiry = generateFutureDate();

      // Act
      const updatedUser = await userRepository.updateResetPasswordToken(
        user._id.toString(),
        newToken,
        newExpiry
      );

      // Assert
      expect(updatedUser).toBeDefined();
      expect(updatedUser?._id.toString()).toBe(user._id.toString());
    });
  });

  describe('Base Repository Operations', () => {
    it('should count users', async () => {
      // Arrange
      await User.create({
        email: 'user1@example.com',
        password: 'hashedpassword',
        firstName: 'User',
        lastName: 'One',
        role: UserRole.STUDENT,
        academicGoals: [],
      });

      await User.create({
        email: 'user2@example.com',
        password: 'hashedpassword',
        firstName: 'User',
        lastName: 'Two',
        role: UserRole.STUDENT,
        academicGoals: [],
      });

      // Act
      const count = await userRepository.count();

      // Assert
      expect(count).toBe(2);
    });

    it('should check if user exists', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const exists = await userRepository.exists({ _id: user._id } as any);
      const notExists = await userRepository.exists({ email: 'nonexistent@example.com' } as any);

      // Assert
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should increment field value', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        streakCount: 5,
        academicGoals: [],
      });

      // Act
      const updatedUser = await userRepository.increment(
        { _id: user._id } as any,
        'streakCount',
        1
      );

      // Assert
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.streakCount).toBe(6);
    });

    it('should delete user by ID', async () => {
      // Arrange
      const user = await User.create({
        email: validUserData.email,
        password: 'hashedpassword',
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        academicGoals: [],
      });

      // Act
      const deletedUser = await userRepository.deleteById(user._id.toString());

      // Assert
      expect(deletedUser).toBeDefined();
      expect(deletedUser?._id.toString()).toBe(user._id.toString());

      const foundUser = await userRepository.findById(user._id.toString());
      expect(foundUser).toBeNull();
    });
  });
});
