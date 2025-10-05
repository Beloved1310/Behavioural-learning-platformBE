"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferences = exports.updateProfile = exports.changePassword = exports.verifyEmailQuery = exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
const types_1 = require("../types");
// User registration validation
exports.register = joi_1.default.object({
    email: common_1.commonFields.email,
    password: common_1.commonFields.password,
    firstName: common_1.commonFields.name,
    lastName: common_1.commonFields.name,
    role: common_1.commonFields.userRole.required(),
    dateOfBirth: joi_1.default.when('role', {
        is: types_1.UserRole.STUDENT,
        then: common_1.commonFields.studentAge.required(),
        otherwise: common_1.commonFields.dateOfBirth.optional()
    }),
    parentEmail: joi_1.default.when('role', {
        is: types_1.UserRole.STUDENT,
        then: joi_1.default.when('dateOfBirth', {
            is: joi_1.default.date().max(new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)),
            then: common_1.commonFields.email.required().messages({
                'any.required': 'Parent email is required for users under 18'
            }),
            otherwise: common_1.commonFields.email.optional()
        }),
        otherwise: joi_1.default.forbidden().messages({
            'any.unknown': 'Parent email is only allowed for students'
        })
    }),
    subjects: joi_1.default.when('role', {
        is: types_1.UserRole.TUTOR,
        then: common_1.commonFields.subjects.required(),
        otherwise: joi_1.default.forbidden()
    }),
    hourlyRate: joi_1.default.when('role', {
        is: types_1.UserRole.TUTOR,
        then: common_1.commonFields.hourlyRate.optional(),
        otherwise: joi_1.default.forbidden()
    }),
    bio: joi_1.default.when('role', {
        is: types_1.UserRole.TUTOR,
        then: common_1.commonFields.mediumText.optional(),
        otherwise: joi_1.default.forbidden()
    }),
    qualifications: joi_1.default.when('role', {
        is: types_1.UserRole.TUTOR,
        then: common_1.commonFields.qualifications.optional(),
        otherwise: joi_1.default.forbidden()
    }),
    academicGoals: joi_1.default.when('role', {
        is: types_1.UserRole.STUDENT,
        then: common_1.commonFields.academicGoals.optional(),
        otherwise: joi_1.default.forbidden()
    })
});
// User login validation
exports.login = joi_1.default.object({
    email: common_1.commonFields.email,
    password: joi_1.default.string().required().messages({
        'string.empty': 'Password is required'
    })
});
// Forgot password validation
exports.forgotPassword = joi_1.default.object({
    email: common_1.commonFields.email
});
// Reset password validation
exports.resetPassword = joi_1.default.object({
    token: joi_1.default.string().required().messages({
        'string.empty': 'Reset token is required'
    }),
    password: common_1.commonFields.password
});
// Verify email validation (query parameters)
exports.verifyEmailQuery = joi_1.default.object({
    token: joi_1.default.string().required().messages({
        'string.empty': 'Verification token is required'
    })
});
// Change password validation
exports.changePassword = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        'string.empty': 'Current password is required'
    }),
    newPassword: common_1.commonFields.password
});
// Update profile validation
exports.updateProfile = joi_1.default.object({
    firstName: common_1.commonFields.optionalName,
    lastName: common_1.commonFields.optionalName,
    bio: common_1.commonFields.mediumText.allow(''),
    subjects: common_1.commonFields.subjects.optional(),
    hourlyRate: common_1.commonFields.hourlyRate.optional(),
    qualifications: common_1.commonFields.qualifications.optional(),
    academicGoals: common_1.commonFields.academicGoals.optional(),
    profileImage: common_1.commonFields.url.optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});
// Update preferences validation
exports.updatePreferences = joi_1.default.object({
    studyReminders: common_1.commonFields.boolean,
    darkMode: common_1.commonFields.boolean,
    language: common_1.commonFields.language,
    timezone: common_1.commonFields.timezone,
    emailNotifications: common_1.commonFields.boolean,
    pushNotifications: common_1.commonFields.boolean,
    smsNotifications: common_1.commonFields.boolean,
    sessionReminders: common_1.commonFields.boolean,
    progressReports: common_1.commonFields.boolean
}).min(1).messages({
    'object.min': 'At least one preference must be provided for update'
});
//# sourceMappingURL=auth.js.map