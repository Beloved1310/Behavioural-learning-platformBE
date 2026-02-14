import { Request, Response } from 'express';
export declare class WebhookController {
    static handleStripeWebhook(req: Request, res: Response): Promise<void>;
    private static handlePaymentIntentSucceeded;
    private static handlePaymentIntentFailed;
    private static handleSubscriptionUpdated;
    private static handleSubscriptionDeleted;
    private static handleInvoicePaymentSucceeded;
    private static handleInvoicePaymentFailed;
    private static handleChargeRefunded;
}
//# sourceMappingURL=webhookController.d.ts.map