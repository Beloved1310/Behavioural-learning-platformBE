import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create reflection validation (matches ReflectionsController.createReflection)
export const createReflectionSchema = {
  body: Joi.object({
    prompt: commonFields.longText.required().messages({
      'string.empty': 'Prompt is required',
      'any.required': 'Prompt is required',
    }),
    response: commonFields.longText.required().messages({
      'string.empty': 'Response is required',
      'any.required': 'Response is required',
    }),
    type: Joi.string().valid('daily', 'weekly', 'custom').default('daily').messages({
      'any.only': 'Type must be daily, weekly, or custom',
    }),
    mood: Joi.string()
      .valid('happy', 'neutral', 'frustrated', 'confused', 'excited', 'tired', 'motivated')
      .optional(),
  }),
};

// Get reflections validation
export const getReflectionsSchema = {
  query: paginationSchema.keys({
    period: Joi.string().valid('week', 'all').default('week'),
  }),
};

