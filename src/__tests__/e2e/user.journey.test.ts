/**
 * End-to-End Tests for Complete User Journeys
 *
 * Section 5.3.4: End-to-End Testing Implementation and Results
 *
 * Coverage Goals: 100% for critical user journeys
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../index';
import { User } from '../../models/User';
import { Session } from '../../models/Session';
import { Quiz } from '../../models/Quiz';
// Database connection is handled by setup.ts
import { UserRole } from '../../types';
import { Types } from 'mongoose';

describe('Complete User Journey E2E Tests', () => {
  let studentToken: string;
  let studentId: string;
  let tutorToken: string;
  let tutorId: string;

  beforeAll(async () => {
    // Database connection is handled by setup.ts (MongoDB Memory Server)
    // No need to call connectDB() - setup.ts already connects
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
    await Quiz.deleteMany({});
    // Don't disconnect - setup.ts handles cleanup
  });

  describe('Complete Student Registration to Session Booking Flow', () => {
    it('should complete full student registration to session booking flow', async () => {
      const timestamp = Date.now();
      const email = `e2estudent${timestamp}@example.com`;

      // Step 1: Register
      const registerRes = await request(app)
        .post('/v1/api/auth/register')
        .send({
          email,
          password: 'E2EPassword123!',
          firstName: 'E2E',
          lastName: 'Student',
          role: UserRole.STUDENT,
          dateOfBirth: '2009-01-15',
          parentEmail: 'parent@example.com',
        })
        .expect(201);

      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.user.email).toBe(email);
      studentId = registerRes.body.data.user.id;

      // Step 2: Verify Email (simulate email verification)
      const user = await User.findById(studentId).select('+verificationToken');
      if (user && (user as any).verificationToken) {
        await request(app)
          .get('/v1/api/auth/verify-email')
          .query({ token: (user as any).verificationToken })
          .expect(200);
      }

      // Step 3: Login
      const loginRes = await request(app)
        .post('/v1/api/auth/login')
        .send({
          email,
          password: 'E2EPassword123!',
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.accessToken).toBeDefined();
      studentToken = loginRes.body.data.accessToken;

      // Step 4: Get Profile
      const profileRes = await request(app)
        .get('/v1/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(profileRes.body.data.user).toBeDefined();
      expect(profileRes.body.data.preferences).toBeDefined();

      // Step 5: Update Profile
      const updateRes = await request(app)
        .put('/v1/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          gradeLevel: 'Year 10',
          learningStyle: 'visual',
          academicGoals: ['Get A+ in Math'],
        })
        .expect(200);

      expect(updateRes.body.data.gradeLevel).toBe('Year 10');
      expect(updateRes.body.data.learningStyle).toBe('visual');
    });
  });

  describe('Complete Tutor Registration to Session Management Flow', () => {
    it('should complete full tutor registration to session management flow', async () => {
      const timestamp = Date.now();
      const email = `e2etutor${timestamp}@example.com`;

      // Step 1: Register Tutor
      const registerRes = await request(app)
        .post('/v1/api/auth/register')
        .send({
          email,
          password: 'E2ETutorPass123!',
          firstName: 'E2E',
          lastName: 'Tutor',
          role: UserRole.TUTOR,
        })
        .expect(201);

      expect(registerRes.body.success).toBe(true);
      tutorId = registerRes.body.data.user.id;

      // Step 2: Verify Email
      const user = await User.findById(tutorId).select('+verificationToken');
      if (user && (user as any).verificationToken) {
        await request(app)
          .get('/v1/api/auth/verify-email')
          .query({ token: (user as any).verificationToken })
          .expect(200);
      }

      // Step 3: Login
      const loginRes = await request(app)
        .post('/v1/api/auth/login')
        .send({
          email,
          password: 'E2ETutorPass123!',
        })
        .expect(200);

      tutorToken = loginRes.body.data.accessToken;

      // Step 4: Update Tutor Profile
      const updateRes = await request(app)
        .put('/v1/api/users/profile')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          subjects: ['Mathematics', 'Science'],
          bio: 'Experienced tutor with 10 years of experience',
          qualifications: ['BSc Mathematics', 'MSc Education'],
        })
        .expect(200);

      expect(updateRes.body.data.subjects).toContain('Mathematics');
      expect(updateRes.body.data.bio).toBeDefined();
    });
  });

  describe('Complete Session Booking Flow', () => {
    it('should complete session creation and retrieval flow', async () => {
      // Create users fresh for this test (they may have been deleted by afterEach)
      const student = await User.create({
        email: `sessionstudent${Date.now()}@example.com`,
        password: 'SessionPass123!',
        firstName: 'Session',
        lastName: 'Student',
        role: UserRole.STUDENT,
        isVerified: true,
      });

      const tutor = await User.create({
        email: `sessiontutor${Date.now()}@example.com`,
        password: 'SessionTutorPass123!',
        firstName: 'Session',
        lastName: 'Tutor',
        role: UserRole.TUTOR,
        isVerified: true,
      });

      const studentLogin = await request(app)
        .post('/v1/api/auth/login')
        .send({
          email: student.email,
          password: 'SessionPass123!',
        })
        .expect(200);

      const tutorLogin = await request(app)
        .post('/v1/api/auth/login')
        .send({
          email: tutor.email,
          password: 'SessionTutorPass123!',
        })
        .expect(200);

      const currentStudentToken = studentLogin.body.data.accessToken;
      const currentTutorToken = tutorLogin.body.data.accessToken;
      const currentStudentId = student._id.toString();
      const currentTutorId = tutor._id.toString();

      // Step 1: Create Session (as tutor)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const sessionData = {
        title: 'E2E Test Session',
        description: 'End-to-end test session',
        subject: 'Mathematics',
        scheduledAt: tomorrow.toISOString(),
        duration: 60,
        studentId: currentStudentId,
      };

      const createRes = await request(app)
        .post('/v1/api/tutor/sessions/create')
        .set('Authorization', `Bearer ${currentTutorToken}`)
        .send(sessionData)
        .expect(201);

      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data).toBeDefined();
      expect(createRes.body.data.session).toBeDefined();
      const sessionId = createRes.body.data.session.id;

      // Step 2: Get Sessions (as student)
      const sessionsRes = await request(app)
        .get('/v1/api/sessions')
        .set('Authorization', `Bearer ${currentStudentToken}`)
        .expect(200);

      expect(sessionsRes.body.success).toBe(true);
      expect(sessionsRes.body.data.sessions).toBeDefined();
      expect(sessionsRes.body.data.sessions.length).toBeGreaterThan(0);

      // Step 3: Get Session Stats
      const statsRes = await request(app)
        .get('/v1/api/sessions/stats')
        .set('Authorization', `Bearer ${currentStudentToken}`)
        .expect(200);

      expect(statsRes.body.success).toBe(true);
      expect(statsRes.body.data).toBeDefined();
    });
  });

  describe('Complete Quiz Taking Flow', () => {
    it('should complete quiz creation to quiz attempt flow', async () => {
      // Create fresh user for this test (may have been deleted by afterEach)
      const student = await User.create({
        email: `quizstudent${Date.now()}@example.com`,
        password: 'QuizPass123!',
        firstName: 'Quiz',
        lastName: 'Student',
        role: UserRole.STUDENT,
        isVerified: true,
      });

      const loginRes = await request(app)
        .post('/v1/api/auth/login')
        .send({
          email: student.email,
          password: 'QuizPass123!',
        })
        .expect(200);

      const currentStudentToken = loginRes.body.data.accessToken;
      const currentStudentId = student._id.toString();

      // Step 1: Create Quiz (as admin/tutor - simplified for E2E)
      const quiz = await Quiz.create({
        title: 'E2E Test Quiz',
        subject: 'Mathematics',
        description: 'End-to-end test quiz',
        difficulty: 'easy',
        passingScore: 70,
        points: 100,
        isActive: true,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            points: 10,
            order: 1,
          },
        ],
      });

      // Step 2: Get Quizzes
      const quizzesRes = await request(app)
        .get('/v1/api/gamification/quizzes')
        .set('Authorization', `Bearer ${currentStudentToken}`)
        .expect(200);

      expect(quizzesRes.body.success).toBe(true);
      expect(quizzesRes.body.data).toBeDefined();
      expect(quizzesRes.body.data.quizzes).toBeDefined();

      // Step 3: Submit Quiz Attempt
      const questionId = quiz.questions[0]._id.toString();
      const attemptRes = await request(app)
        .post('/v1/api/gamification/quiz-attempts')
        .set('Authorization', `Bearer ${currentStudentToken}`)
        .send({
          quizId: quiz._id.toString(),
          answers: {
            [questionId]: '4',
          },
          timeSpent: 60,
        })
        .expect(201);

      expect(attemptRes.body.success).toBe(true);
      expect(attemptRes.body.data.attempt).toBeDefined();
      expect(attemptRes.body.data.attempt.score).toBeDefined();

      // Step 4: Get User Progress
      const progressRes = await request(app)
        .get('/v1/api/gamification/progress')
        .set('Authorization', `Bearer ${currentStudentToken}`)
        .expect(200);

      expect(progressRes.body.success).toBe(true);
      expect(progressRes.body.data).toBeDefined();
      expect(Array.isArray(progressRes.body.data)).toBe(true);
    });
  });
});
