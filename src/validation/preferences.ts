import Joi from 'joi';
import { commonFields } from './common';

// Update preferences validation
export const updatePreferencesSchema = {
  body: Joi.object({
    studyReminders: commonFields.boolean,
    darkMode: commonFields.boolean,
    language: commonFields.language,
    timezone: commonFields.timezone,
    emailNotifications: commonFields.boolean,
    pushNotifications: commonFields.boolean,
    smsNotifications: commonFields.boolean,
    sessionReminders: commonFields.boolean,
    progressReports: commonFields.boolean,
    weeklyReport: commonFields.boolean
  }).min(1).messages({
    'object.min': 'At least one preference must be provided for update'
  })
};
