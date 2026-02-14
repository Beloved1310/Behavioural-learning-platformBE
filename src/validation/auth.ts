import Joi from 'joi';
import { commonFields } from './common';
import { UserRole } from '../types';

// User registration validation
export const register = Joi.object({
  email: commonFields.email,
  password: commonFields.password,
  firstName: commonFields.name,
  lastName: commonFields.name,
  role: commonFields.userRole.required(),
  dateOfBirth: Joi.when('role', {
    is: UserRole.STUDENT,
    then: commonFields.studentAge.required(),
    otherwise: commonFields.dateOfBirth.optional(),
  }),
  parentEmail: Joi.when('role', {
    is: UserRole.STUDENT,
    then: commonFields.email.optional(), // Parent email is optional - service will validate if needed for minors
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Parent email is only allowed for students',
    }),
  }),
  subjects: Joi.when('role', {
    is: UserRole.TUTOR,
    then: Joi.array()
      .items(
        Joi.string().valid(
          'Mathematics',
          'English',
          'Science',
          'Physics',
          'Chemistry',
          'Biology',
          'History',
          'Geography',
          'Computer Science',
          'Art',
          'Music',
          'Spanish',
          'French',
          'German'
        )
      )
      .max(10)
      .unique()
      .optional(), // Optional during registration, can be added later
    otherwise: Joi.forbidden(),
  }),
  hourlyRate: Joi.when('role', {
    is: UserRole.TUTOR,
    then: commonFields.hourlyRate.optional(),
    otherwise: Joi.forbidden(),
  }),
  bio: Joi.when('role', {
    is: UserRole.TUTOR,
    then: commonFields.mediumText.optional(),
    otherwise: Joi.forbidden(),
  }),
  qualifications: Joi.when('role', {
    is: UserRole.TUTOR,
    then: commonFields.qualifications.optional(),
    otherwise: Joi.forbidden(),
  }),
  academicGoals: Joi.when('role', {
    is: UserRole.STUDENT,
    then: commonFields.academicGoals.optional(),
    otherwise: Joi.forbidden(),
  }),
});

// User login validation
export const login = Joi.object({
  email: commonFields.email,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

// Forgot password validation
export const forgotPassword = Joi.object({
  email: commonFields.email,
});

// Reset password validation
export const resetPassword = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
  }),
  password: commonFields.password,
});

// Verify email validation (query parameters)
export const verifyEmailQuery = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required',
  }),
});

// Change password validation
export const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: commonFields.password,
});

// Update profile validation
export const updateProfile = Joi.object({
  firstName: commonFields.optionalName,
  lastName: commonFields.optionalName,
  bio: commonFields.mediumText.allow(''),
  subjects: commonFields.subjects.optional(),
  hourlyRate: commonFields.hourlyRate.optional(),
  qualifications: commonFields.qualifications.optional(),
  academicGoals: commonFields.academicGoals.optional(),
  profileImage: commonFields.url.optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

// Resend verification email validation
export const resendVerificationEmail = Joi.object({
  email: commonFields.email,
});

// Update preferences validation (moved to preferences.ts)
export const updatePreferences = Joi.object({
  studyReminders: commonFields.boolean,
  language: commonFields.language,
  timezone: commonFields.timezone,
  emailNotifications: commonFields.boolean,
  pushNotifications: commonFields.boolean,
  smsNotifications: commonFields.boolean,
  sessionReminders: commonFields.boolean,
  progressReports: commonFields.boolean,
})
  .min(1)
  .messages({
    'object.min': 'At least one preference must be provided for update',
  });
