"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAssessmentFeedbackSchema = exports.addReflectionFeedbackSchema = exports.assignCommitmentSchema = exports.rejectGoalSchema = exports.approveGoalSchema = exports.assignGoalSchema = exports.createStudentSchema = exports.inviteStudentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Invite student validation (matches TutorStudentsController.inviteStudent)
exports.inviteStudentSchema = {
    body: joi_1.default.object({
        email: common_1.commonFields.email,
        firstName: common_1.commonFields.name,
        lastName: common_1.commonFields.name,
        message: common_1.commonFields.mediumText.optional(),
    }),
};
// Create student validation (matches TutorStudentsController.createStudent)
exports.createStudentSchema = {
    body: joi_1.default.object({
        email: common_1.commonFields.email,
        firstName: common_1.commonFields.name,
        lastName: common_1.commonFields.name,
        dateOfBirth: common_1.commonFields.studentAge.required(),
        parentEmail: common_1.commonFields.email.optional(),
        academicGoals: common_1.commonFields.academicGoals.optional(),
    }),
};
// Assign goal to student validation (matches TutorGoalsController.assignGoal)
exports.assignGoalSchema = {
    params: joi_1.default.object({
        studentId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Goal title is required',
            'any.required': 'Goal title is required',
        }),
        description: common_1.commonFields.mediumText.optional(),
        target: joi_1.default.number().integer().min(1).required().messages({
            'number.min': 'Target must be at least 1',
            'any.required': 'Target is required',
        }),
        deadline: joi_1.default.date().iso().greater('now').optional().messages({
            'date.greater': 'Deadline must be in the future',
        }),
        milestones: joi_1.default.array()
            .items(joi_1.default.number().integer().min(0).max(100))
            .min(1)
            .max(10)
            .optional(),
    }),
};
// Approve goal validation (matches TutorGoalsController.approveGoal)
exports.approveGoalSchema = {
    params: joi_1.default.object({
        goalId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        feedback: common_1.commonFields.mediumText.optional(),
    }).optional(), // Body is optional for approve
};
// Reject goal validation (matches TutorGoalsController.rejectGoal)
exports.rejectGoalSchema = {
    params: joi_1.default.object({
        goalId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        feedback: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Rejection feedback is required',
        }),
    }),
};
// Assign commitment to student validation (matches TutorCommitmentsController.assignCommitment)
exports.assignCommitmentSchema = {
    params: joi_1.default.object({
        studentId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        commitments: joi_1.default.array()
            .items(joi_1.default.object({
            text: common_1.commonFields.shortText.required().messages({
                'string.empty': 'Commitment text is required',
            }),
            type: joi_1.default.string().valid('time', 'count', 'boolean').default('time'),
            target: joi_1.default.number().integer().min(0).optional().default(0),
        }))
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
exports.addReflectionFeedbackSchema = {
    params: joi_1.default.object({
        reflectionId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        comment: common_1.commonFields.longText.required().messages({
            'string.empty': 'Feedback comment is required',
            'any.required': 'Feedback comment is required',
        }),
    }),
};
// Add feedback to assessment validation (matches TutorAssessmentsController.addFeedback)
exports.addAssessmentFeedbackSchema = {
    params: joi_1.default.object({
        assessmentId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        feedback: common_1.commonFields.longText.required().messages({
            'string.empty': 'Feedback is required',
            'any.required': 'Feedback is required',
        }),
        rating: joi_1.default.number().integer().min(1).max(5).optional(),
    }),
};
//# sourceMappingURL=tutor.js.map