"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config"));
// Initialize Stripe
const stripe = new stripe_1.default(config_1.default.stripe.secretKey || '', {
    apiVersion: '2025-07-30.basil'
});
// Helper function to handle Stripe errors
function handleStripeError(error) {
    if (error instanceof stripe_1.default.errors.StripeError) {
        console.error('Stripe Error:', {
            type: error.type,
            message: error.message,
            code: error.code,
            statusCode: error.statusCode
        });
        throw new Error(error.message || 'Stripe API error');
    }
    throw error;
}
class StripeService {
    // Create a customer
    static async createCustomer(email, name) {
        try {
            return await stripe.customers.create({
                email,
                name,
                metadata: {
                    platform: 'behavioral-learning'
                }
            });
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Create payment intent
    static async createPaymentIntent(amount, currency, customerId, description) {
        try {
            return await stripe.paymentIntents.create({
                amount,
                currency,
                customer: customerId,
                description,
                automatic_payment_methods: {
                    enabled: true
                }
            });
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Create subscription
    static async createSubscription(customerId, priceId, trialDays) {
        try {
            const subscriptionParams = {
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            };
            if (trialDays) {
                subscriptionParams.trial_period_days = trialDays;
            }
            return await stripe.subscriptions.create(subscriptionParams);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Update subscription
    static async updateSubscription(subscriptionId, priceId, cancelAtPeriodEnd) {
        try {
            const updateParams = {};
            if (priceId) {
                // Get the subscription to find the subscription item ID
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                if (subscription.items.data.length > 0) {
                    updateParams.items = [
                        {
                            id: subscription.items.data[0].id,
                            price: priceId
                        }
                    ];
                }
            }
            if (cancelAtPeriodEnd !== undefined) {
                updateParams.cancel_at_period_end = cancelAtPeriodEnd;
            }
            return await stripe.subscriptions.update(subscriptionId, updateParams);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Cancel subscription
    static async cancelSubscription(subscriptionId) {
        try {
            return await stripe.subscriptions.cancel(subscriptionId);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Attach payment method to customer
    static async attachPaymentMethod(paymentMethodId, customerId) {
        try {
            return await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId
            });
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Detach payment method
    static async detachPaymentMethod(paymentMethodId) {
        try {
            return await stripe.paymentMethods.detach(paymentMethodId);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Set default payment method
    static async setDefaultPaymentMethod(customerId, paymentMethodId) {
        try {
            return await stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Create refund
    static async createRefund(paymentIntentId, amount, reason) {
        try {
            const refundParams = {
                payment_intent: paymentIntentId
            };
            if (amount) {
                refundParams.amount = amount;
            }
            if (reason) {
                refundParams.reason = reason;
            }
            return await stripe.refunds.create(refundParams);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Retrieve payment intent
    static async retrievePaymentIntent(paymentIntentId) {
        try {
            return await stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Retrieve subscription
    static async retrieveSubscription(subscriptionId) {
        try {
            return await stripe.subscriptions.retrieve(subscriptionId);
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // List customer payment methods
    static async listPaymentMethods(customerId, type = 'card') {
        try {
            const paymentMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type
            });
            return paymentMethods.data;
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Create setup intent for saving payment method
    static async createSetupIntent(customerId) {
        try {
            return await stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card']
            });
        }
        catch (error) {
            handleStripeError(error);
        }
    }
    // Construct webhook event
    static constructWebhookEvent(payload, signature, webhookSecret) {
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}
exports.StripeService = StripeService;
exports.default = StripeService;
//# sourceMappingURL=stripe.js.map