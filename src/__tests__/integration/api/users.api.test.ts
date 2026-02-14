/**
 * Integration Tests for Users API Endpoints
 *
 * Section 5.3.3: Integration Testing Implementation and Results
 *
 * Coverage Goals: 70%+ for API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../index';
import { User } from '../../../models/User';
import { UserPreferences } from '../../../models/UserPreferences';
// Database connection is handled by setup.ts
import { AuthService } from '../../../services/authService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

describe('Users API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let studentToken: string;
  let studentId: string;

  beforeAll(async () => {
    // Database connection is handled by setup.ts (MongoDB Memory Server)
    // No need to call connectDB() - setup.ts already connects

    // Create test user and get token
    const user = await User.create({
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.STUDENT,
      isVerified: true,
    });
    userId = user._id.toString();

    // Login to get token
    const loginResult = await AuthService.login({
      email: 'testuser@example.com',
      password: 'TestPassword123!',
    });
    authToken = loginResult.tokens.accessToken;

    // Create student user
    const student = await User.create({
      email: 'student@example.com',
      password: 'StudentPass123!',
      firstName: 'Student',
      lastName: 'User',
      role: UserRole.STUDENT,
      isVerified: true,
    });
    studentId = student._id.toString();

    const studentLoginResult = await AuthService.login({
      email: 'student@example.com',
      password: 'StudentPass123!',
    });
    studentToken = studentLoginResult.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await UserPreferences.deleteMany({});
    // Don't disconnect - setup.ts handles cleanup
  });

  beforeEach(async () => {
    // Clean up preferences before each test (but keep users for token validity)
    await UserPreferences.deleteMany({});

    // Recreate users if they were deleted by setup.ts afterEach
    let user = await User.findOne({ email: 'testuser@example.com' });
    if (!user) {
      user = await User.create({
        email: 'testuser@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
        isVerified: true,
      });
      userId = user._id.toString();
      const loginResult = await AuthService.login({
        email: 'testuser@example.com',
        password: 'TestPassword123!',
      });
      authToken = loginResult.tokens.accessToken;
    }

    let student = await User.findOne({ email: 'student@example.com' });
    if (!student) {
      student = await User.create({
        email: 'student@example.com',
        password: 'StudentPass123!',
        firstName: 'Student',
        lastName: 'User',
        role: UserRole.STUDENT,
        isVerified: true,
      });
      studentId = student._id.toString();
      const studentLoginResult = await AuthService.login({
        email: 'student@example.com',
        password: 'StudentPass123!',
      });
      studentToken = studentLoginResult.tokens.accessToken;
    }
  });

  describe('GET /v1/api/users/profile', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/v1/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('testuser@example.com');
      expect(response.body.data.preferences).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app).get('/v1/api/users/profile').expect(401);
    });

    it('should create default preferences if user has none', async () => {
      const response = await request(app)
        .get('/v1/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.preferences).toBeDefined();
      expect(response.body.data.preferences.studyReminders).toBe(true);
      expect(response.body.data.preferences.darkMode).toBe(false);
    });
  });

  describe('PUT /v1/api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+447911123456',
      };

      const response = await request(app)
        .put('/v1/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should update student-specific fields for STUDENT role', async () => {
      const updateData = {
        gradeLevel: 'Year 10',
        learningStyle: 'visual',
        academicGoals: ['Get A+ in Math', 'Improve Science'],
      };

      const response = await request(app)
        .put('/v1/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.gradeLevel).toBe('Year 10');
      expect(response.body.data.learningStyle).toBe('visual');
      expect(response.body.data.academicGoals).toEqual(updateData.academicGoals);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app).put('/v1/api/users/profile').send({ firstName: 'Updated' }).expect(401);
    });
  });

  describe('PUT /v1/api/users/password', () => {
    it('should update password successfully with valid current password', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewPassword123!',
      };

      const response = await request(app)
        .put('/v1/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password updated');

      // Verify new password works
      const loginResult = await AuthService.login({
        email: 'testuser@example.com',
        password: 'NewPassword123!',
      });
      expect(loginResult).toBeDefined();
    });

    it('should return 401 when current password is incorrect', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
      };

      await request(app)
        .put('/v1/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);
    });

    it('should return 422 when new password is too short', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'short',
      };

      await request(app)
        .put('/v1/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(422);
    });
  });

  describe('DELETE /v1/api/users/account', () => {
    it('should delete account successfully with correct password', async () => {
      // Create a user to delete
      const userToDelete = await User.create({
        email: 'todelete@example.com',
        password: 'DeletePass123!',
        firstName: 'Delete',
        lastName: 'User',
        role: UserRole.STUDENT,
        isVerified: true,
      });

      const deleteLoginResult = await AuthService.login({
        email: 'todelete@example.com',
        password: 'DeletePass123!',
      });
      const deleteToken = deleteLoginResult.tokens.accessToken;

      const response = await request(app)
        .delete('/v1/api/users/account')
        .set('Authorization', `Bearer ${deleteToken}`)
        .send({ password: 'DeletePass123!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify user is deleted
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 401 when password is incorrect', async () => {
      await request(app)
        .delete('/v1/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'WrongPassword' })
        .expect(401);
    });
  });
});
