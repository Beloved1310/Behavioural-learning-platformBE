"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const stripe_1 = require("../services/stripe");
const Payment_1 = require("../models/Payment");
const Subscription_1 = __importDefault(require("../models/Subscription"));
const User_1 = require("../models/User");
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../types");
class WebhookController {
    // Handle Stripe webhook events
    static async handleStripeWebhook(req, res) {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            throw new errorHandler_1.AppError('Missing stripe signature', 400);
        }
        let event;
        try {
            // Verify webhook signature
            event = stripe_1.StripeService.constructWebhookEvent(req.body, signature, config_1.default.stripe.webhookSecret);
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new errorHandler_1.AppError(`Webhook Error: ${err.message}`, 400);
        }
        // Handle the event
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await WebhookController.handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await WebhookController.handlePaymentIntentFailed(event.data.object);
                    break;
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await WebhookController.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await WebhookController.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await WebhookController.handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await WebhookController.handleInvoicePaymentFailed(event.data.object);
                    break;
                case 'charge.refunded':
                    await WebhookController.handleChargeRefunded(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
            res.json({ received: true });
        }
        catch (error) {
            console.error('Error handling webhook:', error);
            throw new errorHandler_1.AppError(`Webhook handler failed: ${error.message}`, 500);
        }
    }
    // Handle successful payment intent
    static async handlePaymentIntentSucceeded(paymentIntent) {
        const payment = await Payment_1.Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (payment) {
            payment.status = types_1.PaymentStatus.COMPLETED;
            await payment.save();
            console.log(`Payment ${payment._id} marked as completed`);
        }
    }
    // Handle failed payment intent
    static async handlePaymentIntentFailed(paymentIntent) {
        const payment = await Payment_1.Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (payment) {
            payment.status = types_1.PaymentStatus.FAILED;
            await payment.save();
            console.log(`Payment ${payment._id} marked as failed`);
        }
    }
    // Handle subscription updates
    static async handleSubscriptionUpdated(stripeSubscription) {
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscription.id
        });
        if (subscription) {
            // Update subscription status
            subscription.status = stripeSubscription.status;
            subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
            subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end || false;
            // Update trial dates if applicable
            if (stripeSubscription.trial_start && stripeSubscription.trial_end) {
                subscription.trialStart = new Date(stripeSubscription.trial_start * 1000);
                subscription.trialEnd = new Date(stripeSubscription.trial_end * 1000);
            }
            await subscription.save();
            console.log(`Subscription ${subscription._id} updated`);
            // Update user subscription tier
            const user = await User_1.User.findById(subscription.userId);
            if (user && stripeSubscription.status === 'active') {
                user.subscriptionTier = subscription.planType.toUpperCase();
                await user.save();
            }
        }
    }
    // Handle subscription deletion
    static async handleSubscriptionDeleted(stripeSubscription) {
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscription.id
        });
        if (subscription) {
            subscription.status = types_1.SubscriptionStatus.CANCELLED;
            subscription.cancelledAt = new Date();
            await subscription.save();
            console.log(`Subscription ${subscription._id} cancelled`);
            // Update user subscription tier to basic or free
            const user = await User_1.User.findById(subscription.userId);
            if (user) {
                user.subscriptionTier = types_1.SubscriptionTier.BASIC;
                await user.save();
            }
        }
    }
    // Handle successful invoice payment
    static async handleInvoicePaymentSucceeded(invoice) {
        if (invoice.subscription) {
            const subscription = await Subscription_1.default.findOne({
                stripeSubscriptionId: invoice.subscription
            });
            if (subscription) {
                console.log(`Invoice paid for subscription ${subscription._id}`);
                // Create a payment record for the invoice
                await Payment_1.Payment.create({
                    userId: subscription.userId,
                    amount: invoice.amount_paid || 0,
                    currency: invoice.currency?.toUpperCase() || 'GBP',
                    status: types_1.PaymentStatus.COMPLETED,
                    stripePaymentIntentId: invoice.payment_intent,
                    description: `Subscription payment: ${subscription.planType}`
                });
            }
        }
    }
    // Handle failed invoice payment
    static async handleInvoicePaymentFailed(invoice) {
        if (invoice.subscription) {
            const subscription = await Subscription_1.default.findOne({
                stripeSubscriptionId: invoice.subscription
            });
            if (subscription) {
                subscription.status = types_1.SubscriptionStatus.PAST_DUE;
                await subscription.save();
                console.log(`Subscription ${subscription._id} marked as past_due`);
            }
        }
    }
    // Handle charge refund
    static async handleChargeRefunded(charge) {
        if (charge.payment_intent) {
            const payment = await Payment_1.Payment.findOne({
                stripePaymentIntentId: charge.payment_intent
            });
            if (payment) {
                payment.status = types_1.PaymentStatus.REFUNDED;
                await payment.save();
                console.log(`Payment ${payment._id} refunded`);
            }
        }
    }
}
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhookController.js.map