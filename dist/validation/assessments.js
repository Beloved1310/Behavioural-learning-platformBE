"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssessmentTrendsSchema = exports.submitAssessmentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Submit weekly assessment validation (matches AssessmentsController.submitAssessment)
exports.submitAssessmentSchema = {
    body: joi_1.default.object({
        weekRating: joi_1.default.number().integer().min(1).max(10).required().messages({
            'number.min': 'Week rating must be at least 1',
            'number.max': 'Week rating cannot exceed 10',
            'any.required': 'Week rating is required',
        }),
        whatWentWell: common_1.commonFields.longText.required().messages({
            'string.empty': 'What went well is required',
            'any.required': 'What went well is required',
        }),
        challenges: common_1.commonFields.longText.required().messages({
            'string.empty': 'Challenges description is required',
            'any.required': 'Challenges description is required',
        }),
        nextWeekFocus: common_1.commonFields.longText.required().messages({
            'string.empty': 'Next week focus is required',
            'any.required': 'Next week focus is required',
        }),
        commitmentLevel: joi_1.default.number().integer().min(1).max(10).required().messages({
            'number.min': 'Commitment level must be at least 1',
            'number.max': 'Commitment level cannot exceed 10',
            'any.required': 'Commitment level is required',
        }),
    }),
};
// Get assessment trends validation
exports.getAssessmentTrendsSchema = {
    query: joi_1.default.object({
        weeks: joi_1.default.number().integer().min(1).max(52).default(8).messages({
            'number.min': 'Weeks must be at least 1',
            'number.max': 'Weeks cannot exceed 52',
        }),
    }),
};
//# sourceMappingURL=assessments.js.map