"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxPromptsQuerySchema = exports.progressReportQuerySchema = exports.recommendationTypeQuerySchema = exports.eventTypeQuerySchema = exports.limitQuerySchema = exports.daysQuerySchema = exports.generateProgressReportSchema = exports.trackEventSchema = exports.logMoodSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Mood log validation
exports.logMoodSchema = joi_1.default.object({
    mood: joi_1.default.string()
        .valid('happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'frustrated', 'confused', 'confident', 'neutral')
        .required()
        .messages({
        'any.required': 'Mood is required',
        'any.only': 'Invalid mood value'
    }),
    intensity: joi_1.default.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
        'any.required': 'Intensity is required',
        'number.min': 'Intensity must be at least 1',
        'number.max': 'Intensity cannot exceed 5'
    }),
    context: joi_1.default.string()
        .max(200)
        .optional()
        .allow('')
        .messages({
        'string.max': 'Context cannot exceed 200 characters'
    }),
    tags: joi_1.default.array()
        .items(joi_1.default.string().max(50))
        .optional()
        .messages({
        'array.base': 'Tags must be an array'
    }),
    notes: joi_1.default.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
        'string.max': 'Notes cannot exceed 500 characters'
    })
});
// Custom event tracking validation
exports.trackEventSchema = joi_1.default.object({
    eventType: joi_1.default.string()
        .required()
        .max(100)
        .messages({
        'any.required': 'Event type is required',
        'string.max': 'Event type cannot exceed 100 characters'
    }),
    eventData: joi_1.default.object()
        .optional()
        .messages({
        'object.base': 'Event data must be an object'
    }),
    page: joi_1.default.string()
        .max(200)
        .optional()
        .messages({
        'string.max': 'Page cannot exceed 200 characters'
    }),
    sessionId: joi_1.default.string()
        .max(100)
        .optional()
        .messages({
        'string.max': 'Session ID cannot exceed 100 characters'
    })
});
// Generate progress report validation
exports.generateProgressReportSchema = joi_1.default.object({
    period: joi_1.default.string()
        .valid('weekly', 'monthly')
        .required()
        .messages({
        'any.required': 'Period is required',
        'any.only': 'Period must be either weekly or monthly'
    })
});
// Query parameters validation
exports.daysQuerySchema = joi_1.default.object({
    days: joi_1.default.number()
        .integer()
        .min(1)
        .max(365)
        .optional()
        .default(30)
        .messages({
        'number.min': 'Days must be at least 1',
        'number.max': 'Days cannot exceed 365'
    })
});
exports.limitQuerySchema = joi_1.default.object({
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    })
});
exports.eventTypeQuerySchema = joi_1.default.object({
    eventType: joi_1.default.string()
        .max(100)
        .optional()
        .messages({
        'string.max': 'Event type cannot exceed 100 characters'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(50)
        .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    })
});
exports.recommendationTypeQuerySchema = joi_1.default.object({
    type: joi_1.default.string()
        .valid('content', 'study_time', 'break', 'technique', 'goal')
        .optional()
        .messages({
        'any.only': 'Invalid recommendation type'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(50)
        .optional()
        .default(10)
        .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
    })
});
exports.progressReportQuerySchema = joi_1.default.object({
    period: joi_1.default.string()
        .valid('weekly', 'monthly')
        .optional()
        .messages({
        'any.only': 'Period must be either weekly or monthly'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(50)
        .optional()
        .default(10)
        .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
    })
});
exports.maxPromptsQuerySchema = joi_1.default.object({
    max: joi_1.default.number()
        .integer()
        .min(1)
        .max(10)
        .optional()
        .default(3)
        .messages({
        'number.min': 'Max must be at least 1',
        'number.max': 'Max cannot exceed 10'
    })
});
//# sourceMappingURL=behavioral.js.map