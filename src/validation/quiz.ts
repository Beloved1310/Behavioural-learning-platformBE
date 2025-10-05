import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create quiz validation
export const createQuizSchema = {
  body: Joi.object({
    title: commonFields.shortText.required().messages({
      'string.empty': 'Quiz title is required'
    }),
    subject: commonFields.subject.required(),
    description: commonFields.mediumText.required().messages({
      'string.empty': 'Quiz description is required'
    }),
    timeLimit: Joi.number().integer().min(1).max(180).optional().messages({
      'number.min': 'Time limit must be at least 1 minute',
      'number.max': 'Time limit cannot exceed 180 minutes'
    }),
    passingScore: commonFields.score.required(),
    points: commonFields.points.required(),
    isActive: commonFields.boolean.default(true),
    questions: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
        question: commonFields.longText.required().messages({
          'string.empty': 'Question text is required'
        }),
        options: Joi.when('type', {
          is: 'multiple_choice',
          then: Joi.array().items(Joi.string().trim().max(200)).min(2).max(6).required(),
          otherwise: Joi.when('type', {
            is: 'true_false',
            then: Joi.array().items(Joi.string().valid('True', 'False')).length(2).default(['True', 'False']),
            otherwise: Joi.forbidden()
          })
        }),
        correctAnswer: Joi.string().required().messages({
          'string.empty': 'Correct answer is required'
        }),
        explanation: commonFields.mediumText.optional(),
        points: commonFields.points.default(1),
        order: Joi.number().integer().min(1).required().messages({
          'number.min': 'Question order must be at least 1'
        })
      })
    ).min(1).max(50).required().messages({
      'array.min': 'At least one question is required',
      'array.max': 'Maximum 50 questions allowed'
    })
  })
};

// Update quiz validation
export const updateQuizSchema = {
  params: idParamSchema,
  body: Joi.object({
    title: commonFields.shortText,
    description: commonFields.mediumText,
    timeLimit: Joi.number().integer().min(1).max(180).optional(),
    passingScore: commonFields.score,
    points: commonFields.points,
    isActive: commonFields.boolean,
    questions: Joi.array().items(
      Joi.object({
        _id: commonFields.objectId.optional(), // For existing questions
        type: Joi.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
        question: commonFields.longText.required(),
        options: Joi.when('type', {
          is: 'multiple_choice',
          then: Joi.array().items(Joi.string().trim().max(200)).min(2).max(6).required(),
          otherwise: Joi.when('type', {
            is: 'true_false',
            then: Joi.array().items(Joi.string().valid('True', 'False')).length(2),
            otherwise: Joi.forbidden()
          })
        }),
        correctAnswer: Joi.string().required(),
        explanation: commonFields.mediumText.optional(),
        points: commonFields.points.default(1),
        order: Joi.number().integer().min(1).required()
      })
    ).min(1).max(50)
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Get quizzes validation
export const getQuizzesSchema = {
  query: paginationSchema.keys({
    subject: commonFields.subject.optional(),
    isActive: commonFields.boolean.optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    minPoints: commonFields.points.optional(),
    maxPoints: commonFields.points.optional()
  })
};

// Get quiz by ID validation
export const getQuizByIdSchema = {
  params: idParamSchema,
  query: Joi.object({
    includeAnswers: commonFields.boolean.default(false) // For admin/tutor view
  })
};

// Delete quiz validation
export const deleteQuizSchema = {
  params: idParamSchema
};

// Submit quiz attempt validation
export const submitQuizAttemptSchema = {
  params: idParamSchema,
  body: Joi.object({
    answers: Joi.object().pattern(
      commonFields.objectId, // Question ID
      Joi.alternatives().try(
        Joi.string().max(1000), // For short answer
        Joi.number().integer(), // For multiple choice index
        Joi.boolean() // For true/false
      )
    ).min(1).required().messages({
      'object.min': 'At least one answer is required'
    }),
    timeSpent: Joi.number().integer().min(1).required().messages({
      'number.min': 'Time spent must be at least 1 second'
    }),
    startedAt: Joi.date().iso().max('now').required().messages({
      'date.max': 'Start time cannot be in the future'
    })
  })
};

// Get quiz attempts validation
export const getQuizAttemptsSchema = {
  query: paginationSchema.keys({
    quizId: commonFields.objectId.optional(),
    studentId: commonFields.objectId.optional(),
    minScore: commonFields.score.optional(),
    maxScore: commonFields.score.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Get quiz attempt by ID validation
export const getQuizAttemptByIdSchema = {
  params: idParamSchema
};

// Get quiz statistics validation
export const getQuizStatsSchema = {
  params: idParamSchema,
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    detailed: commonFields.boolean.default(false)
  })
};

// Get student quiz progress validation
export const getStudentQuizProgressSchema = {
  query: paginationSchema.keys({
    subject: commonFields.subject.optional(),
    completed: commonFields.boolean.optional()
  })
};

// Review quiz attempt validation
export const reviewQuizAttemptSchema = {
  params: idParamSchema,
  body: Joi.object({
    feedback: commonFields.longText.optional(),
    manualScoreAdjustments: Joi.object().pattern(
      commonFields.objectId, // Question ID
      Joi.object({
        awarded: commonFields.boolean.required(),
        feedback: commonFields.mediumText.optional()
      })
    ).optional()
  })
};

// Get random practice questions validation
export const getPracticeQuestionsSchema = {
  query: Joi.object({
    subject: commonFields.subject.required(),
    count: Joi.number().integer().min(1).max(20).default(10),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    excludeAttempted: commonFields.boolean.default(false)
  })
};

// Duplicate quiz validation
export const duplicateQuizSchema = {
  params: idParamSchema,
  body: Joi.object({
    title: commonFields.shortText.optional(),
    subject: commonFields.subject.optional()
  })
};

// Import quiz validation
export const importQuizSchema = {
  body: Joi.object({
    quizData: Joi.object({
      title: commonFields.shortText.required(),
      subject: commonFields.subject.required(),
      description: commonFields.mediumText.required(),
      timeLimit: Joi.number().integer().min(1).max(180).optional(),
      passingScore: commonFields.score.required(),
      points: commonFields.points.required(),
      questions: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
          question: commonFields.longText.required(),
          options: Joi.array().items(Joi.string()).optional(),
          correctAnswer: Joi.string().required(),
          explanation: commonFields.mediumText.optional(),
          points: commonFields.points.default(1)
        })
      ).min(1).max(50).required()
    }).required()
  })
};

// Export quiz validation
export const exportQuizSchema = {
  params: idParamSchema,
  query: Joi.object({
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
    includeAnswers: commonFields.boolean.default(false),
    includeAttempts: commonFields.boolean.default(false)
  })
};