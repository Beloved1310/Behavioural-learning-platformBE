"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommitmentSchema = exports.toggleCommitmentSchema = exports.createCommitmentsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create weekly commitments validation (matches CommitmentsController.createCommitments)
exports.createCommitmentsSchema = {
    body: joi_1.default.object({
        commitments: joi_1.default.array()
            .items(joi_1.default.object({
            text: common_1.commonFields.shortText.required().messages({
                'string.empty': 'Commitment text is required',
            }),
            type: joi_1.default.string().valid('time', 'count', 'boolean').default('time').messages({
                'any.only': 'Type must be time, count, or boolean',
            }),
            target: joi_1.default.number().integer().min(0).optional().default(0),
        }))
            .min(1)
            .max(5)
            .required()
            .messages({
            'array.min': 'At least one commitment is required',
            'array.max': 'Maximum 5 commitments per week',
            'any.required': 'Commitments array is required',
        }),
    }),
};
// Toggle commitment completion validation (matches CommitmentsController.toggleCommitment)
exports.toggleCommitmentSchema = {
    params: joi_1.default.object({
        commitmentId: common_1.commonFields.objectId.required(),
        itemIndex: joi_1.default.number().integer().min(0).required().messages({
            'number.min': 'Item index must be at least 0',
            'any.required': 'Item index is required',
        }),
    }),
};
// Delete commitment validation
exports.deleteCommitmentSchema = {
    params: common_1.idParamSchema,
};
//# sourceMappingURL=commitments.js.map