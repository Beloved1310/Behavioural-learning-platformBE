"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorRescheduleSessionSchema = exports.tutorCreateSessionSchema = exports.updateSessionStatusSchema = exports.extendSessionSchema = exports.reportSessionSchema = exports.searchSessionsSchema = exports.getSessionStatsSchema = exports.deleteAvailabilitySchema = exports.addAvailabilitySchema = exports.setAvailabilitySchema = exports.bookTutorSessionSchema = exports.getAvailabilitySchema = exports.rescheduleSessionSchema = exports.rateSessionSchema = exports.completeSessionSchema = exports.joinSessionSchema = exports.cancelSessionSchema = exports.getSessionByIdSchema = exports.getSessionsSchema = exports.updateSessionSchema = exports.createSessionSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create session validation (matches SessionsController.createSession)
exports.createSessionSchema = {
    body: joi_1.default.object({
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Session title is required',
        }),
        subject: common_1.commonFields.subject.required().messages({
            'any.required': 'Subject is required',
            'any.only': 'Please select a valid subject',
            'string.empty': 'Subject is required',
        }),
        type: joi_1.default.string()
            .valid('self_study', 'tutoring', 'study', 'quiz', 'reading') // All valid SessionType values
            .optional()
            .custom((value, helpers) => {
            // Map 'study' to 'self_study' for consistency
            if (value === 'study') {
                return 'self_study';
            }
            // Ensure value is one of the valid enum values
            const validTypes = ['self_study', 'tutoring', 'quiz', 'reading'];
            if (validTypes.includes(value)) {
                return value;
            }
            // Default to 'self_study' if invalid
            return 'self_study';
        }),
        startTime: joi_1.default.date().iso().required().messages({
            'date.base': 'Start time must be a valid ISO date string',
            'any.required': 'Start time is required',
            'date.format': 'Start time must be in ISO 8601 format (e.g., 2024-01-19T15:00:00.000Z)',
        }),
        endTime: joi_1.default.date().iso().min(joi_1.default.ref('startTime')).optional().allow(null).messages({
            'date.min': 'End time must be after start time',
            'date.base': 'End time must be a valid ISO date string',
            'date.format': 'End time must be in ISO 8601 format (e.g., 2024-01-19T16:00:00.000Z)',
        }),
        duration: joi_1.default.when('endTime', {
            is: joi_1.default.exist(),
            then: common_1.commonFields.duration.optional(),
            otherwise: common_1.commonFields.duration.required().messages({
                'any.required': 'Duration is required when endTime is not provided',
                'number.base': 'Duration must be a number',
                'number.integer': 'Duration must be an integer',
                'number.min': 'Duration must be at least 15 minutes',
                'number.max': 'Duration cannot exceed 180 minutes',
            }),
        }),
        tutorId: common_1.commonFields.objectId.optional().allow(null, ''), // Optional for self-study sessions
        description: common_1.commonFields.mediumText.optional().allow('', null), // Allow empty strings and null
        isRecurring: common_1.commonFields.boolean.optional(),
        recurringPattern: joi_1.default.alternatives()
            .try(joi_1.default.object(), // Object format
        joi_1.default.string().valid('daily', 'weekly', 'monthly', ''), // String format for backward compatibility, allow empty string
        joi_1.default.valid(null) // Allow null (undefined is already handled by optional())
        )
            .optional(), // Allow object, string, null, undefined, or empty string
        reminderEnabled: common_1.commonFields.boolean.optional(),
        reminderTime: joi_1.default.number().integer().min(0).max(1440).optional().allow(null), // Minutes before session
    }),
};
// Update session validation (matches SessionsController.updateSession)
exports.updateSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        title: common_1.commonFields.shortText,
        description: common_1.commonFields.mediumText.allow('', null),
        startTime: joi_1.default.date().iso().messages({
            'date.base': 'Start time must be a valid date',
        }),
        endTime: joi_1.default.date().iso().min(joi_1.default.ref('startTime')).optional().allow(null).messages({
            'date.min': 'End time must be after start time',
        }),
        duration: common_1.commonFields.duration,
        subject: common_1.commonFields.subject.optional(),
        type: joi_1.default.string().valid('self_study', 'tutoring', 'study', 'quiz', 'reading').optional(),
        isRecurring: common_1.commonFields.boolean.optional(),
        recurringPattern: joi_1.default.alternatives()
            .try(joi_1.default.object(), // Object format
        joi_1.default.string().valid('daily', 'weekly', 'monthly', ''), // String format for backward compatibility, allow empty string
        joi_1.default.valid(null) // Allow null (undefined is already handled by optional())
        )
            .optional(), // Allow object, string, null, undefined, or empty string
        reminderEnabled: common_1.commonFields.boolean.optional(),
        reminderTime: joi_1.default.number().integer().min(0).max(1440).optional().allow(null),
    })
        .min(1)
        .messages({
        'object.min': 'At least one field must be provided for update',
    }),
};
// Get sessions validation (matches SessionsController.getUserSessions)
exports.getSessionsSchema = {
    query: common_1.paginationSchema.keys({
        status: common_1.commonFields.sessionStatus.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        type: joi_1.default.string().valid('self_study', 'tutoring', 'study', 'quiz', 'reading').optional(),
    }),
};
// Get session by ID validation
exports.getSessionByIdSchema = {
    params: common_1.idParamSchema,
};
// Cancel session validation
exports.cancelSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        reason: joi_1.default.string()
            .valid('student_unavailable', 'tutor_unavailable', 'technical_issues', 'emergency', 'other')
            .required(),
        description: common_1.commonFields.mediumText.optional(),
    }),
};
// Join session validation
exports.joinSessionSchema = {
    params: common_1.idParamSchema,
};
// Complete session validation
exports.completeSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        notes: common_1.commonFields.longText.optional(),
        homework: common_1.commonFields.longText.optional(),
        nextSteps: common_1.commonFields.longText.optional(),
    }),
};
// Rate session validation
exports.rateSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        rating: common_1.commonFields.rating.required(),
        feedback: common_1.commonFields.longText.optional(),
    }),
};
// Reschedule session validation
exports.rescheduleSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        newScheduledAt: joi_1.default.date().greater('now').iso().required().messages({
            'date.greater': 'New session time must be in the future',
            'any.required': 'New scheduled date and time is required',
        }),
        reason: common_1.commonFields.mediumText.optional(),
    }),
};
// Get session availability validation (matches SessionsController.getTutorAvailability)
exports.getAvailabilitySchema = {
    params: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
    }),
    query: joi_1.default.object({
        date: joi_1.default.string().optional(), // YYYY-MM-DD format
        duration: joi_1.default.number().integer().min(15).max(180).default(60),
    }),
};
// Book tutor session validation (matches SessionsController.bookTutorSession)
exports.bookTutorSessionSchema = {
    body: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Session title is required',
        }),
        subject: common_1.commonFields.subject.required(),
        startTime: joi_1.default.date().iso().required().messages({
            'date.base': 'Start time must be a valid date',
            'any.required': 'Start time is required',
        }),
        duration: common_1.commonFields.duration.required(),
        description: common_1.commonFields.mediumText.optional(),
    }),
};
// Set tutor availability validation (matches TutorAvailabilityController.setAvailability)
// Accepts both 'availability' (singular) and 'availabilities' (plural) for flexibility
const availabilityItemSchema = joi_1.default.object({
    dayOfWeek: joi_1.default.number().integer().min(0).max(6).required(), // 0 = Sunday, 6 = Saturday
    startTime: joi_1.default.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
        'string.pattern.base': 'Start time must be in HH:MM format',
    }),
    endTime: joi_1.default.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
        'string.pattern.base': 'End time must be in HH:MM format',
    }),
    isRecurring: common_1.commonFields.boolean.default(true),
    specificDate: joi_1.default.date().iso().optional().allow(null),
});
exports.setAvailabilitySchema = {
    body: joi_1.default.alternatives()
        .try(
    // Accept 'availability' (singular) - original format
    joi_1.default.object({
        availability: joi_1.default.array()
            .items(availabilityItemSchema)
            .min(1)
            .required(),
    }).custom((value, helpers) => {
        // Normalize: convert 'availability' to 'availabilities' for controller
        if (value.availability) {
            return { availabilities: value.availability };
        }
        return value;
    }), 
    // Accept 'availabilities' (plural) - frontend format
    joi_1.default.object({
        availabilities: joi_1.default.array()
            .items(availabilityItemSchema)
            .min(1)
            .required(),
    }), 
    // Accept direct array (for backward compatibility)
    joi_1.default.array()
        .items(availabilityItemSchema)
        .min(1)
        .required()
        .custom((value, helpers) => {
        // Normalize: convert array to object with 'availabilities' key
        return { availabilities: value };
    }))
        .messages({
        'alternatives.match': 'Request body must contain either "availability" or "availabilities" array, or be a direct array',
    }),
};
// Add tutor availability validation (matches TutorAvailabilityController.addAvailability)
exports.addAvailabilitySchema = {
    body: joi_1.default.object({
        dayOfWeek: joi_1.default.number().integer().min(0).max(6).required(),
        startTime: joi_1.default.string()
            .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
            'string.pattern.base': 'Start time must be in HH:MM format',
        }),
        endTime: joi_1.default.string()
            .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
            'string.pattern.base': 'End time must be in HH:MM format',
        }),
        isRecurring: common_1.commonFields.boolean.default(true),
        specificDate: joi_1.default.date().iso().optional(),
    }),
};
// Delete tutor availability validation
exports.deleteAvailabilitySchema = {
    params: common_1.idParamSchema,
};
// Get session statistics validation
exports.getSessionStatsSchema = {
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        groupBy: joi_1.default.string().valid('day', 'week', 'month').default('day'),
    }),
};
// Search sessions validation
exports.searchSessionsSchema = {
    query: common_1.paginationSchema.keys({
        query: common_1.commonFields.searchQuery.required(),
        subject: common_1.commonFields.subject.optional(),
        status: common_1.commonFields.sessionStatus.optional(),
        minRating: joi_1.default.number().min(1).max(5).optional(),
        priceRange: joi_1.default.string()
            .pattern(/^\d+-\d+$/)
            .optional()
            .messages({
            'string.pattern.base': 'Price range must be in format "min-max" (e.g., "10-50")',
        }),
    }),
};
// Report session validation
exports.reportSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        reason: joi_1.default.string()
            .valid('inappropriate_behavior', 'no_show', 'poor_quality', 'technical_issues', 'billing_dispute', 'other')
            .required(),
        description: common_1.commonFields.longText.required().messages({
            'string.empty': 'Description is required',
        }),
        evidence: joi_1.default.array().items(common_1.commonFields.url).max(5).optional(),
    }),
};
// Extend session validation
exports.extendSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        additionalMinutes: joi_1.default.number().integer().min(15).max(60).required().messages({
            'number.min': 'Extension must be at least 15 minutes',
            'number.max': 'Extension cannot exceed 60 minutes',
        }),
    }),
};
// Update session status validation (matches SessionsController.updateSessionStatus)
exports.updateSessionStatusSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        status: common_1.commonFields.sessionStatus.required(),
    }),
};
// Tutor creates session validation (matches TutorSessionController.createSession)
exports.tutorCreateSessionSchema = {
    body: joi_1.default.object({
        studentId: common_1.commonFields.objectId.required().messages({
            'any.required': 'Student ID is required',
        }),
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Session title is required',
        }),
        subject: common_1.commonFields.subject.required(),
        scheduledAt: joi_1.default.date().iso().required().messages({
            'date.base': 'Scheduled date must be a valid date',
            'any.required': 'Scheduled date is required',
        }),
        duration: common_1.commonFields.duration.required(),
        description: common_1.commonFields.mediumText.optional(),
    }),
};
// Reschedule session validation (matches TutorSessionController.rescheduleSession)
exports.tutorRescheduleSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        newScheduledAt: joi_1.default.date().iso().required().messages({
            'date.base': 'New scheduled date must be a valid date',
            'any.required': 'New scheduled date is required',
        }),
        reason: common_1.commonFields.mediumText.optional(),
    }),
};
//# sourceMappingURL=session.js.map