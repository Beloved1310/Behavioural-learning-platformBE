import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';
import { UserRole } from '../types';

// Get users list validation
export const getUsersSchema = {
  query: paginationSchema.keys({
    role: commonFields.userRole.optional(),
    isVerified: commonFields.boolean.optional(),
    subscriptionTier: commonFields.subscriptionTier.optional(),
    subjects: Joi.string().optional() // Single subject filter
  })
};

// Get user by ID validation
export const getUserByIdSchema = {
  params: idParamSchema
};

// Update user validation (admin only)
export const updateUserSchema = {
  params: idParamSchema,
  body: Joi.object({
    firstName: commonFields.optionalName,
    lastName: commonFields.optionalName,
    isVerified: commonFields.boolean,
    subscriptionTier: commonFields.subscriptionTier,
    isBackgroundChecked: Joi.when('role', {
      is: UserRole.TUTOR,
      then: commonFields.boolean,
      otherwise: Joi.forbidden()
    }),
    role: commonFields.userRole,
    subjects: Joi.when('role', {
      is: UserRole.TUTOR,
      then: commonFields.subjects,
      otherwise: Joi.forbidden()
    }),
    hourlyRate: Joi.when('role', {
      is: UserRole.TUTOR,
      then: commonFields.hourlyRate,
      otherwise: Joi.forbidden()
    }),
    bio: Joi.when('role', {
      is: UserRole.TUTOR,
      then: commonFields.mediumText.allow(''),
      otherwise: Joi.forbidden()
    }),
    qualifications: Joi.when('role', {
      is: UserRole.TUTOR,
      then: commonFields.qualifications,
      otherwise: Joi.forbidden()
    }),
    academicGoals: Joi.when('role', {
      is: UserRole.STUDENT,
      then: commonFields.academicGoals,
      otherwise: Joi.forbidden()
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Delete user validation
export const deleteUserSchema = {
  params: idParamSchema
};

// Get tutors by subject validation
export const getTutorsBySubjectSchema = {
  query: paginationSchema.keys({
    subject: commonFields.subject.required(),
    minRating: Joi.number().min(0).max(5).optional(),
    maxRate: commonFields.hourlyRate.optional(),
    minRate: commonFields.hourlyRate.optional()
  })
};

// Upload avatar validation
export const uploadAvatarSchema = {
  body: Joi.object({
    image: Joi.string().required().messages({
      'string.empty': 'Image data is required'
    })
  })
};

// Follow/unfollow user validation
export const followUserSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  })
};

// Get user statistics validation
export const getUserStatsSchema = {
  params: idParamSchema,
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Block/unblock user validation
export const blockUserSchema = {
  params: idParamSchema,
  body: Joi.object({
    reason: commonFields.mediumText.required().messages({
      'string.empty': 'Reason for blocking is required'
    })
  })
};

// Report user validation
export const reportUserSchema = {
  params: idParamSchema,
  body: Joi.object({
    reason: Joi.string().valid(
      'inappropriate_behavior',
      'spam',
      'harassment',
      'fake_profile',
      'other'
    ).required(),
    description: commonFields.longText.required().messages({
      'string.empty': 'Description is required'
    }),
    evidence: Joi.array().items(commonFields.url).max(5).optional()
  })
};

// Search users validation
export const searchUsersSchema = {
  query: paginationSchema.keys({
    query: commonFields.searchQuery.required(),
    role: commonFields.userRole.optional(),
    subjects: Joi.string().optional()
  })
};

// Get user children (for parents) validation
export const getUserChildrenSchema = {
  query: paginationSchema
};

// Add child validation (for parents)
export const addChildSchema = {
  body: Joi.object({
    email: commonFields.email,
    firstName: commonFields.name,
    lastName: commonFields.name,
    dateOfBirth: commonFields.studentAge.required(),
    academicGoals: commonFields.academicGoals.optional()
  })
};

// Update child validation (for parents)
export const updateChildSchema = {
  params: idParamSchema,
  body: Joi.object({
    firstName: commonFields.optionalName,
    lastName: commonFields.optionalName,
    academicGoals: commonFields.academicGoals
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Get user notifications validation
export const getUserNotificationsSchema = {
  query: paginationSchema.keys({
    unreadOnly: commonFields.boolean.default(false),
    type: Joi.string().valid(
      'study_reminder',
      'session_reminder',
      'quiz_available',
      'badge_earned',
      'message_received',
      'payment_success',
      'progress_report',
      'system_announcement'
    ).optional()
  })
};

// Mark notification as read validation
export const markNotificationReadSchema = {
  params: Joi.object({
    notificationId: commonFields.objectId.required()
  })
};

// Update profile validation (for current user)
export const updateProfileSchema = {
  body: Joi.object({
    firstName: commonFields.optionalName,
    lastName: commonFields.optionalName,
    phoneNumber: commonFields.phone.allow(''),
    dateOfBirth: commonFields.dateOfBirth,
    profileImage: commonFields.url.allow(''),
    // Student-specific fields
    gradeLevel: Joi.string().valid(
      'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
      'Year 12', 'Year 13'
    ).messages({
      'any.only': 'Grade level must be a valid UK school year'
    }),
    learningStyle: Joi.string().valid(
      'visual', 'auditory', 'kinesthetic', 'reading_writing'
    ).messages({
      'any.only': 'Learning style must be visual, auditory, kinesthetic, or reading_writing'
    }),
    academicGoals: Joi.alternatives().try(
      commonFields.academicGoals,
      Joi.string().allow('')
    ),
    // Tutor-specific fields
    subjects: Joi.alternatives().try(
      commonFields.subjects,
      Joi.string().allow('')
    ),
    bio: commonFields.mediumText.allow(''),
    qualifications: Joi.alternatives().try(
      commonFields.qualifications,
      Joi.string().allow('')
    )
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Update password validation
export const updatePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password is required'
    }),
    newPassword: commonFields.password.messages({
      'string.empty': 'New password is required'
    })
  })
};

// Delete account validation
export const deleteAccountSchema = {
  body: Joi.object({
    password: Joi.string().required().messages({
      'string.empty': 'Password is required to delete account'
    })
  })
};