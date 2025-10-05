import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create payment intent validation
export const createPaymentIntentSchema = {
  body: Joi.object({
    sessionId: commonFields.objectId.required(),
    amount: commonFields.price.required(),
    currency: commonFields.currency,
    description: commonFields.shortText.required().messages({
      'string.empty': 'Payment description is required'
    }),
    metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional()
  })
};

// Confirm payment validation
export const confirmPaymentSchema = {
  body: Joi.object({
    paymentIntentId: Joi.string().required().messages({
      'string.empty': 'Payment intent ID is required'
    }),
    paymentMethodId: Joi.string().required().messages({
      'string.empty': 'Payment method ID is required'
    })
  })
};

// Get payments validation
export const getPaymentsSchema = {
  query: paginationSchema.keys({
    status: commonFields.paymentStatus.optional(),
    sessionId: commonFields.objectId.optional(),
    userId: commonFields.objectId.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    minAmount: commonFields.price.optional(),
    maxAmount: commonFields.price.optional(),
    currency: commonFields.currency.optional()
  })
};

// Get payment by ID validation
export const getPaymentByIdSchema = {
  params: idParamSchema
};

// Refund payment validation
export const refundPaymentSchema = {
  params: idParamSchema,
  body: Joi.object({
    amount: commonFields.price.optional(), // Partial refund amount, if not provided, full refund
    reason: Joi.string().valid(
      'requested_by_customer',
      'duplicate',
      'fraudulent',
      'subscription_canceled',
      'session_canceled',
      'technical_issue',
      'other'
    ).required(),
    description: commonFields.mediumText.optional()
  })
};

// Get payment methods validation
export const getPaymentMethodsSchema = {
  query: paginationSchema
};

// Add payment method validation
export const addPaymentMethodSchema = {
  body: Joi.object({
    type: Joi.string().valid('card', 'bank_account').required(),
    token: Joi.string().required().messages({
      'string.empty': 'Payment method token is required'
    }),
    isDefault: commonFields.boolean.default(false),
    billingDetails: Joi.object({
      name: commonFields.name.required(),
      email: commonFields.email.optional(),
      phone: commonFields.phone.optional(),
      address: Joi.object({
        line1: Joi.string().max(100).required(),
        line2: Joi.string().max(100).optional(),
        city: Joi.string().max(50).required(),
        state: Joi.string().max(50).optional(),
        postal_code: Joi.string().max(20).required(),
        country: Joi.string().length(2).uppercase().required() // ISO country code
      }).required()
    }).required()
  })
};

// Update payment method validation
export const updatePaymentMethodSchema = {
  params: idParamSchema,
  body: Joi.object({
    isDefault: commonFields.boolean,
    billingDetails: Joi.object({
      name: commonFields.name,
      email: commonFields.email,
      phone: commonFields.phone,
      address: Joi.object({
        line1: Joi.string().max(100),
        line2: Joi.string().max(100).allow(''),
        city: Joi.string().max(50),
        state: Joi.string().max(50).allow(''),
        postal_code: Joi.string().max(20),
        country: Joi.string().length(2).uppercase()
      })
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Delete payment method validation
export const deletePaymentMethodSchema = {
  params: idParamSchema
};

// Get payment statistics validation
export const getPaymentStatsSchema = {
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
    currency: commonFields.currency.optional(),
    userId: commonFields.objectId.optional()
  })
};

// Process subscription payment validation
export const processSubscriptionPaymentSchema = {
  body: Joi.object({
    subscriptionTier: commonFields.subscriptionTier.required(),
    paymentMethodId: Joi.string().required().messages({
      'string.empty': 'Payment method ID is required'
    }),
    billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly')
  })
};

// Cancel subscription validation
export const cancelSubscriptionSchema = {
  body: Joi.object({
    reason: Joi.string().valid(
      'too_expensive',
      'not_using',
      'missing_features',
      'poor_experience',
      'found_alternative',
      'other'
    ).required(),
    feedback: commonFields.longText.optional(),
    cancelImmediately: commonFields.boolean.default(false) // Cancel now vs. at period end
  })
};

// Get subscription details validation
export const getSubscriptionSchema = {
  params: Joi.object({
    userId: commonFields.objectId.optional() // Admin can view any user's subscription
  })
};

// Apply discount/coupon validation
export const applyDiscountSchema = {
  body: Joi.object({
    code: Joi.string().uppercase().min(3).max(20).required().messages({
      'string.empty': 'Discount code is required',
      'string.min': 'Discount code must be at least 3 characters',
      'string.max': 'Discount code cannot exceed 20 characters'
    }),
    sessionId: commonFields.objectId.optional(),
    subscriptionTier: commonFields.subscriptionTier.optional()
  }).xor('sessionId', 'subscriptionTier').messages({
    'object.xor': 'Either sessionId or subscriptionTier must be provided, but not both'
  })
};

// Create discount code validation (admin only)
export const createDiscountSchema = {
  body: Joi.object({
    code: Joi.string().uppercase().min(3).max(20).required(),
    type: Joi.string().valid('percentage', 'fixed_amount').required(),
    value: Joi.number().min(0).required().messages({
      'number.min': 'Discount value cannot be negative'
    }),
    maxValue: Joi.when('type', {
      is: 'percentage',
      then: commonFields.price.optional(),
      otherwise: Joi.forbidden()
    }),
    usageLimit: Joi.number().integer().min(1).optional(),
    userLimit: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'User limit must be at least 1'
    }),
    validFrom: Joi.date().iso().default('now'),
    validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
    applicableToSessions: commonFields.boolean.default(true),
    applicableToSubscriptions: commonFields.boolean.default(true),
    minimumAmount: commonFields.price.optional(),
    isActive: commonFields.boolean.default(true)
  })
};

// Get invoices validation
export const getInvoicesSchema = {
  query: paginationSchema.keys({
    status: Joi.string().valid('draft', 'open', 'paid', 'void', 'uncollectible').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    currency: commonFields.currency.optional()
  })
};

// Download invoice validation
export const downloadInvoiceSchema = {
  params: idParamSchema,
  query: Joi.object({
    format: Joi.string().valid('pdf', 'json').default('pdf')
  })
};

// Process payout validation (for tutors)
export const processPayoutSchema = {
  body: Joi.object({
    amount: commonFields.price.required(),
    currency: commonFields.currency,
    description: commonFields.shortText.optional()
  })
};

// Get payout history validation
export const getPayoutHistorySchema = {
  query: paginationSchema.keys({
    status: Joi.string().valid('pending', 'paid', 'failed', 'canceled').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Handle webhook validation
export const handleWebhookSchema = {
  body: Joi.object({
    id: Joi.string().required(),
    object: Joi.string().required(),
    type: Joi.string().required(),
    data: Joi.object().required(),
    created: Joi.number().required()
  })
};