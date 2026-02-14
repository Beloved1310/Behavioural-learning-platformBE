"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhookSchema = exports.getPayoutHistorySchema = exports.processPayoutSchema = exports.downloadInvoiceSchema = exports.getInvoicesSchema = exports.createDiscountSchema = exports.applyDiscountSchema = exports.getSubscriptionSchema = exports.cancelSubscriptionSchema = exports.processSubscriptionPaymentSchema = exports.getPaymentStatsSchema = exports.deletePaymentMethodSchema = exports.updatePaymentMethodSchema = exports.addPaymentMethodSchema = exports.getPaymentMethodsSchema = exports.refundPaymentSchema = exports.getPaymentByIdSchema = exports.getPaymentsSchema = exports.confirmPaymentSchema = exports.createPaymentIntentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create payment intent validation
exports.createPaymentIntentSchema = {
    body: joi_1.default.object({
        sessionId: common_1.commonFields.objectId.required(),
        amount: common_1.commonFields.price.required(),
        currency: common_1.commonFields.currency,
        description: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Payment description is required'
        }),
        metadata: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.string()).optional()
    })
};
// Confirm payment validation
exports.confirmPaymentSchema = {
    body: joi_1.default.object({
        paymentIntentId: joi_1.default.string().required().messages({
            'string.empty': 'Payment intent ID is required'
        }),
        paymentMethodId: joi_1.default.string().required().messages({
            'string.empty': 'Payment method ID is required'
        })
    })
};
// Get payments validation
exports.getPaymentsSchema = {
    query: common_1.paginationSchema.keys({
        status: common_1.commonFields.paymentStatus.optional(),
        sessionId: common_1.commonFields.objectId.optional(),
        userId: common_1.commonFields.objectId.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        minAmount: common_1.commonFields.price.optional(),
        maxAmount: common_1.commonFields.price.optional(),
        currency: common_1.commonFields.currency.optional()
    })
};
// Get payment by ID validation
exports.getPaymentByIdSchema = {
    params: common_1.idParamSchema
};
// Refund payment validation
exports.refundPaymentSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        amount: common_1.commonFields.price.optional(), // Partial refund amount, if not provided, full refund
        reason: joi_1.default.string().valid('requested_by_customer', 'duplicate', 'fraudulent', 'subscription_canceled', 'session_canceled', 'technical_issue', 'other').required(),
        description: common_1.commonFields.mediumText.optional()
    })
};
// Get payment methods validation
exports.getPaymentMethodsSchema = {
    query: common_1.paginationSchema
};
// Add payment method validation
exports.addPaymentMethodSchema = {
    body: joi_1.default.object({
        type: joi_1.default.string().valid('card', 'bank_account').required(),
        token: joi_1.default.string().required().messages({
            'string.empty': 'Payment method token is required'
        }),
        isDefault: common_1.commonFields.boolean.default(false),
        billingDetails: joi_1.default.object({
            name: common_1.commonFields.name.required(),
            email: common_1.commonFields.email.optional(),
            phone: common_1.commonFields.phone.optional(),
            address: joi_1.default.object({
                line1: joi_1.default.string().max(100).required(),
                line2: joi_1.default.string().max(100).optional(),
                city: joi_1.default.string().max(50).required(),
                state: joi_1.default.string().max(50).optional(),
                postal_code: joi_1.default.string().max(20).required(),
                country: joi_1.default.string().length(2).uppercase().required() // ISO country code
            }).required()
        }).required()
    })
};
// Update payment method validation
exports.updatePaymentMethodSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        isDefault: common_1.commonFields.boolean,
        billingDetails: joi_1.default.object({
            name: common_1.commonFields.name,
            email: common_1.commonFields.email,
            phone: common_1.commonFields.phone,
            address: joi_1.default.object({
                line1: joi_1.default.string().max(100),
                line2: joi_1.default.string().max(100).allow(''),
                city: joi_1.default.string().max(50),
                state: joi_1.default.string().max(50).allow(''),
                postal_code: joi_1.default.string().max(20),
                country: joi_1.default.string().length(2).uppercase()
            })
        })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Delete payment method validation
exports.deletePaymentMethodSchema = {
    params: common_1.idParamSchema
};
// Get payment statistics validation
exports.getPaymentStatsSchema = {
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        groupBy: joi_1.default.string().valid('day', 'week', 'month').default('day'),
        currency: common_1.commonFields.currency.optional(),
        userId: common_1.commonFields.objectId.optional()
    })
};
// Process subscription payment validation
exports.processSubscriptionPaymentSchema = {
    body: joi_1.default.object({
        subscriptionTier: common_1.commonFields.subscriptionTier.required(),
        paymentMethodId: joi_1.default.string().required().messages({
            'string.empty': 'Payment method ID is required'
        }),
        billingCycle: joi_1.default.string().valid('monthly', 'yearly').default('monthly')
    })
};
// Cancel subscription validation
exports.cancelSubscriptionSchema = {
    body: joi_1.default.object({
        reason: joi_1.default.string().valid('too_expensive', 'not_using', 'missing_features', 'poor_experience', 'found_alternative', 'other').required(),
        feedback: common_1.commonFields.longText.optional(),
        cancelImmediately: common_1.commonFields.boolean.default(false) // Cancel now vs. at period end
    })
};
// Get subscription details validation
exports.getSubscriptionSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.optional() // Admin can view any user's subscription
    })
};
// Apply discount/coupon validation
exports.applyDiscountSchema = {
    body: joi_1.default.object({
        code: joi_1.default.string().uppercase().min(3).max(20).required().messages({
            'string.empty': 'Discount code is required',
            'string.min': 'Discount code must be at least 3 characters',
            'string.max': 'Discount code cannot exceed 20 characters'
        }),
        sessionId: common_1.commonFields.objectId.optional(),
        subscriptionTier: common_1.commonFields.subscriptionTier.optional()
    }).xor('sessionId', 'subscriptionTier').messages({
        'object.xor': 'Either sessionId or subscriptionTier must be provided, but not both'
    })
};
// Create discount code validation (admin only)
exports.createDiscountSchema = {
    body: joi_1.default.object({
        code: joi_1.default.string().uppercase().min(3).max(20).required(),
        type: joi_1.default.string().valid('percentage', 'fixed_amount').required(),
        value: joi_1.default.number().min(0).required().messages({
            'number.min': 'Discount value cannot be negative'
        }),
        maxValue: joi_1.default.when('type', {
            is: 'percentage',
            then: common_1.commonFields.price.optional(),
            otherwise: joi_1.default.forbidden()
        }),
        usageLimit: joi_1.default.number().integer().min(1).optional(),
        userLimit: joi_1.default.number().integer().min(1).default(1).messages({
            'number.min': 'User limit must be at least 1'
        }),
        validFrom: joi_1.default.date().iso().default('now'),
        validUntil: joi_1.default.date().iso().greater(joi_1.default.ref('validFrom')).required(),
        applicableToSessions: common_1.commonFields.boolean.default(true),
        applicableToSubscriptions: common_1.commonFields.boolean.default(true),
        minimumAmount: common_1.commonFields.price.optional(),
        isActive: common_1.commonFields.boolean.default(true)
    })
};
// Get invoices validation
exports.getInvoicesSchema = {
    query: common_1.paginationSchema.keys({
        status: joi_1.default.string().valid('draft', 'open', 'paid', 'void', 'uncollectible').optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        currency: common_1.commonFields.currency.optional()
    })
};
// Download invoice validation
exports.downloadInvoiceSchema = {
    params: common_1.idParamSchema,
    query: joi_1.default.object({
        format: joi_1.default.string().valid('pdf', 'json').default('pdf')
    })
};
// Process payout validation (for tutors)
exports.processPayoutSchema = {
    body: joi_1.default.object({
        amount: common_1.commonFields.price.required(),
        currency: common_1.commonFields.currency,
        description: common_1.commonFields.shortText.optional()
    })
};
// Get payout history validation
exports.getPayoutHistorySchema = {
    query: common_1.paginationSchema.keys({
        status: joi_1.default.string().valid('pending', 'paid', 'failed', 'canceled').optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Handle webhook validation
exports.handleWebhookSchema = {
    body: joi_1.default.object({
        id: joi_1.default.string().required(),
        object: joi_1.default.string().required(),
        type: joi_1.default.string().required(),
        data: joi_1.default.object().required(),
        created: joi_1.default.number().required()
    })
};
//# sourceMappingURL=payment.js.map