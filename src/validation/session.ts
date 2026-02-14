import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create session validation (matches SessionsController.createSession)
export const createSessionSchema = {
  body: Joi.object({
    title: commonFields.shortText.required().messages({
      'string.empty': 'Session title is required',
    }),
    subject: commonFields.subject.required().messages({
      'any.required': 'Subject is required',
      'any.only': 'Please select a valid subject',
      'string.empty': 'Subject is required',
    }),
    type: Joi.string()
      .valid('self_study', 'tutoring', 'study', 'quiz', 'reading') // All valid SessionType values
      .optional()
      .custom((value, helpers) => {
        // Map 'study' to 'self_study' for consistency
        if (value === 'study') {
          return 'self_study';
        }
        // Ensure value is one of the valid enum values
        const validTypes = ['self_study', 'tutoring', 'quiz', 'reading'];
        if (validTypes.includes(value)) {
          return value;
        }
        // Default to 'self_study' if invalid
        return 'self_study';
      }),
    startTime: Joi.date().iso().required().messages({
      'date.base': 'Start time must be a valid ISO date string',
      'any.required': 'Start time is required',
      'date.format': 'Start time must be in ISO 8601 format (e.g., 2024-01-19T15:00:00.000Z)',
    }),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).optional().allow(null).messages({
      'date.min': 'End time must be after start time',
      'date.base': 'End time must be a valid ISO date string',
      'date.format': 'End time must be in ISO 8601 format (e.g., 2024-01-19T16:00:00.000Z)',
    }),
    duration: Joi.when('endTime', {
      is: Joi.exist(),
      then: commonFields.duration.optional(),
      otherwise: commonFields.duration.required().messages({
        'any.required': 'Duration is required when endTime is not provided',
        'number.base': 'Duration must be a number',
        'number.integer': 'Duration must be an integer',
        'number.min': 'Duration must be at least 15 minutes',
        'number.max': 'Duration cannot exceed 180 minutes',
      }),
    }),
    tutorId: commonFields.objectId.optional().allow(null, ''), // Optional for self-study sessions
    description: commonFields.mediumText.optional().allow('', null), // Allow empty strings and null
    isRecurring: commonFields.boolean.optional(),
    recurringPattern: Joi.alternatives()
      .try(
        Joi.object(), // Object format
        Joi.string().valid('daily', 'weekly', 'monthly', ''), // String format for backward compatibility, allow empty string
        Joi.valid(null) // Allow null (undefined is already handled by optional())
      )
      .optional(), // Allow object, string, null, undefined, or empty string
    reminderEnabled: commonFields.boolean.optional(),
    reminderTime: Joi.number().integer().min(0).max(1440).optional().allow(null), // Minutes before session
  }),
};

// Update session validation (matches SessionsController.updateSession)
export const updateSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    title: commonFields.shortText,
    description: commonFields.mediumText.allow('', null),
    startTime: Joi.date().iso().messages({
      'date.base': 'Start time must be a valid date',
    }),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).optional().allow(null).messages({
      'date.min': 'End time must be after start time',
    }),
    duration: commonFields.duration,
    subject: commonFields.subject.optional(),
    type: Joi.string().valid('self_study', 'tutoring', 'study', 'quiz', 'reading').optional(),
    isRecurring: commonFields.boolean.optional(),
    recurringPattern: Joi.alternatives()
      .try(
        Joi.object(), // Object format
        Joi.string().valid('daily', 'weekly', 'monthly', ''), // String format for backward compatibility, allow empty string
        Joi.valid(null) // Allow null (undefined is already handled by optional())
      )
      .optional(), // Allow object, string, null, undefined, or empty string
    reminderEnabled: commonFields.boolean.optional(),
    reminderTime: Joi.number().integer().min(0).max(1440).optional().allow(null),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

// Get sessions validation (matches SessionsController.getUserSessions)
export const getSessionsSchema = {
  query: paginationSchema.keys({
    status: commonFields.sessionStatus.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    type: Joi.string().valid('self_study', 'tutoring', 'study', 'quiz', 'reading').optional(),
  }),
};

// Get session by ID validation
export const getSessionByIdSchema = {
  params: idParamSchema,
};

// Cancel session validation
export const cancelSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    reason: Joi.string()
      .valid('student_unavailable', 'tutor_unavailable', 'technical_issues', 'emergency', 'other')
      .required(),
    description: commonFields.mediumText.optional(),
  }),
};

// Join session validation
export const joinSessionSchema = {
  params: idParamSchema,
};

// Complete session validation
export const completeSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    notes: commonFields.longText.optional(),
    homework: commonFields.longText.optional(),
    nextSteps: commonFields.longText.optional(),
  }),
};

// Rate session validation
export const rateSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    rating: commonFields.rating.required(),
    feedback: commonFields.longText.optional(),
  }),
};

// Reschedule session validation
export const rescheduleSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    newScheduledAt: Joi.date().greater('now').iso().required().messages({
      'date.greater': 'New session time must be in the future',
      'any.required': 'New scheduled date and time is required',
    }),
    reason: commonFields.mediumText.optional(),
  }),
};

// Get session availability validation (matches SessionsController.getTutorAvailability)
export const getAvailabilitySchema = {
  params: Joi.object({
    tutorId: commonFields.objectId.required(),
  }),
  query: Joi.object({
    date: Joi.string().optional(), // YYYY-MM-DD format
    duration: Joi.number().integer().min(15).max(180).default(60),
  }),
};

// Book tutor session validation (matches SessionsController.bookTutorSession)
export const bookTutorSessionSchema = {
  body: Joi.object({
    tutorId: commonFields.objectId.required(),
    title: commonFields.shortText.required().messages({
      'string.empty': 'Session title is required',
    }),
    subject: commonFields.subject.required(),
    startTime: Joi.date().iso().required().messages({
      'date.base': 'Start time must be a valid date',
      'any.required': 'Start time is required',
    }),
    duration: commonFields.duration.required(),
    description: commonFields.mediumText.optional(),
  }),
};

// Set tutor availability validation (matches TutorAvailabilityController.setAvailability)
// Accepts both 'availability' (singular) and 'availabilities' (plural) for flexibility
const availabilityItemSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(), // 0 = Sunday, 6 = Saturday
  startTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format',
    }),
  endTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format',
    }),
  isRecurring: commonFields.boolean.default(true),
  specificDate: Joi.date().iso().optional().allow(null),
});

export const setAvailabilitySchema = {
  body: Joi.alternatives()
    .try(
      // Accept 'availability' (singular) - original format
      Joi.object({
        availability: Joi.array()
          .items(availabilityItemSchema)
          .min(1)
          .required(),
      }).custom((value, helpers) => {
        // Normalize: convert 'availability' to 'availabilities' for controller
        if (value.availability) {
          return { availabilities: value.availability };
        }
        return value;
      }),
      // Accept 'availabilities' (plural) - frontend format
      Joi.object({
        availabilities: Joi.array()
          .items(availabilityItemSchema)
          .min(1)
          .required(),
      }),
      // Accept direct array (for backward compatibility)
      Joi.array()
        .items(availabilityItemSchema)
        .min(1)
        .required()
        .custom((value, helpers) => {
          // Normalize: convert array to object with 'availabilities' key
          return { availabilities: value };
        })
    )
    .messages({
      'alternatives.match': 'Request body must contain either "availability" or "availabilities" array, or be a direct array',
    }),
};

// Add tutor availability validation (matches TutorAvailabilityController.addAvailability)
export const addAvailabilitySchema = {
  body: Joi.object({
    dayOfWeek: Joi.number().integer().min(0).max(6).required(),
    startTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'Start time must be in HH:MM format',
      }),
    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'End time must be in HH:MM format',
      }),
    isRecurring: commonFields.boolean.default(true),
    specificDate: Joi.date().iso().optional(),
  }),
};

// Delete tutor availability validation
export const deleteAvailabilitySchema = {
  params: idParamSchema,
};

// Get session statistics validation
export const getSessionStatsSchema = {
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
  }),
};

// Search sessions validation
export const searchSessionsSchema = {
  query: paginationSchema.keys({
    query: commonFields.searchQuery.required(),
    subject: commonFields.subject.optional(),
    status: commonFields.sessionStatus.optional(),
    minRating: Joi.number().min(1).max(5).optional(),
    priceRange: Joi.string()
      .pattern(/^\d+-\d+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Price range must be in format "min-max" (e.g., "10-50")',
      }),
  }),
};

// Report session validation
export const reportSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    reason: Joi.string()
      .valid(
        'inappropriate_behavior',
        'no_show',
        'poor_quality',
        'technical_issues',
        'billing_dispute',
        'other'
      )
      .required(),
    description: commonFields.longText.required().messages({
      'string.empty': 'Description is required',
    }),
    evidence: Joi.array().items(commonFields.url).max(5).optional(),
  }),
};

// Extend session validation
export const extendSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    additionalMinutes: Joi.number().integer().min(15).max(60).required().messages({
      'number.min': 'Extension must be at least 15 minutes',
      'number.max': 'Extension cannot exceed 60 minutes',
    }),
  }),
};

// Update session status validation (matches SessionsController.updateSessionStatus)
export const updateSessionStatusSchema = {
  params: idParamSchema,
  body: Joi.object({
    status: commonFields.sessionStatus.required(),
  }),
};

// Tutor creates session validation (matches TutorSessionController.createSession)
export const tutorCreateSessionSchema = {
  body: Joi.object({
    studentId: commonFields.objectId.required().messages({
      'any.required': 'Student ID is required',
    }),
    title: commonFields.shortText.required().messages({
      'string.empty': 'Session title is required',
    }),
    subject: commonFields.subject.required(),
    scheduledAt: Joi.date().iso().required().messages({
      'date.base': 'Scheduled date must be a valid date',
      'any.required': 'Scheduled date is required',
    }),
    duration: commonFields.duration.required(),
    description: commonFields.mediumText.optional(),
  }),
};

// Reschedule session validation (matches TutorSessionController.rescheduleSession)
export const tutorRescheduleSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    newScheduledAt: Joi.date().iso().required().messages({
      'date.base': 'New scheduled date must be a valid date',
      'any.required': 'New scheduled date is required',
    }),
    reason: commonFields.mediumText.optional(),
  }),
};
