import Joi from 'joi';
import { commonFields } from './common';

// Custom event tracking validation
export const trackEventSchema = Joi.object({
  eventType: Joi.string().required().max(100).messages({
    'any.required': 'Event type is required',
    'string.max': 'Event type cannot exceed 100 characters',
  }),
  eventData: Joi.object().optional().messages({
    'object.base': 'Event data must be an object',
  }),
  page: Joi.string().max(200).optional().messages({
    'string.max': 'Page cannot exceed 200 characters',
  }),
  sessionId: Joi.string().max(100).optional().messages({
    'string.max': 'Session ID cannot exceed 100 characters',
  }),
});

// Generate progress report validation
export const generateProgressReportSchema = Joi.object({
  period: Joi.string().valid('weekly', 'monthly').required().messages({
    'any.required': 'Period is required',
    'any.only': 'Period must be either weekly or monthly',
  }),
});

// Query parameters validation
export const daysQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).optional().default(30).messages({
    'number.min': 'Days must be at least 1',
    'number.max': 'Days cannot exceed 365',
  }),
});

export const limitQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

export const eventTypeQuerySchema = Joi.object({
  eventType: Joi.string().max(100).optional().messages({
    'string.max': 'Event type cannot exceed 100 characters',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(50).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

export const recommendationTypeQuerySchema = Joi.object({
  type: Joi.string()
    .valid('content', 'study_time', 'break', 'technique', 'goal')
    .optional()
    .messages({
      'any.only': 'Invalid recommendation type',
    }),
  limit: Joi.number().integer().min(1).max(50).optional().default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
});

export const progressReportQuerySchema = Joi.object({
  period: Joi.string().valid('weekly', 'monthly').optional().messages({
    'any.only': 'Period must be either weekly or monthly',
  }),
  limit: Joi.number().integer().min(1).max(50).optional().default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
});

export const maxPromptsQuerySchema = Joi.object({
  max: Joi.number().integer().min(1).max(10).optional().default(3).messages({
    'number.min': 'Max must be at least 1',
    'number.max': 'Max cannot exceed 10',
  }),
});

// Generate recommendations validation (matches BehavioralController.generateRecommendations)
export const generateRecommendationsSchema = {
  body: Joi.object({
    type: Joi.string()
      .valid('content', 'study_time', 'break', 'technique', 'goal')
      .optional(),
    limit: Joi.number().integer().min(1).max(50).optional().default(10),
  }),
};

// Mark recommendation as read validation
export const markRecommendationReadSchema = {
  params: Joi.object({
    id: commonFields.objectId.required(),
  }),
};

// Mark recommendation as actioned validation
export const markRecommendationActionedSchema = {
  params: Joi.object({
    id: commonFields.objectId.required(),
  }),
};

// Track engagement validation (matches BehavioralController.trackEngagement)
export const trackEngagementSchema = Joi.object({
  eventType: Joi.string()
    .valid('login', 'session_start', 'session_end', 'quiz_start', 'quiz_complete')
    .required()
    .messages({
      'any.only': 'Event type must be one of: login, session_start, session_end, quiz_start, quiz_complete',
      'any.required': 'Event type is required',
    }),
  metadata: Joi.object().optional(),
});
