"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportQuizSchema = exports.importQuizSchema = exports.duplicateQuizSchema = exports.getPracticeQuestionsSchema = exports.reviewQuizAttemptSchema = exports.getStudentQuizProgressSchema = exports.getQuizStatsSchema = exports.getQuizAttemptByIdSchema = exports.getQuizAttemptsSchema = exports.submitQuizAttemptSchema = exports.deleteQuizSchema = exports.getQuizByIdSchema = exports.getQuizzesSchema = exports.updateQuizSchema = exports.createQuizSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create quiz validation
exports.createQuizSchema = {
    body: joi_1.default.object({
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Quiz title is required'
        }),
        subject: common_1.commonFields.subject.required(),
        description: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Quiz description is required'
        }),
        timeLimit: joi_1.default.number().integer().min(1).max(180).optional().messages({
            'number.min': 'Time limit must be at least 1 minute',
            'number.max': 'Time limit cannot exceed 180 minutes'
        }),
        passingScore: common_1.commonFields.score.required(),
        points: common_1.commonFields.points.required(),
        isActive: common_1.commonFields.boolean.default(true),
        questions: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
            question: common_1.commonFields.longText.required().messages({
                'string.empty': 'Question text is required'
            }),
            options: joi_1.default.when('type', {
                is: 'multiple_choice',
                then: joi_1.default.array().items(joi_1.default.string().trim().max(200)).min(2).max(6).required(),
                otherwise: joi_1.default.when('type', {
                    is: 'true_false',
                    then: joi_1.default.array().items(joi_1.default.string().valid('True', 'False')).length(2).default(['True', 'False']),
                    otherwise: joi_1.default.forbidden()
                })
            }),
            correctAnswer: joi_1.default.string().required().messages({
                'string.empty': 'Correct answer is required'
            }),
            explanation: common_1.commonFields.mediumText.optional(),
            points: common_1.commonFields.points.default(1),
            order: joi_1.default.number().integer().min(1).required().messages({
                'number.min': 'Question order must be at least 1'
            })
        })).min(1).max(50).required().messages({
            'array.min': 'At least one question is required',
            'array.max': 'Maximum 50 questions allowed'
        })
    })
};
// Update quiz validation
exports.updateQuizSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        title: common_1.commonFields.shortText,
        description: common_1.commonFields.mediumText,
        timeLimit: joi_1.default.number().integer().min(1).max(180).optional(),
        passingScore: common_1.commonFields.score,
        points: common_1.commonFields.points,
        isActive: common_1.commonFields.boolean,
        questions: joi_1.default.array().items(joi_1.default.object({
            _id: common_1.commonFields.objectId.optional(), // For existing questions
            type: joi_1.default.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
            question: common_1.commonFields.longText.required(),
            options: joi_1.default.when('type', {
                is: 'multiple_choice',
                then: joi_1.default.array().items(joi_1.default.string().trim().max(200)).min(2).max(6).required(),
                otherwise: joi_1.default.when('type', {
                    is: 'true_false',
                    then: joi_1.default.array().items(joi_1.default.string().valid('True', 'False')).length(2),
                    otherwise: joi_1.default.forbidden()
                })
            }),
            correctAnswer: joi_1.default.string().required(),
            explanation: common_1.commonFields.mediumText.optional(),
            points: common_1.commonFields.points.default(1),
            order: joi_1.default.number().integer().min(1).required()
        })).min(1).max(50)
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Get quizzes validation
exports.getQuizzesSchema = {
    query: common_1.paginationSchema.keys({
        subject: common_1.commonFields.subject.optional(),
        isActive: common_1.commonFields.boolean.optional(),
        difficulty: joi_1.default.string().valid('easy', 'medium', 'hard').optional(),
        minPoints: common_1.commonFields.points.optional(),
        maxPoints: common_1.commonFields.points.optional()
    })
};
// Get quiz by ID validation
exports.getQuizByIdSchema = {
    params: common_1.idParamSchema,
    query: joi_1.default.object({
        includeAnswers: common_1.commonFields.boolean.default(false) // For admin/tutor view
    })
};
// Delete quiz validation
exports.deleteQuizSchema = {
    params: common_1.idParamSchema
};
// Submit quiz attempt validation
exports.submitQuizAttemptSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        answers: joi_1.default.object().pattern(common_1.commonFields.objectId, // Question ID
        joi_1.default.alternatives().try(joi_1.default.string().max(1000), // For short answer
        joi_1.default.number().integer(), // For multiple choice index
        joi_1.default.boolean() // For true/false
        )).min(1).required().messages({
            'object.min': 'At least one answer is required'
        }),
        timeSpent: joi_1.default.number().integer().min(1).required().messages({
            'number.min': 'Time spent must be at least 1 second'
        }),
        startedAt: joi_1.default.date().iso().max('now').required().messages({
            'date.max': 'Start time cannot be in the future'
        })
    })
};
// Get quiz attempts validation
exports.getQuizAttemptsSchema = {
    query: common_1.paginationSchema.keys({
        quizId: common_1.commonFields.objectId.optional(),
        studentId: common_1.commonFields.objectId.optional(),
        minScore: common_1.commonFields.score.optional(),
        maxScore: common_1.commonFields.score.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Get quiz attempt by ID validation
exports.getQuizAttemptByIdSchema = {
    params: common_1.idParamSchema
};
// Get quiz statistics validation
exports.getQuizStatsSchema = {
    params: common_1.idParamSchema,
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
        detailed: common_1.commonFields.boolean.default(false)
    })
};
// Get student quiz progress validation
exports.getStudentQuizProgressSchema = {
    query: common_1.paginationSchema.keys({
        subject: common_1.commonFields.subject.optional(),
        completed: common_1.commonFields.boolean.optional()
    })
};
// Review quiz attempt validation
exports.reviewQuizAttemptSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        feedback: common_1.commonFields.longText.optional(),
        manualScoreAdjustments: joi_1.default.object().pattern(common_1.commonFields.objectId, // Question ID
        joi_1.default.object({
            awarded: common_1.commonFields.boolean.required(),
            feedback: common_1.commonFields.mediumText.optional()
        })).optional()
    })
};
// Get random practice questions validation
exports.getPracticeQuestionsSchema = {
    query: joi_1.default.object({
        subject: common_1.commonFields.subject.required(),
        count: joi_1.default.number().integer().min(1).max(20).default(10),
        difficulty: joi_1.default.string().valid('easy', 'medium', 'hard').optional(),
        excludeAttempted: common_1.commonFields.boolean.default(false)
    })
};
// Duplicate quiz validation
exports.duplicateQuizSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        title: common_1.commonFields.shortText.optional(),
        subject: common_1.commonFields.subject.optional()
    })
};
// Import quiz validation
exports.importQuizSchema = {
    body: joi_1.default.object({
        quizData: joi_1.default.object({
            title: common_1.commonFields.shortText.required(),
            subject: common_1.commonFields.subject.required(),
            description: common_1.commonFields.mediumText.required(),
            timeLimit: joi_1.default.number().integer().min(1).max(180).optional(),
            passingScore: common_1.commonFields.score.required(),
            points: common_1.commonFields.points.required(),
            questions: joi_1.default.array().items(joi_1.default.object({
                type: joi_1.default.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
                question: common_1.commonFields.longText.required(),
                options: joi_1.default.array().items(joi_1.default.string()).optional(),
                correctAnswer: joi_1.default.string().required(),
                explanation: common_1.commonFields.mediumText.optional(),
                points: common_1.commonFields.points.default(1)
            })).min(1).max(50).required()
        }).required()
    })
};
// Export quiz validation
exports.exportQuizSchema = {
    params: common_1.idParamSchema,
    query: joi_1.default.object({
        format: joi_1.default.string().valid('json', 'csv', 'pdf').default('json'),
        includeAnswers: common_1.commonFields.boolean.default(false),
        includeAttempts: common_1.commonFields.boolean.default(false)
    })
};
//# sourceMappingURL=quiz.js.map