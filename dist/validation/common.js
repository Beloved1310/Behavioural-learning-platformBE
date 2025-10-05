"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.paginationSchema = exports.commonFields = void 0;
const joi_1 = __importDefault(require("joi"));
const types_1 = require("../types");
// Common field validations
exports.commonFields = {
    // MongoDB ObjectId validation
    objectId: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format'),
    // Email validation
    email: joi_1.default.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .trim()
        .max(255)
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'string.max': 'Email must not exceed 255 characters'
    }),
    // Password validation
    password: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.empty': 'Password is required'
    }),
    // Name validation
    name: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s'-]+$/)
        .required()
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 50 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
        'string.empty': 'Name is required'
    }),
    // Optional name validation
    optionalName: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s'-]+$/)
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 50 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }),
    // Phone number validation
    phone: joi_1.default.string()
        .pattern(/^(\+44|0)[1-9]\d{8,9}$/)
        .messages({
        'string.pattern.base': 'Please provide a valid UK phone number'
    }),
    // Date of birth validation
    dateOfBirth: joi_1.default.date()
        .min('1900-01-01')
        .max('now')
        .iso()
        .messages({
        'date.min': 'Date of birth cannot be before January 1, 1900',
        'date.max': 'Date of birth cannot be in the future',
        'date.format': 'Date of birth must be in YYYY-MM-DD format'
    }),
    // Age validation for students (13-18 years)
    studentAge: joi_1.default.date()
        .min(new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)) // 18 years ago
        .max(new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000)) // 13 years ago
        .iso()
        .messages({
        'date.min': 'Students must be at least 13 years old',
        'date.max': 'Students must be under 18 years old',
        'date.format': 'Date of birth must be in YYYY-MM-DD format'
    }),
    // URL validation
    url: joi_1.default.string().uri().messages({
        'string.uri': 'Please provide a valid URL'
    }),
    // Text content validation
    shortText: joi_1.default.string().trim().max(255).messages({
        'string.max': 'Text must not exceed 255 characters'
    }),
    mediumText: joi_1.default.string().trim().max(1000).messages({
        'string.max': 'Text must not exceed 1000 characters'
    }),
    longText: joi_1.default.string().trim().max(5000).messages({
        'string.max': 'Text must not exceed 5000 characters'
    }),
    // Pagination validation
    page: joi_1.default.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    limit: joi_1.default.number().integer().min(1).max(100).default(20).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
    }),
    // Enum validations
    userRole: joi_1.default.string().valid(...Object.values(types_1.UserRole)).messages({
        'any.only': `Role must be one of: ${Object.values(types_1.UserRole).join(', ')}`
    }),
    subscriptionTier: joi_1.default.string().valid(...Object.values(types_1.SubscriptionTier)).messages({
        'any.only': `Subscription tier must be one of: ${Object.values(types_1.SubscriptionTier).join(', ')}`
    }),
    sessionStatus: joi_1.default.string().valid(...Object.values(types_1.SessionStatus)).messages({
        'any.only': `Session status must be one of: ${Object.values(types_1.SessionStatus).join(', ')}`
    }),
    paymentStatus: joi_1.default.string().valid(...Object.values(types_1.PaymentStatus)).messages({
        'any.only': `Payment status must be one of: ${Object.values(types_1.PaymentStatus).join(', ')}`
    }),
    messageType: joi_1.default.string().valid(...Object.values(types_1.MessageType)).messages({
        'any.only': `Message type must be one of: ${Object.values(types_1.MessageType).join(', ')}`
    }),
    badgeType: joi_1.default.string().valid(...Object.values(types_1.BadgeType)).messages({
        'any.only': `Badge type must be one of: ${Object.values(types_1.BadgeType).join(', ')}`
    }),
    // Subject validation
    subject: joi_1.default.string().valid('Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Spanish', 'French', 'German').messages({
        'any.only': 'Please select a valid subject'
    }),
    // Subjects array validation
    subjects: joi_1.default.array().items(joi_1.default.string().valid('Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Spanish', 'French', 'German')).min(1).max(10).unique().messages({
        'array.min': 'At least one subject is required',
        'array.max': 'Maximum 10 subjects allowed',
        'array.unique': 'Subjects must be unique'
    }),
    // Academic goals validation
    academicGoals: joi_1.default.array().items(joi_1.default.string().trim().max(100)).max(5).messages({
        'array.max': 'Maximum 5 academic goals allowed',
        'string.max': 'Each goal must not exceed 100 characters'
    }),
    // Qualifications validation
    qualifications: joi_1.default.array().items(joi_1.default.string().trim().max(200)).max(10).messages({
        'array.max': 'Maximum 10 qualifications allowed',
        'string.max': 'Each qualification must not exceed 200 characters'
    }),
    // Price validation (in pence)
    price: joi_1.default.number().integer().min(0).max(100000).messages({
        'number.base': 'Price must be a number',
        'number.integer': 'Price must be an integer',
        'number.min': 'Price cannot be negative',
        'number.max': 'Price cannot exceed £1000'
    }),
    // Hourly rate validation
    hourlyRate: joi_1.default.number().min(5).max(200).precision(2).messages({
        'number.base': 'Hourly rate must be a number',
        'number.min': 'Hourly rate must be at least £5',
        'number.max': 'Hourly rate cannot exceed £200'
    }),
    // Duration validation (in minutes)
    duration: joi_1.default.number().integer().min(15).max(180).messages({
        'number.base': 'Duration must be a number',
        'number.integer': 'Duration must be an integer',
        'number.min': 'Duration must be at least 15 minutes',
        'number.max': 'Duration cannot exceed 180 minutes'
    }),
    // Rating validation
    rating: joi_1.default.number().min(1).max(5).messages({
        'number.base': 'Rating must be a number',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5'
    }),
    // Score validation (percentage)
    score: joi_1.default.number().min(0).max(100).messages({
        'number.base': 'Score must be a number',
        'number.min': 'Score cannot be negative',
        'number.max': 'Score cannot exceed 100'
    }),
    // Points validation
    points: joi_1.default.number().integer().min(0).messages({
        'number.base': 'Points must be a number',
        'number.integer': 'Points must be an integer',
        'number.min': 'Points cannot be negative'
    }),
    // File size validation (in bytes)
    fileSize: joi_1.default.number().integer().min(1).max(10 * 1024 * 1024).messages({
        'number.base': 'File size must be a number',
        'number.integer': 'File size must be an integer',
        'number.min': 'File size must be at least 1 byte',
        'number.max': 'File size cannot exceed 10MB'
    }),
    // MIME type validation
    mimeType: joi_1.default.string().valid(
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain').messages({
        'any.only': 'File type not supported'
    }),
    // Boolean fields
    boolean: joi_1.default.boolean().messages({
        'boolean.base': 'Value must be true or false'
    }),
    // Currency validation
    currency: joi_1.default.string().valid('GBP', 'USD', 'EUR').default('GBP').messages({
        'any.only': 'Currency must be GBP, USD, or EUR'
    }),
    // Timezone validation
    timezone: joi_1.default.string().default('Europe/London').messages({
        'string.base': 'Timezone must be a string'
    }),
    // Language validation
    language: joi_1.default.string().valid('en', 'es', 'fr', 'de').default('en').messages({
        'any.only': 'Language must be one of: en, es, fr, de'
    }),
    // Search query validation
    searchQuery: joi_1.default.string().trim().min(1).max(100).messages({
        'string.min': 'Search query must be at least 1 character',
        'string.max': 'Search query must not exceed 100 characters'
    }),
    // Sort validation
    sortField: joi_1.default.string().valid('createdAt', 'updatedAt', 'name', 'email', 'rating', 'price', 'date', 'score').default('createdAt').messages({
        'any.only': 'Invalid sort field'
    }),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc').messages({
        'any.only': 'Sort order must be asc or desc'
    })
};
// Common query parameters schema
exports.paginationSchema = joi_1.default.object({
    page: exports.commonFields.page,
    limit: exports.commonFields.limit,
    search: exports.commonFields.searchQuery.optional(),
    sortBy: exports.commonFields.sortField,
    sortOrder: exports.commonFields.sortOrder
});
// Common parameter schema for MongoDB ObjectId
exports.idParamSchema = joi_1.default.object({
    id: exports.commonFields.objectId.required()
});
//# sourceMappingURL=common.js.map