import Stripe from 'stripe';
export declare class StripeService {
    static createCustomer(email: string, name: string): Promise<Stripe.Customer>;
    static createPaymentIntent(amount: number, currency: string, customerId: string, description: string): Promise<Stripe.PaymentIntent>;
    static createSubscription(customerId: string, priceId: string, trialDays?: number): Promise<Stripe.Subscription>;
    static updateSubscription(subscriptionId: string, priceId?: string, cancelAtPeriodEnd?: boolean): Promise<Stripe.Subscription>;
    static cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    static attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod>;
    static detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod>;
    static setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer>;
    static createRefund(paymentIntentId: string, amount?: number, reason?: Stripe.RefundCreateParams.Reason): Promise<Stripe.Refund>;
    static retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    static retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    static listPaymentMethods(customerId: string, type?: Stripe.PaymentMethodListParams.Type): Promise<Stripe.PaymentMethod[]>;
    static createSetupIntent(customerId: string): Promise<Stripe.SetupIntent>;
    static constructWebhookEvent(payload: string | Buffer, signature: string, webhookSecret: string): Stripe.Event;
}
export default StripeService;
//# sourceMappingURL=stripe.d.ts.map