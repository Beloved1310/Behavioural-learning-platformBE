import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Invite student validation (matches TutorStudentsController.inviteStudent)
export const inviteStudentSchema = {
  body: Joi.object({
    email: commonFields.email,
    firstName: commonFields.name,
    lastName: commonFields.name,
    message: commonFields.mediumText.optional(),
  }),
};

// Create student validation (matches TutorStudentsController.createStudent)
export const createStudentSchema = {
  body: Joi.object({
    email: commonFields.email,
    firstName: commonFields.name,
    lastName: commonFields.name,
    dateOfBirth: commonFields.studentAge.required(),
    parentEmail: commonFields.email.optional(),
    academicGoals: commonFields.academicGoals.optional(),
  }),
};

// Assign goal to student validation (matches TutorGoalsController.assignGoal)
export const assignGoalSchema = {
  params: Joi.object({
    studentId: commonFields.objectId.required(),
  }),
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
      .optional(),
  }),
};

// Approve goal validation (matches TutorGoalsController.approveGoal)
export const approveGoalSchema = {
  params: Joi.object({
    goalId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    feedback: commonFields.mediumText.optional(),
  }).optional(), // Body is optional for approve
};

// Reject goal validation (matches TutorGoalsController.rejectGoal)
export const rejectGoalSchema = {
  params: Joi.object({
    goalId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    feedback: commonFields.mediumText.required().messages({
      'string.empty': 'Rejection feedback is required',
    }),
  }),
};

// Assign commitment to student validation (matches TutorCommitmentsController.assignCommitment)
export const assignCommitmentSchema = {
  params: Joi.object({
    studentId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    commitments: Joi.array()
      .items(
        Joi.object({
          text: commonFields.shortText.required().messages({
            'string.empty': 'Commitment text is required',
          }),
          type: Joi.string().valid('time', 'count', 'boolean').default('time'),
          target: Joi.number().integer().min(0).optional().default(0),
        })
      )
      .min(1)
      .max(5)
      .required()
      .messages({
        'array.min': 'At least one commitment is required',
        'array.max': 'Maximum 5 commitments per week',
      }),
  }),
};

// Add feedback to reflection validation (matches TutorReflectionsController.addFeedback)
export const addReflectionFeedbackSchema = {
  params: Joi.object({
    reflectionId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    comment: commonFields.longText.required().messages({
      'string.empty': 'Feedback comment is required',
      'any.required': 'Feedback comment is required',
    }),
  }),
};

// Add feedback to assessment validation (matches TutorAssessmentsController.addFeedback)
export const addAssessmentFeedbackSchema = {
  params: Joi.object({
    assessmentId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    feedback: commonFields.longText.required().messages({
      'string.empty': 'Feedback is required',
      'any.required': 'Feedback is required',
    }),
    rating: Joi.number().integer().min(1).max(5).optional(),
  }),
};

