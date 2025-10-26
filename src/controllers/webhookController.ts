import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from '../services/stripe';
import { Payment } from '../models/Payment';
import Subscription from '../models/Subscription';
import { User } from '../models/User';
import config from '../config';
import { AppError } from '../middleware/errorHandler';
import { PaymentStatus, SubscriptionStatus, SubscriptionTier } from '../types';

export class WebhookController {
  // Handle Stripe webhook events
  static async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new AppError('Missing stripe signature', 400);
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = StripeService.constructWebhookEvent(
        req.body,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      throw new AppError(`Webhook Error: ${err.message}`, 400);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await WebhookController.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await WebhookController.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await WebhookController.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await WebhookController.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await WebhookController.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await WebhookController.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'charge.refunded':
          await WebhookController.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      throw new AppError(`Webhook handler failed: ${error.message}`, 500);
    }
  }

  // Handle successful payment intent
  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (payment) {
      payment.status = PaymentStatus.COMPLETED;
      await payment.save();
      console.log(`Payment ${payment._id} marked as completed`);
    }
  }

  // Handle failed payment intent
  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      await payment.save();
      console.log(`Payment ${payment._id} marked as failed`);
    }
  }

  // Handle subscription updates
  private static async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (subscription) {
      // Update subscription status
      subscription.status = stripeSubscription.status as any;
      subscription.currentPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
      subscription.currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
      subscription.cancelAtPeriodEnd = (stripeSubscription as any).cancel_at_period_end || false;

      // Update trial dates if applicable
      if ((stripeSubscription as any).trial_start && (stripeSubscription as any).trial_end) {
        subscription.trialStart = new Date((stripeSubscription as any).trial_start * 1000);
        subscription.trialEnd = new Date((stripeSubscription as any).trial_end * 1000);
      }

      await subscription.save();
      console.log(`Subscription ${subscription._id} updated`);

      // Update user subscription tier
      const user = await User.findById(subscription.userId);
      if (user && stripeSubscription.status === 'active') {
        user.subscriptionTier = subscription.planType.toUpperCase() as SubscriptionTier;
        await user.save();
      }
    }
  }

  // Handle subscription deletion
  private static async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELLED as any;
      subscription.cancelledAt = new Date();
      await subscription.save();
      console.log(`Subscription ${subscription._id} cancelled`);

      // Update user subscription tier to basic or free
      const user = await User.findById(subscription.userId);
      if (user) {
        user.subscriptionTier = SubscriptionTier.BASIC;
        await user.save();
      }
    }
  }

  // Handle successful invoice payment
  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if ((invoice as any).subscription) {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: (invoice as any).subscription as string
      });

      if (subscription) {
        console.log(`Invoice paid for subscription ${subscription._id}`);
        // Create a payment record for the invoice
        await Payment.create({
          userId: subscription.userId,
          amount: (invoice as any).amount_paid || 0,
          currency: invoice.currency?.toUpperCase() || 'GBP',
          status: PaymentStatus.COMPLETED,
          stripePaymentIntentId: (invoice as any).payment_intent as string,
          description: `Subscription payment: ${subscription.planType}`
        });
      }
    }
  }

  // Handle failed invoice payment
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if ((invoice as any).subscription) {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: (invoice as any).subscription as string
      });

      if (subscription) {
        subscription.status = SubscriptionStatus.PAST_DUE as any;
        await subscription.save();
        console.log(`Subscription ${subscription._id} marked as past_due`);
      }
    }
  }

  // Handle charge refund
  private static async handleChargeRefunded(charge: Stripe.Charge) {
    if ((charge as any).payment_intent) {
      const payment = await Payment.findOne({
        stripePaymentIntentId: (charge as any).payment_intent as string
      });

      if (payment) {
        payment.status = PaymentStatus.REFUNDED;
        await payment.save();
        console.log(`Payment ${payment._id} refunded`);
      }
    }
  }
}
