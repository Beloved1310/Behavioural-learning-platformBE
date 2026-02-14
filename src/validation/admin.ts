import Joi from 'joi';
import { commonFields, paginationSchema } from './common';

// Approve tutor validation (matches AdminController.approveTutor)
export const approveTutorSchema = {
  params: Joi.object({
    tutorId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    adminNotes: commonFields.mediumText.optional(),
  }),
};

// Reject tutor validation (matches AdminController.rejectTutor)
export const rejectTutorSchema = {
  params: Joi.object({
    tutorId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    reason: commonFields.mediumText.required().messages({
      'string.empty': 'Rejection reason is required',
      'any.required': 'Rejection reason is required',
    }),
  }),
};

// Set background check status validation (matches AdminController.setBackgroundCheckStatus)
export const setBackgroundCheckStatusSchema = {
  params: Joi.object({
    tutorId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    // The controller expects a boolean field `isBackgroundChecked`
    isBackgroundChecked: commonFields.boolean.required().messages({
      'any.required': 'Background check status is required',
    }),
    notes: commonFields.mediumText.optional(),
  }),
};

// Update user status validation (matches AdminController.updateUserStatus)
export const updateUserStatusSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    // The controller and adminService use a boolean `isActive` flag instead of a string status
    isActive: commonFields.boolean.required().messages({
      'any.required': 'isActive flag is required',
    }),
  }),
};

// Get pending tutors validation
export const getPendingTutorsSchema = {
  query: paginationSchema,
};

// Get tutor by ID validation
export const getTutorByIdSchema = {
  params: Joi.object({
    tutorId: commonFields.objectId.required(),
  }),
};

// Get user by ID validation
export const getUserByIdSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required(),
  }),
};

