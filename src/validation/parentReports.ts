import Joi from 'joi';
import { commonFields } from './common';

// Send progress report validation (matches ParentReportsController.sendProgressReport)
export const sendProgressReportSchema = {
  body: Joi.object({
    childId: commonFields.objectId.optional(), // If not provided, sends for all children
    period: Joi.string().valid('week', 'month').default('week'),
  }),
};

// Send study habits report validation
export const sendStudyHabitsReportSchema = {
  body: Joi.object({
    childId: commonFields.objectId.optional(),
    period: Joi.string().valid('week', 'month').default('week'),
  }),
};

// Send behavioral insights report validation
export const sendBehavioralInsightsReportSchema = {
  body: Joi.object({
    childId: commonFields.objectId.optional(),
    period: Joi.string().valid('week', 'month').default('week'),
  }),
};

