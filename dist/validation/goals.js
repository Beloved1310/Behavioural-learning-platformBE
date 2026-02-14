"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoalSchema = exports.getGoalMilestonesSchema = exports.updateGoalProgressSchema = exports.createGoalSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create goal validation (matches GoalsController.createGoal)
exports.createGoalSchema = {
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
            .optional()
            .messages({
            'array.min': 'At least one milestone is required',
            'array.max': 'Maximum 10 milestones allowed',
        }),
    }),
};
// Update goal progress validation (matches GoalsController.updateProgress)
exports.updateGoalProgressSchema = {
    params: joi_1.default.object({
        goalId: common_1.commonFields.objectId.required(),
    }),
};
// Get goal milestones validation
exports.getGoalMilestonesSchema = {
    params: joi_1.default.object({
        goalId: common_1.commonFields.objectId.required(),
    }),
};
// Delete goal validation
exports.deleteGoalSchema = {
    params: joi_1.default.object({
        goalId: common_1.commonFields.objectId.required(),
    }),
};
//# sourceMappingURL=goals.js.map