import { Request, Response } from 'express';
import { Payment } from '../models/Payment';
import Subscription from '../models/Subscription';
import PaymentMethod from '../models/PaymentMethod';
import RefundRequest from '../models/RefundRequest';
import { User } from '../models/User';
import { StripeService } from '../services/stripe';
import { AppError } from '../middleware/errorHandler';
import { PaymentStatus, SubscriptionStatus, RefundStatus, SubscriptionTier } from '../types';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export class PaymentController {
  // Get user's payment history
  static async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { page = 1, limit = 10, status } = req.query;

      const query: any = { userId };
      if (status) {
        query.status = status;
      }

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('sessionId', 'title subject');

      const total = await Payment.countDocuments(query);

      const formattedPayments = payments.map((payment: any) => ({
        id: payment._id,
        amount: payment.amount / 100, // Convert pence to pounds
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        date: payment.createdAt,
        session: payment.sessionId
      }));

      res.json({
        payments: formattedPayments,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      const err: any = new Error('Failed to fetch payment history');
      err.statusCode = 500;
      throw err;
    }
  }

  // Get payment statistics
  static async getPaymentStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      const payments = await Payment.find({ userId });

      const totalSpent = payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0) / 100;

      const pendingAmount = payments
        .filter((p: any) => p.status === 'pending')
        .reduce((sum: number, p: any) => sum + p.amount, 0) / 100;

      const stats = {
        totalSpent,
        pendingAmount,
        totalTransactions: payments.length,
        completedTransactions: payments.filter((p: any) => p.status === 'completed').length,
        failedTransactions: payments.filter((p: any) => p.status === 'failed').length
      };

      res.json({ stats });
    } catch (error) {
      const err: any = new Error('Failed to fetch payment statistics');
      err.statusCode = 500;
      throw err;
    }
  }

  // Create payment intent
  static async createPaymentIntent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { amount, currency = 'gbp', description, sessionId } = req.body;

      if (!amount || amount <= 0) {
        throw new AppError('Invalid amount', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await StripeService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`
        );
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
      }

      // Create payment intent
      const paymentIntent = await StripeService.createPaymentIntent(
        Math.round(amount * 100), // Convert to pence
        currency,
        stripeCustomerId,
        description || 'Payment'
      );

      // Create payment record
      const payment = await Payment.create({
        userId,
        sessionId,
        amount: Math.round(amount * 100),
        currency,
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        description: description || 'Payment'
      });

      res.json({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create payment intent', 500);
    }
  }

  // Confirm payment
  static async confirmPayment(req: AuthRequest, res: Response) {
    try {
      const { paymentIntentId } = req.body;

      const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);

      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (paymentIntent.status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
      } else if (paymentIntent.status === 'canceled') {
        payment.status = PaymentStatus.CANCELLED;
      } else if (paymentIntent.status === 'requires_payment_method') {
        payment.status = PaymentStatus.FAILED;
      }

      await payment.save();

      res.json({
        success: true,
        status: payment.status,
        payment: {
          id: payment._id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to confirm payment', 500);
    }
  }

  // Get user's subscription
  static async getSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      const subscription = await Subscription.findOne({ userId, status: 'active' });

      if (!subscription) {
        return res.json({ subscription: null });
      }

      // Calculate days until renewal
      const now = new Date();
      const diff = subscription.currentPeriodEnd.getTime() - now.getTime();
      const daysUntilRenewal = Math.ceil(diff / (1000 * 60 * 60 * 24));

      res.json({
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
          daysUntilRenewal
        }
      });
    } catch (error) {
      throw new AppError('Failed to fetch subscription', 500);
    }
  }

  // Create subscription
  static async createSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { planType, billingCycle, paymentMethodId, trialDays } = req.body;

      if (!['basic', 'premium'].includes(planType)) {
        throw new AppError('Invalid plan type', 400);
      }

      if (!['monthly', 'yearly'].includes(billingCycle)) {
        throw new AppError('Invalid billing cycle', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user already has active subscription
      const existingSubscription = await Subscription.findOne({
        userId,
        status: 'active'
      });

      if (existingSubscription) {
        throw new AppError('User already has an active subscription', 400);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await StripeService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`
        );
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
      }

      // Attach payment method if provided
      if (paymentMethodId) {
        await StripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
        await StripeService.setDefaultPaymentMethod(stripeCustomerId, paymentMethodId);
      }

      // Calculate amount based on plan
      const amounts = {
        basic: { monthly: 999, yearly: 9999 },
        premium: { monthly: 1999, yearly: 19999 }
      };

      const amount = amounts[planType as 'basic' | 'premium'][billingCycle as 'monthly' | 'yearly'];

      // Use appropriate Stripe price ID (these should be in config)
      const priceIds: any = {
        basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
        basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
        premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
        premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
      };

      const priceId = priceIds[`${planType}_${billingCycle}`];

      if (!priceId) {
        throw new AppError('Price configuration not found', 500);
      }

      // Create Stripe subscription
      const stripeSubscription = await StripeService.createSubscription(
        stripeCustomerId,
        priceId,
        trialDays
      );

      // Calculate period dates
      const now = new Date();
      const periodEnd = new Date();
      if (billingCycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Create subscription record
      const subscription = await Subscription.create({
        userId,
        planType,
        status: trialDays ? 'trialing' : 'active',
        billingCycle,
        amount,
        currency: 'gbp',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId,
        trialStart: trialDays ? now : undefined,
        trialEnd: trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined
      });

      // Update user subscription tier
      user.subscriptionTier = planType.toUpperCase() as SubscriptionTier;
      await user.save();

      res.status(201).json({
        subscription: {
          id: subscription._id,
          planType: subscription.planType,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          amount: subscription.amount / 100,
          currentPeriodEnd: subscription.currentPeriodEnd,
          isInTrial: subscription.isInTrial()
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create subscription', 500);
    }
  }

  // Update subscription
  static async updateSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { planType, billingCycle } = req.body;

      const subscription = await Subscription.findOne({ userId, status: 'active' });

      if (!subscription) {
        throw new AppError('No active subscription found', 404);
      }

      if (planType || billingCycle) {
        const newPlanType = planType || subscription.planType;
        const newBillingCycle = billingCycle || subscription.billingCycle;

        // Calculate new amount
        const amounts = {
          basic: { monthly: 999, yearly: 9999 },
          premium: { monthly: 1999, yearly: 19999 }
        };

        const newAmount = amounts[newPlanType as 'basic' | 'premium'][
          newBillingCycle as 'monthly' | 'yearly'
        ];

        // Get new price ID
        const priceIds: any = {
          basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
          basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
          premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
          premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
        };

        const newPriceId = priceIds[`${newPlanType}_${newBillingCycle}`];

        // Update Stripe subscription
        if (subscription.stripeSubscriptionId) {
          await StripeService.updateSubscription(subscription.stripeSubscriptionId, newPriceId);
        }

        subscription.planType = newPlanType;
        subscription.billingCycle = newBillingCycle;
        subscription.amount = newAmount;
      }

      await subscription.save();

      // Update user tier
      const user = await User.findById(userId);
      if (user) {
        user.subscriptionTier = subscription.planType.toUpperCase() as SubscriptionTier;
        await user.save();
      }

      res.json({
        subscription: {
          id: subscription._id,
          planType: subscription.planType,
          billingCycle: subscription.billingCycle,
          amount: subscription.amount / 100,
          status: subscription.status
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update subscription', 500);
    }
  }

  // Cancel subscription
  static async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { immediate = false } = req.body;

      const subscription = await Subscription.findOne({ userId, status: 'active' });

      if (!subscription) {
        throw new AppError('No active subscription found', 404);
      }

      if (immediate) {
        // Cancel immediately
        if (subscription.stripeSubscriptionId) {
          await StripeService.cancelSubscription(subscription.stripeSubscriptionId);
        }
        subscription.status = SubscriptionStatus.CANCELLED as any;
        subscription.cancelledAt = new Date();
      } else {
        // Cancel at period end
        if (subscription.stripeSubscriptionId) {
          await StripeService.updateSubscription(
            subscription.stripeSubscriptionId,
            undefined,
            true
          );
        }
        subscription.cancelAtPeriodEnd = true;
      }

      await subscription.save();

      res.json({
        success: true,
        message: immediate
          ? 'Subscription cancelled immediately'
          : 'Subscription will cancel at period end',
        subscription: {
          id: subscription._id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to cancel subscription', 500);
    }
  }

  // Get payment methods
  static async getPaymentMethods(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      const paymentMethods = await PaymentMethod.find({ userId, isActive: true }).sort({
        isDefault: -1,
        createdAt: -1
      });

      const formattedMethods = paymentMethods.map(method => ({
        id: method._id,
        type: method.type,
        isDefault: method.isDefault,
        maskedNumber: method.getMaskedNumber(),
        cardBrand: method.cardBrand,
        cardExpMonth: method.cardExpMonth,
        cardExpYear: method.cardExpYear,
        bankName: method.bankName,
        createdAt: method.createdAt
      }));

      res.json({ paymentMethods: formattedMethods });
    } catch (error) {
      throw new AppError('Failed to fetch payment methods', 500);
    }
  }

  // Add payment method
  static async addPaymentMethod(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { stripePaymentMethodId, isDefault = false } = req.body;

      if (!stripePaymentMethodId) {
        throw new AppError('Payment method ID is required', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await StripeService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`
        );
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
      }

      // Attach payment method to customer
      const stripePaymentMethod = await StripeService.attachPaymentMethod(
        stripePaymentMethodId,
        stripeCustomerId
      );

      // Create payment method record
      const paymentMethodData: any = {
        userId,
        type: stripePaymentMethod.type === 'card' ? 'card' : 'bank_account',
        stripePaymentMethodId,
        stripeCustomerId,
        isDefault
      };

      if (stripePaymentMethod.card) {
        paymentMethodData.cardLast4 = stripePaymentMethod.card.last4;
        paymentMethodData.cardBrand = stripePaymentMethod.card.brand;
        paymentMethodData.cardExpMonth = stripePaymentMethod.card.exp_month;
        paymentMethodData.cardExpYear = stripePaymentMethod.card.exp_year;
      }

      // If this should be default, remove default from other payment methods
      if (isDefault) {
        await PaymentMethod.updateMany(
          { userId, _id: { $ne: null } },
          { isDefault: false }
        );
      }

      const paymentMethod = await PaymentMethod.create(paymentMethodData);

      if (isDefault) {
        await StripeService.setDefaultPaymentMethod(stripeCustomerId, stripePaymentMethodId);
      }

      res.status(201).json({
        paymentMethod: {
          id: paymentMethod._id,
          type: paymentMethod.type,
          isDefault: paymentMethod.isDefault,
          maskedNumber: paymentMethod.getMaskedNumber(),
          cardBrand: paymentMethod.cardBrand
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to add payment method', 500);
    }
  }

  // Delete payment method
  static async deletePaymentMethod(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      const paymentMethod = await PaymentMethod.findOne({ _id: id, userId });

      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      // Detach from Stripe
      if (paymentMethod.stripePaymentMethodId) {
        await StripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);
      }

      paymentMethod.isActive = false;
      await paymentMethod.save();

      res.json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete payment method', 500);
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      const paymentMethod = await PaymentMethod.findOne({ _id: id, userId });

      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      // Update default in database (pre-save hook handles removing default from others)
      paymentMethod.isDefault = true;
      await paymentMethod.save();

      // Update in Stripe
      if (paymentMethod.stripeCustomerId && paymentMethod.stripePaymentMethodId) {
        await StripeService.setDefaultPaymentMethod(
          paymentMethod.stripeCustomerId,
          paymentMethod.stripePaymentMethodId
        );
      }

      res.json({
        success: true,
        message: 'Default payment method updated'
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to set default payment method', 500);
    }
  }

  // Request refund
  static async requestRefund(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { paymentId, reason } = req.body;

      if (!paymentId || !reason) {
        throw new AppError('Payment ID and reason are required', 400);
      }

      const payment = await Payment.findOne({ _id: paymentId, userId });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== 'completed') {
        throw new AppError('Only completed payments can be refunded', 400);
      }

      // Check if refund already requested
      const existingRefund = await RefundRequest.findOne({ paymentId });
      if (existingRefund) {
        throw new AppError('Refund already requested for this payment', 400);
      }

      // Create refund request
      const refundRequest = await RefundRequest.create({
        paymentId,
        userId,
        amount: payment.amount,
        reason,
        status: 'pending'
      });

      res.status(201).json({
        refund: {
          id: refundRequest._id,
          amount: refundRequest.amount / 100,
          reason: refundRequest.reason,
          status: refundRequest.status,
          createdAt: refundRequest.createdAt
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to request refund', 500);
    }
  }

  // Get refund requests
  static async getRefundRequests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      const refunds = await RefundRequest.find({ userId })
        .populate('paymentId', 'amount description createdAt')
        .sort({ createdAt: -1 });

      const formattedRefunds = refunds.map(refund => ({
        id: refund._id,
        amount: refund.amount / 100,
        reason: refund.reason,
        status: refund.status,
        payment: refund.paymentId,
        adminNotes: refund.adminNotes,
        createdAt: refund.createdAt,
        processedAt: refund.processedAt
      }));

      res.json({ refunds: formattedRefunds });
    } catch (error) {
      throw new AppError('Failed to fetch refund requests', 500);
    }
  }

  // Process refund (Admin only)
  static async processRefund(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      // Check if user is admin
      const user = await User.findById(userId);
      if (user?.role !== 'ADMIN') {
        throw new AppError('Unauthorized', 403);
      }

      if (!['approved', 'rejected'].includes(status)) {
        throw new AppError('Invalid status', 400);
      }

      const refundRequest = await RefundRequest.findById(id).populate('paymentId');

      if (!refundRequest) {
        throw new AppError('Refund request not found', 404);
      }

      if (refundRequest.status !== 'pending') {
        throw new AppError('Refund request already processed', 400);
      }

      if (status === 'approved') {
        // Process refund in Stripe
        const payment = refundRequest.paymentId as any;
        if (payment.stripePaymentIntentId) {
          const stripeRefund = await StripeService.createRefund(
            payment.stripePaymentIntentId,
            refundRequest.amount
          );
          refundRequest.stripeRefundId = stripeRefund.id;
        }

        // Update payment status
        payment.status = PaymentStatus.REFUNDED;
        await payment.save();

        refundRequest.status = RefundStatus.PROCESSED as any;
      } else {
        refundRequest.status = RefundStatus.REJECTED as any;
      }

      refundRequest.adminNotes = adminNotes;
      refundRequest.processedAt = new Date();
      refundRequest.processedBy = userId as any;

      await refundRequest.save();

      res.json({
        success: true,
        refund: {
          id: refundRequest._id,
          status: refundRequest.status,
          adminNotes: refundRequest.adminNotes,
          processedAt: refundRequest.processedAt
        }
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to process refund', 500);
    }
  }
}
