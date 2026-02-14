import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create weekly commitments validation (matches CommitmentsController.createCommitments)
export const createCommitmentsSchema = {
  body: Joi.object({
    commitments: Joi.array()
      .items(
        Joi.object({
          text: commonFields.shortText.required().messages({
            'string.empty': 'Commitment text is required',
          }),
          type: Joi.string().valid('time', 'count', 'boolean').default('time').messages({
            'any.only': 'Type must be time, count, or boolean',
          }),
          target: Joi.number().integer().min(0).optional().default(0),
        })
      )
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
export const toggleCommitmentSchema = {
  params: Joi.object({
    commitmentId: commonFields.objectId.required(),
    itemIndex: Joi.number().integer().min(0).required().messages({
      'number.min': 'Item index must be at least 0',
      'any.required': 'Item index is required',
    }),
  }),
};

// Delete commitment validation
export const deleteCommitmentSchema = {
  params: idParamSchema,
};

