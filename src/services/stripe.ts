import Stripe from 'stripe';
import config from '../config';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2025-07-30.basil'
});

// Helper function to handle Stripe errors
function handleStripeError(error: any): never {
  if (error instanceof Stripe.errors.StripeError) {
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

export class StripeService {
  // Create a customer
  static async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata: {
          platform: 'behavioral-learning'
        }
      });
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Create payment intent
  static async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    description: string
  ): Promise<Stripe.PaymentIntent> {
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
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Create subscription
  static async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      };

      if (trialDays) {
        subscriptionParams.trial_period_days = trialDays;
      }

      return await stripe.subscriptions.create(subscriptionParams);
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Update subscription
  static async updateSubscription(
    subscriptionId: string,
    priceId?: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

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
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Attach payment method to customer
  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Detach payment method
  static async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      return await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Create refund
  static async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundParams.amount = amount;
      }

      if (reason) {
        refundParams.reason = reason;
      }

      return await stripe.refunds.create(refundParams);
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Retrieve payment intent
  static async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Retrieve subscription
  static async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      handleStripeError(error);
    }
  }

  // List customer payment methods
  static async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type
      });
      return paymentMethods.data;
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Create setup intent for saving payment method
  static async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      return await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card']
      });
    } catch (error) {
      handleStripeError(error);
    }
  }

  // Construct webhook event
  static constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export default StripeService;
