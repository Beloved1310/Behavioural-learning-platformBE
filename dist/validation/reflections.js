"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReflectionsSchema = exports.createReflectionSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create reflection validation (matches ReflectionsController.createReflection)
exports.createReflectionSchema = {
    body: joi_1.default.object({
        prompt: common_1.commonFields.longText.required().messages({
            'string.empty': 'Prompt is required',
            'any.required': 'Prompt is required',
        }),
        response: common_1.commonFields.longText.required().messages({
            'string.empty': 'Response is required',
            'any.required': 'Response is required',
        }),
        type: joi_1.default.string().valid('daily', 'weekly', 'custom').default('daily').messages({
            'any.only': 'Type must be daily, weekly, or custom',
        }),
        mood: joi_1.default.string()
            .valid('happy', 'neutral', 'frustrated', 'confused', 'excited', 'tired', 'motivated')
            .optional(),
    }),
};
// Get reflections validation
exports.getReflectionsSchema = {
    query: common_1.paginationSchema.keys({
        period: joi_1.default.string().valid('week', 'all').default('week'),
    }),
};
//# sourceMappingURL=reflections.js.map