"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendSessionSchema = exports.reportSessionSchema = exports.searchSessionsSchema = exports.getSessionStatsSchema = exports.setAvailabilitySchema = exports.getAvailabilitySchema = exports.rescheduleSessionSchema = exports.rateSessionSchema = exports.completeSessionSchema = exports.joinSessionSchema = exports.cancelSessionSchema = exports.getSessionByIdSchema = exports.getSessionsSchema = exports.updateSessionSchema = exports.createSessionSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create session validation
exports.createSessionSchema = {
    body: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
        subject: common_1.commonFields.subject.required(),
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Session title is required'
        }),
        description: common_1.commonFields.mediumText.optional(),
        scheduledAt: joi_1.default.date().greater('now').iso().required().messages({
            'date.greater': 'Session must be scheduled for a future date',
            'any.required': 'Scheduled date and time is required'
        }),
        duration: common_1.commonFields.duration.required(),
        notes: common_1.commonFields.mediumText.optional()
    })
};
// Update session validation
exports.updateSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        title: common_1.commonFields.shortText,
        description: common_1.commonFields.mediumText.allow(''),
        scheduledAt: joi_1.default.date().greater('now').iso().messages({
            'date.greater': 'Session must be scheduled for a future date'
        }),
        duration: common_1.commonFields.duration,
        notes: common_1.commonFields.mediumText.allow(''),
        meetingUrl: common_1.commonFields.url.optional()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Get sessions validation
exports.getSessionsSchema = {
    query: common_1.paginationSchema.keys({
        status: common_1.commonFields.sessionStatus.optional(),
        subject: common_1.commonFields.subject.optional(),
        tutorId: common_1.commonFields.objectId.optional(),
        studentId: common_1.commonFields.objectId.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        upcoming: common_1.commonFields.boolean.default(false)
    })
};
// Get session by ID validation  
exports.getSessionByIdSchema = {
    params: common_1.idParamSchema
};
// Cancel session validation
exports.cancelSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        reason: joi_1.default.string().valid('student_unavailable', 'tutor_unavailable', 'technical_issues', 'emergency', 'other').required(),
        description: common_1.commonFields.mediumText.optional()
    })
};
// Join session validation
exports.joinSessionSchema = {
    params: common_1.idParamSchema
};
// Complete session validation
exports.completeSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        notes: common_1.commonFields.longText.optional(),
        homework: common_1.commonFields.longText.optional(),
        nextSteps: common_1.commonFields.longText.optional()
    })
};
// Rate session validation
exports.rateSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        rating: common_1.commonFields.rating.required(),
        feedback: common_1.commonFields.longText.optional()
    })
};
// Reschedule session validation
exports.rescheduleSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        newScheduledAt: joi_1.default.date().greater('now').iso().required().messages({
            'date.greater': 'New session time must be in the future',
            'any.required': 'New scheduled date and time is required'
        }),
        reason: common_1.commonFields.mediumText.optional()
    })
};
// Get session availability validation
exports.getAvailabilitySchema = {
    query: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
        startDate: joi_1.default.date().iso().required(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required(),
        duration: common_1.commonFields.duration.default(60)
    })
};
// Set tutor availability validation
exports.setAvailabilitySchema = {
    body: joi_1.default.object({
        availability: joi_1.default.array().items(joi_1.default.object({
            dayOfWeek: joi_1.default.number().integer().min(0).max(6).required(), // 0 = Sunday, 6 = Saturday
            startTime: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
                'string.pattern.base': 'Start time must be in HH:MM format'
            }),
            endTime: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
                'string.pattern.base': 'End time must be in HH:MM format'
            }),
            isRecurring: common_1.commonFields.boolean.default(true)
        })).min(1).required()
    })
};
// Get session statistics validation
exports.getSessionStatsSchema = {
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        groupBy: joi_1.default.string().valid('day', 'week', 'month').default('day')
    })
};
// Search sessions validation
exports.searchSessionsSchema = {
    query: common_1.paginationSchema.keys({
        query: common_1.commonFields.searchQuery.required(),
        subject: common_1.commonFields.subject.optional(),
        status: common_1.commonFields.sessionStatus.optional(),
        minRating: joi_1.default.number().min(1).max(5).optional(),
        priceRange: joi_1.default.string().pattern(/^\d+-\d+$/).optional().messages({
            'string.pattern.base': 'Price range must be in format "min-max" (e.g., "10-50")'
        })
    })
};
// Report session validation
exports.reportSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        reason: joi_1.default.string().valid('inappropriate_behavior', 'no_show', 'poor_quality', 'technical_issues', 'billing_dispute', 'other').required(),
        description: common_1.commonFields.longText.required().messages({
            'string.empty': 'Description is required'
        }),
        evidence: joi_1.default.array().items(common_1.commonFields.url).max(5).optional()
    })
};
// Extend session validation
exports.extendSessionSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        additionalMinutes: joi_1.default.number().integer().min(15).max(60).required().messages({
            'number.min': 'Extension must be at least 15 minutes',
            'number.max': 'Extension cannot exceed 60 minutes'
        })
    })
};
//# sourceMappingURL=session.js.map