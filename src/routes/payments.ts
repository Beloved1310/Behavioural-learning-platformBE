import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { WebhookController } from '../controllers/webhookController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook endpoint (must be before authenticate middleware and use raw body)
router.post('/webhook/stripe', WebhookController.handleStripeWebhook);

// All other routes require authentication
router.use(authenticate);

// Payment history and statistics
router.get('/payments', PaymentController.getPaymentHistory);
router.get('/payments/stats', PaymentController.getPaymentStats);

// Payment intents
router.post('/payments/intent', PaymentController.createPaymentIntent);
router.post('/payments/confirm', PaymentController.confirmPayment);

// Subscription management
router.get('/subscription', PaymentController.getSubscription);
router.post('/subscription', PaymentController.createSubscription);
router.put('/subscription', PaymentController.updateSubscription);
router.delete('/subscription', PaymentController.cancelSubscription);

// Payment methods
router.get('/payment-methods', PaymentController.getPaymentMethods);
router.post('/payment-methods', PaymentController.addPaymentMethod);
router.delete('/payment-methods/:id', PaymentController.deletePaymentMethod);
router.patch('/payment-methods/:id/default', PaymentController.setDefaultPaymentMethod);

// Refunds
router.post('/refunds', PaymentController.requestRefund);
router.get('/refunds', PaymentController.getRefundRequests);
router.patch('/refunds/:id/process', PaymentController.processRefund);

export default router;
