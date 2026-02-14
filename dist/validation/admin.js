"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByIdSchema = exports.getTutorByIdSchema = exports.getPendingTutorsSchema = exports.updateUserStatusSchema = exports.setBackgroundCheckStatusSchema = exports.rejectTutorSchema = exports.approveTutorSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Approve tutor validation (matches AdminController.approveTutor)
exports.approveTutorSchema = {
    params: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        adminNotes: common_1.commonFields.mediumText.optional(),
    }),
};
// Reject tutor validation (matches AdminController.rejectTutor)
exports.rejectTutorSchema = {
    params: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        reason: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Rejection reason is required',
            'any.required': 'Rejection reason is required',
        }),
    }),
};
// Set background check status validation (matches AdminController.setBackgroundCheckStatus)
exports.setBackgroundCheckStatusSchema = {
    params: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        // The controller expects a boolean field `isBackgroundChecked`
        isBackgroundChecked: common_1.commonFields.boolean.required().messages({
            'any.required': 'Background check status is required',
        }),
        notes: common_1.commonFields.mediumText.optional(),
    }),
};
// Update user status validation (matches AdminController.updateUserStatus)
exports.updateUserStatusSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        // The controller and adminService use a boolean `isActive` flag instead of a string status
        isActive: common_1.commonFields.boolean.required().messages({
            'any.required': 'isActive flag is required',
        }),
    }),
};
// Get pending tutors validation
exports.getPendingTutorsSchema = {
    query: common_1.paginationSchema,
};
// Get tutor by ID validation
exports.getTutorByIdSchema = {
    params: joi_1.default.object({
        tutorId: common_1.commonFields.objectId.required(),
    }),
};
// Get user by ID validation
exports.getUserByIdSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
    }),
};
//# sourceMappingURL=admin.js.map