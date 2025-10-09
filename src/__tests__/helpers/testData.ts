import { UserRole } from '../../types';

export const validUserData = {
  email: 'test@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.STUDENT as UserRole,
  dateOfBirth: '2009-01-15', // 15-16 years old
  parentEmail: 'parent@example.com',
};

export const validTutorData = {
  email: 'tutor@example.com',
  password: 'TutorPass123!',
  firstName: 'Jane',
  lastName: 'Smith',
  role: UserRole.TUTOR as UserRole,
};

export const validParentData = {
  email: 'parent@example.com',
  password: 'ParentPass123!',
  firstName: 'Bob',
  lastName: 'Johnson',
  role: UserRole.PARENT as UserRole,
};

export const invalidUserData = {
  email: 'invalid-email',
  password: 'short',
  firstName: '',
  lastName: '',
  role: 'INVALID' as any,
};

export const createMockUser = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  password: '$2a$12$hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.STUDENT,
  isVerified: false,
  subscriptionTier: 'BASIC',
  academicGoals: [],
  streakCount: 0,
  totalPoints: 0,
  subjects: [],
  qualifications: [],
  rating: 0,
  totalSessions: 0,
  isBackgroundChecked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const generateValidToken = () => {
  return 'a'.repeat(64); // 64 character hex string
};

export const generateExpiredDate = () => {
  return new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
};

export const generateFutureDate = () => {
  return new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
};
