"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationReadSchema = exports.getUserNotificationsSchema = exports.updateChildSchema = exports.addChildSchema = exports.getUserChildrenSchema = exports.searchUsersSchema = exports.reportUserSchema = exports.blockUserSchema = exports.getUserStatsSchema = exports.followUserSchema = exports.uploadAvatarSchema = exports.getTutorsBySubjectSchema = exports.deleteUserSchema = exports.updateUserSchema = exports.getUserByIdSchema = exports.getUsersSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const types_1 = require("../types");
// Get users list validation
exports.getUsersSchema = {
    query: common_1.paginationSchema.keys({
        role: common_1.commonFields.userRole.optional(),
        isVerified: common_1.commonFields.boolean.optional(),
        subscriptionTier: common_1.commonFields.subscriptionTier.optional(),
        subjects: joi_1.default.string().optional() // Single subject filter
    })
};
// Get user by ID validation
exports.getUserByIdSchema = {
    params: common_1.idParamSchema
};
// Update user validation (admin only)
exports.updateUserSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        firstName: common_1.commonFields.optionalName,
        lastName: common_1.commonFields.optionalName,
        isVerified: common_1.commonFields.boolean,
        subscriptionTier: common_1.commonFields.subscriptionTier,
        isBackgroundChecked: joi_1.default.when('role', {
            is: types_1.UserRole.TUTOR,
            then: common_1.commonFields.boolean,
            otherwise: joi_1.default.forbidden()
        }),
        role: common_1.commonFields.userRole,
        subjects: joi_1.default.when('role', {
            is: types_1.UserRole.TUTOR,
            then: common_1.commonFields.subjects,
            otherwise: joi_1.default.forbidden()
        }),
        hourlyRate: joi_1.default.when('role', {
            is: types_1.UserRole.TUTOR,
            then: common_1.commonFields.hourlyRate,
            otherwise: joi_1.default.forbidden()
        }),
        bio: joi_1.default.when('role', {
            is: types_1.UserRole.TUTOR,
            then: common_1.commonFields.mediumText.allow(''),
            otherwise: joi_1.default.forbidden()
        }),
        qualifications: joi_1.default.when('role', {
            is: types_1.UserRole.TUTOR,
            then: common_1.commonFields.qualifications,
            otherwise: joi_1.default.forbidden()
        }),
        academicGoals: joi_1.default.when('role', {
            is: types_1.UserRole.STUDENT,
            then: common_1.commonFields.academicGoals,
            otherwise: joi_1.default.forbidden()
        })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Delete user validation
exports.deleteUserSchema = {
    params: common_1.idParamSchema
};
// Get tutors by subject validation
exports.getTutorsBySubjectSchema = {
    query: common_1.paginationSchema.keys({
        subject: common_1.commonFields.subject.required(),
        minRating: joi_1.default.number().min(0).max(5).optional(),
        maxRate: common_1.commonFields.hourlyRate.optional(),
        minRate: common_1.commonFields.hourlyRate.optional()
    })
};
// Upload avatar validation
exports.uploadAvatarSchema = {
    body: joi_1.default.object({
        image: joi_1.default.string().required().messages({
            'string.empty': 'Image data is required'
        })
    })
};
// Follow/unfollow user validation
exports.followUserSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    })
};
// Get user statistics validation
exports.getUserStatsSchema = {
    params: common_1.idParamSchema,
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Block/unblock user validation
exports.blockUserSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        reason: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Reason for blocking is required'
        })
    })
};
// Report user validation
exports.reportUserSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        reason: joi_1.default.string().valid('inappropriate_behavior', 'spam', 'harassment', 'fake_profile', 'other').required(),
        description: common_1.commonFields.longText.required().messages({
            'string.empty': 'Description is required'
        }),
        evidence: joi_1.default.array().items(common_1.commonFields.url).max(5).optional()
    })
};
// Search users validation
exports.searchUsersSchema = {
    query: common_1.paginationSchema.keys({
        query: common_1.commonFields.searchQuery.required(),
        role: common_1.commonFields.userRole.optional(),
        subjects: joi_1.default.string().optional()
    })
};
// Get user children (for parents) validation
exports.getUserChildrenSchema = {
    query: common_1.paginationSchema
};
// Add child validation (for parents)
exports.addChildSchema = {
    body: joi_1.default.object({
        email: common_1.commonFields.email,
        firstName: common_1.commonFields.name,
        lastName: common_1.commonFields.name,
        dateOfBirth: common_1.commonFields.studentAge.required(),
        academicGoals: common_1.commonFields.academicGoals.optional()
    })
};
// Update child validation (for parents)
exports.updateChildSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        firstName: common_1.commonFields.optionalName,
        lastName: common_1.commonFields.optionalName,
        academicGoals: common_1.commonFields.academicGoals
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Get user notifications validation
exports.getUserNotificationsSchema = {
    query: common_1.paginationSchema.keys({
        unreadOnly: common_1.commonFields.boolean.default(false),
        type: joi_1.default.string().valid('study_reminder', 'session_reminder', 'quiz_available', 'badge_earned', 'message_received', 'payment_success', 'progress_report', 'system_announcement').optional()
    })
};
// Mark notification as read validation
exports.markNotificationReadSchema = {
    params: joi_1.default.object({
        notificationId: common_1.commonFields.objectId.required()
    })
};
//# sourceMappingURL=user.js.map