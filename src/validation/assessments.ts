import Joi from 'joi';
import { commonFields, paginationSchema } from './common';

// Submit weekly assessment validation (matches AssessmentsController.submitAssessment)
export const submitAssessmentSchema = {
  body: Joi.object({
    weekRating: Joi.number().integer().min(1).max(10).required().messages({
      'number.min': 'Week rating must be at least 1',
      'number.max': 'Week rating cannot exceed 10',
      'any.required': 'Week rating is required',
    }),
    whatWentWell: commonFields.longText.required().messages({
      'string.empty': 'What went well is required',
      'any.required': 'What went well is required',
    }),
    challenges: commonFields.longText.required().messages({
      'string.empty': 'Challenges description is required',
      'any.required': 'Challenges description is required',
    }),
    nextWeekFocus: commonFields.longText.required().messages({
      'string.empty': 'Next week focus is required',
      'any.required': 'Next week focus is required',
    }),
    commitmentLevel: Joi.number().integer().min(1).max(10).required().messages({
      'number.min': 'Commitment level must be at least 1',
      'number.max': 'Commitment level cannot exceed 10',
      'any.required': 'Commitment level is required',
    }),
  }),
};

// Get assessment trends validation
export const getAssessmentTrendsSchema = {
  query: Joi.object({
    weeks: Joi.number().integer().min(1).max(52).default(8).messages({
      'number.min': 'Weeks must be at least 1',
      'number.max': 'Weeks cannot exceed 52',
    }),
  }),
};

