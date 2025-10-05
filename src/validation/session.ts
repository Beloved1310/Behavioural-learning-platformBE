import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create session validation
export const createSessionSchema = {
  body: Joi.object({
    tutorId: commonFields.objectId.required(),
    subject: commonFields.subject.required(),
    title: commonFields.shortText.required().messages({
      'string.empty': 'Session title is required'
    }),
    description: commonFields.mediumText.optional(),
    scheduledAt: Joi.date().greater('now').iso().required().messages({
      'date.greater': 'Session must be scheduled for a future date',
      'any.required': 'Scheduled date and time is required'
    }),
    duration: commonFields.duration.required(),
    notes: commonFields.mediumText.optional()
  })
};

// Update session validation
export const updateSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    title: commonFields.shortText,
    description: commonFields.mediumText.allow(''),
    scheduledAt: Joi.date().greater('now').iso().messages({
      'date.greater': 'Session must be scheduled for a future date'
    }),
    duration: commonFields.duration,
    notes: commonFields.mediumText.allow(''),
    meetingUrl: commonFields.url.optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Get sessions validation
export const getSessionsSchema = {
  query: paginationSchema.keys({
    status: commonFields.sessionStatus.optional(),
    subject: commonFields.subject.optional(),
    tutorId: commonFields.objectId.optional(),
    studentId: commonFields.objectId.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    upcoming: commonFields.boolean.default(false)
  })
};

// Get session by ID validation  
export const getSessionByIdSchema = {
  params: idParamSchema
};

// Cancel session validation
export const cancelSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    reason: Joi.string().valid(
      'student_unavailable',
      'tutor_unavailable', 
      'technical_issues',
      'emergency',
      'other'
    ).required(),
    description: commonFields.mediumText.optional()
  })
};

// Join session validation
export const joinSessionSchema = {
  params: idParamSchema
};

// Complete session validation
export const completeSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    notes: commonFields.longText.optional(),
    homework: commonFields.longText.optional(),
    nextSteps: commonFields.longText.optional()
  })
};

// Rate session validation
export const rateSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    rating: commonFields.rating.required(),
    feedback: commonFields.longText.optional()
  })
};

// Reschedule session validation
export const rescheduleSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    newScheduledAt: Joi.date().greater('now').iso().required().messages({
      'date.greater': 'New session time must be in the future',
      'any.required': 'New scheduled date and time is required'
    }),
    reason: commonFields.mediumText.optional()
  })
};

// Get session availability validation
export const getAvailabilitySchema = {
  query: Joi.object({
    tutorId: commonFields.objectId.required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    duration: commonFields.duration.default(60)
  })
};

// Set tutor availability validation
export const setAvailabilitySchema = {
  body: Joi.object({
    availability: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.number().integer().min(0).max(6).required(), // 0 = Sunday, 6 = Saturday
        startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
          'string.pattern.base': 'Start time must be in HH:MM format'
        }),
        endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
          'string.pattern.base': 'End time must be in HH:MM format'
        }),
        isRecurring: commonFields.boolean.default(true)
      })
    ).min(1).required()
  })
};

// Get session statistics validation
export const getSessionStatsSchema = {
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day')
  })
};

// Search sessions validation
export const searchSessionsSchema = {
  query: paginationSchema.keys({
    query: commonFields.searchQuery.required(),
    subject: commonFields.subject.optional(),
    status: commonFields.sessionStatus.optional(),
    minRating: Joi.number().min(1).max(5).optional(),
    priceRange: Joi.string().pattern(/^\d+-\d+$/).optional().messages({
      'string.pattern.base': 'Price range must be in format "min-max" (e.g., "10-50")'
    })
  })
};

// Report session validation
export const reportSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    reason: Joi.string().valid(
      'inappropriate_behavior',
      'no_show',
      'poor_quality',
      'technical_issues',
      'billing_dispute',
      'other'
    ).required(),
    description: commonFields.longText.required().messages({
      'string.empty': 'Description is required'
    }),
    evidence: Joi.array().items(commonFields.url).max(5).optional()
  })
};

// Extend session validation
export const extendSessionSchema = {
  params: idParamSchema,
  body: Joi.object({
    additionalMinutes: Joi.number().integer().min(15).max(60).required().messages({
      'number.min': 'Extension must be at least 15 minutes',
      'number.max': 'Extension cannot exceed 60 minutes'
    })
  })
};