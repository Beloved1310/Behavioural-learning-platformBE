import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create goal validation (matches GoalsController.createGoal)
export const createGoalSchema = {
  body: Joi.object({
    title: commonFields.shortText.required().messages({
      'string.empty': 'Goal title is required',
      'any.required': 'Goal title is required',
    }),
    description: commonFields.mediumText.optional(),
    target: Joi.number().integer().min(1).required().messages({
      'number.min': 'Target must be at least 1',
      'any.required': 'Target is required',
    }),
    deadline: Joi.date().iso().greater('now').optional().messages({
      'date.greater': 'Deadline must be in the future',
    }),
    milestones: Joi.array()
      .items(Joi.number().integer().min(0).max(100))
      .min(1)
      .max(10)
      .optional()
      .messages({
        'array.min': 'At least one milestone is required',
        'array.max': 'Maximum 10 milestones allowed',
      }),
  }),
};

// Update goal progress validation (matches GoalsController.updateProgress)
export const updateGoalProgressSchema = {
  params: Joi.object({
    goalId: commonFields.objectId.required(),
  }),
};

// Get goal milestones validation
export const getGoalMilestonesSchema = {
  params: Joi.object({
    goalId: commonFields.objectId.required(),
  }),
};

// Delete goal validation
export const deleteGoalSchema = {
  params: Joi.object({
    goalId: commonFields.objectId.required(),
  }),
};

