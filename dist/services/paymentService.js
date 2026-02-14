"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const mongoose_1 = require("mongoose");
const PaymentRepository_1 = __importDefault(require("../repositories/PaymentRepository"));
const SubscriptionRepository_1 = __importDefault(require("../repositories/SubscriptionRepository"));
const PaymentMethodRepository_1 = __importDefault(require("../repositories/PaymentMethodRepository"));
const RefundRequestRepository_1 = __importDefault(require("../repositories/RefundRequestRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const stripe_1 = require("./stripe");
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../types");
class PaymentService {
    // Payment History
    static async getPaymentHistory(userId, page, limit, status) {
        const { payments, total } = await PaymentRepository_1.default.findUserPayments(userId, page, limit, status);
        const formatted = payments.map((payment) => ({
            id: payment._id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            date: payment.createdAt,
            session: payment.sessionId,
        }));
        return {
            payments: formatted,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        };
    }
    static async getPaymentStats(userId) {
        const payments = await PaymentRepository_1.default.findUserPaymentsForStats(userId);
        const totalSpent = payments
            .filter((p) => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0) / 100;
        const pendingAmount = payments
            .filter((p) => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0) / 100;
        return {
            totalSpent,
            pendingAmount,
            totalTransactions: payments.length,
            completedTransactions: payments.filter((p) => p.status === 'completed').length,
            failedTransactions: payments.filter((p) => p.status === 'failed').length,
        };
    }
    // Payment Intents
    static async createPaymentIntent(userId, amount, currency, description, sessionId) {
        if (!amount || amount <= 0)
            throw new errorHandler_1.AppError('Invalid amount', 400);
        const user = await UserRepository_1.default.findById(userId);
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe_1.StripeService.createCustomer(user.email, `${user.firstName} ${user.lastName}`);
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }
        const paymentIntent = await stripe_1.StripeService.createPaymentIntent(Math.round(amount * 100), currency, stripeCustomerId, description || 'Payment');
        const payment = await PaymentRepository_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            sessionId: sessionId ? new mongoose_1.Types.ObjectId(sessionId) : undefined,
            amount: Math.round(amount * 100),
            currency: currency,
            status: 'pending',
            stripePaymentIntentId: paymentIntent.id,
            description: (description || 'Payment'),
        });
        return {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            paymentId: payment._id,
        };
    }
    static async confirmPayment(paymentIntentId) {
        const paymentIntent = await stripe_1.StripeService.retrievePaymentIntent(paymentIntentId);
        const payment = await PaymentRepository_1.default.findByStripePaymentIntentId(paymentIntentId);
        if (!payment)
            throw new errorHandler_1.AppError('Payment not found', 404);
        if (paymentIntent.status === 'succeeded') {
            payment.status = types_1.PaymentStatus.COMPLETED;
        }
        else if (paymentIntent.status === 'canceled') {
            payment.status = types_1.PaymentStatus.CANCELLED;
        }
        else if (paymentIntent.status === 'requires_payment_method') {
            payment.status = types_1.PaymentStatus.FAILED;
        }
        await payment.save();
        return {
            success: true,
            status: payment.status,
            payment: {
                id: payment._id,
                amount: payment.amount / 100,
                currency: payment.currency,
                status: payment.status,
            },
        };
    }
    // Subscriptions
    static async getSubscription(userId) {
        const subscription = await SubscriptionRepository_1.default.findActiveByUserId(userId);
        if (!subscription)
            return { subscription: null };
        const now = new Date();
        const diff = subscription.currentPeriodEnd.getTime() - now.getTime();
        const daysUntilRenewal = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return {
            subscription: {
                id: subscription._id,
                planType: subscription.planType,
                status: subscription.status,
                billingCycle: subscription.billingCycle,
                amount: subscription.amount / 100,
                currency: subscription.currency,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                isActive: subscription.isActive(),
                isInTrial: subscription.isInTrial(),
                daysUntilRenewal,
            },
        };
    }
    static async createSubscription(userId, planType, billingCycle, paymentMethodId, trialDays) {
        if (!['basic', 'premium'].includes(planType))
            throw new errorHandler_1.AppError('Invalid plan type', 400);
        if (!['monthly', 'yearly'].includes(billingCycle))
            throw new errorHandler_1.AppError('Invalid billing cycle', 400);
        const user = await UserRepository_1.default.findById(userId);
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const existing = await SubscriptionRepository_1.default.findActiveByUserId(userId);
        if (existing)
            throw new errorHandler_1.AppError('User already has an active subscription', 400);
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe_1.StripeService.createCustomer(user.email, `${user.firstName} ${user.lastName}`);
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }
        if (paymentMethodId) {
            await stripe_1.StripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
            await stripe_1.StripeService.setDefaultPaymentMethod(stripeCustomerId, paymentMethodId);
        }
        const amounts = {
            basic: { monthly: 999, yearly: 9999 },
            premium: { monthly: 1999, yearly: 19999 },
        };
        const amount = amounts[planType][billingCycle];
        const priceIds = {
            basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
            basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
            premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
            premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
        };
        const priceId = priceIds[`${planType}_${billingCycle}`];
        if (!priceId)
            throw new errorHandler_1.AppError('Price configuration not found', 500);
        const stripeSubscription = await stripe_1.StripeService.createSubscription(stripeCustomerId, priceId, trialDays);
        const now = new Date();
        const periodEnd = new Date();
        if (billingCycle === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }
        const subscription = await SubscriptionRepository_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            planType: planType,
            status: (trialDays ? 'trialing' : 'active'),
            billingCycle: billingCycle,
            amount: amount,
            currency: 'gbp',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: stripeCustomerId,
            trialStart: trialDays ? now : undefined,
            trialEnd: trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined,
        });
        user.subscriptionTier = planType.toUpperCase();
        await user.save();
        return {
            subscription: {
                id: subscription._id,
                planType: subscription.planType,
                status: subscription.status,
                billingCycle: subscription.billingCycle,
                amount: subscription.amount / 100,
                currentPeriodEnd: subscription.currentPeriodEnd,
                isInTrial: subscription.isInTrial(),
            },
        };
    }
    static async updateSubscription(userId, planType, billingCycle) {
        const subscription = await SubscriptionRepository_1.default.findActiveByUserId(userId);
        if (!subscription)
            throw new errorHandler_1.AppError('No active subscription found', 404);
        if (planType || billingCycle) {
            const newPlanType = planType || subscription.planType;
            const newBillingCycle = billingCycle || subscription.billingCycle;
            const amounts = {
                basic: { monthly: 999, yearly: 9999 },
                premium: { monthly: 1999, yearly: 19999 },
            };
            const newAmount = amounts[newPlanType][newBillingCycle];
            const priceIds = {
                basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
                basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
                premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
                premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
            };
            const newPriceId = priceIds[`${newPlanType}_${newBillingCycle}`];
            if (subscription.stripeSubscriptionId) {
                await stripe_1.StripeService.updateSubscription(subscription.stripeSubscriptionId, newPriceId);
            }
            subscription.planType = newPlanType;
            subscription.billingCycle = newBillingCycle;
            subscription.amount = newAmount;
        }
        await subscription.save();
        const user = await UserRepository_1.default.findById(userId);
        if (user) {
            user.subscriptionTier = subscription.planType.toUpperCase();
            await user.save();
        }
        return {
            subscription: {
                id: subscription._id,
                planType: subscription.planType,
                billingCycle: subscription.billingCycle,
                amount: subscription.amount / 100,
                status: subscription.status,
            },
        };
    }
    static async cancelSubscription(userId, immediate) {
        const subscription = await SubscriptionRepository_1.default.findActiveByUserId(userId);
        if (!subscription)
            throw new errorHandler_1.AppError('No active subscription found', 404);
        if (immediate) {
            if (subscription.stripeSubscriptionId) {
                await stripe_1.StripeService.cancelSubscription(subscription.stripeSubscriptionId);
            }
            subscription.status = types_1.SubscriptionStatus.CANCELLED;
            subscription.cancelledAt = new Date();
        }
        else {
            if (subscription.stripeSubscriptionId) {
                await stripe_1.StripeService.updateSubscription(subscription.stripeSubscriptionId, undefined, true);
            }
            subscription.cancelAtPeriodEnd = true;
        }
        await subscription.save();
        return {
            success: true,
            message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end',
            subscription: {
                id: subscription._id,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                currentPeriodEnd: subscription.currentPeriodEnd,
            },
        };
    }
    // Payment Methods
    static async getPaymentMethods(userId) {
        const methods = await PaymentMethodRepository_1.default.findActiveByUserId(userId);
        return methods.map((method) => ({
            id: method._id,
            type: method.type,
            isDefault: method.isDefault,
            maskedNumber: method.getMaskedNumber(),
            cardBrand: method.cardBrand,
            cardExpMonth: method.cardExpMonth,
            cardExpYear: method.cardExpYear,
            bankName: method.bankName,
            createdAt: method.createdAt,
        }));
    }
    static async addPaymentMethod(userId, stripePaymentMethodId, isDefault) {
        if (!stripePaymentMethodId)
            throw new errorHandler_1.AppError('Payment method ID is required', 400);
        const user = await UserRepository_1.default.findById(userId);
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe_1.StripeService.createCustomer(user.email, `${user.firstName} ${user.lastName}`);
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }
        const stripePaymentMethod = await stripe_1.StripeService.attachPaymentMethod(stripePaymentMethodId, stripeCustomerId);
        const paymentMethodData = {
            userId: new mongoose_1.Types.ObjectId(userId),
            type: (stripePaymentMethod.type === 'card' ? 'card' : 'bank_account'),
            stripePaymentMethodId: stripePaymentMethodId,
            stripeCustomerId: stripeCustomerId,
            isDefault: isDefault,
        };
        if (stripePaymentMethod.card) {
            paymentMethodData.cardLast4 = stripePaymentMethod.card.last4;
            paymentMethodData.cardBrand = stripePaymentMethod.card.brand;
            paymentMethodData.cardExpMonth = stripePaymentMethod.card.exp_month;
            paymentMethodData.cardExpYear = stripePaymentMethod.card.exp_year;
        }
        if (isDefault) {
            await PaymentMethodRepository_1.default.removeDefaultForUser(userId);
        }
        const paymentMethod = await PaymentMethodRepository_1.default.create(paymentMethodData);
        if (isDefault) {
            await stripe_1.StripeService.setDefaultPaymentMethod(stripeCustomerId, stripePaymentMethodId);
        }
        return {
            paymentMethod: {
                id: paymentMethod._id,
                type: paymentMethod.type,
                isDefault: paymentMethod.isDefault,
                maskedNumber: paymentMethod.getMaskedNumber(),
                cardBrand: paymentMethod.cardBrand,
            },
        };
    }
    static async deletePaymentMethod(userId, id) {
        const method = await PaymentMethodRepository_1.default.findByIdAndUserId(id, userId);
        if (!method)
            throw new errorHandler_1.AppError('Payment method not found', 404);
        if (method.stripePaymentMethodId) {
            await stripe_1.StripeService.detachPaymentMethod(method.stripePaymentMethodId);
        }
        method.isActive = false;
        await method.save();
        return { success: true, message: 'Payment method deleted successfully' };
    }
    static async setDefaultPaymentMethod(userId, id) {
        const method = await PaymentMethodRepository_1.default.findByIdAndUserId(id, userId);
        if (!method)
            throw new errorHandler_1.AppError('Payment method not found', 404);
        method.isDefault = true;
        await method.save();
        if (method.stripeCustomerId && method.stripePaymentMethodId) {
            await stripe_1.StripeService.setDefaultPaymentMethod(method.stripeCustomerId, method.stripePaymentMethodId);
        }
        return { success: true, message: 'Default payment method updated' };
    }
    // Refunds
    static async requestRefund(userId, paymentId, reason) {
        if (!paymentId || !reason)
            throw new errorHandler_1.AppError('Payment ID and reason are required', 400);
        const payment = await PaymentRepository_1.default.findByPaymentIdAndUser(paymentId, userId);
        if (!payment)
            throw new errorHandler_1.AppError('Payment not found', 404);
        if (payment.status !== 'completed')
            throw new errorHandler_1.AppError('Only completed payments can be refunded', 400);
        const existing = await RefundRequestRepository_1.default.findByPaymentId(paymentId);
        if (existing)
            throw new errorHandler_1.AppError('Refund already requested for this payment', 400);
        const refundRequest = await RefundRequestRepository_1.default.create({
            paymentId: new mongoose_1.Types.ObjectId(paymentId),
            userId: new mongoose_1.Types.ObjectId(userId),
            amount: payment.amount,
            reason: reason,
            status: 'pending',
        });
        return {
            refund: {
                id: refundRequest._id,
                amount: refundRequest.amount / 100,
                reason: refundRequest.reason,
                status: refundRequest.status,
                createdAt: refundRequest.createdAt,
            },
        };
    }
    static async getRefundRequests(userId) {
        const refunds = await RefundRequestRepository_1.default.findByUserId(userId);
        return refunds.map((refund) => ({
            id: refund._id,
            amount: refund.amount / 100,
            reason: refund.reason,
            status: refund.status,
            payment: refund.paymentId,
            adminNotes: refund.adminNotes,
            createdAt: refund.createdAt,
            processedAt: refund.processedAt,
        }));
    }
    static async processRefund(userId, id, status, adminNotes) {
        const user = await UserRepository_1.default.findById(userId);
        if (user?.role !== 'ADMIN')
            throw new errorHandler_1.AppError('Unauthorized', 403);
        if (!['approved', 'rejected'].includes(status))
            throw new errorHandler_1.AppError('Invalid status', 400);
        const refundRequest = await RefundRequestRepository_1.default.findByIdWithPayment(id);
        if (!refundRequest)
            throw new errorHandler_1.AppError('Refund request not found', 404);
        if (refundRequest.status !== 'pending')
            throw new errorHandler_1.AppError('Refund request already processed', 400);
        if (status === 'approved') {
            const payment = refundRequest.paymentId;
            if (payment.stripePaymentIntentId) {
                const stripeRefund = await stripe_1.StripeService.createRefund(payment.stripePaymentIntentId, refundRequest.amount);
                refundRequest.stripeRefundId = stripeRefund.id;
            }
            payment.status = types_1.PaymentStatus.REFUNDED;
            await payment.save();
            refundRequest.status = types_1.RefundStatus.PROCESSED;
        }
        else {
            refundRequest.status = types_1.RefundStatus.REJECTED;
        }
        refundRequest.adminNotes = adminNotes;
        refundRequest.processedAt = new Date();
        refundRequest.processedBy = new mongoose_1.Types.ObjectId(userId);
        await refundRequest.save();
        return {
            success: true,
            refund: {
                id: refundRequest._id,
                status: refundRequest.status,
                adminNotes: refundRequest.adminNotes,
                processedAt: refundRequest.processedAt,
            },
        };
    }
}
exports.PaymentService = PaymentService;
exports.default = PaymentService;
//# sourceMappingURL=paymentService.js.map