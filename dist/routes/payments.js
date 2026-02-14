"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const webhookController_1 = require("../controllers/webhookController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Webhook endpoint (must be before authenticate middleware and use raw body)
router.post('/webhook/stripe', webhookController_1.WebhookController.handleStripeWebhook);
// All other routes require authentication
router.use(auth_1.authenticate);
// Payment history and statistics
router.get('/payments', paymentController_1.PaymentController.getPaymentHistory);
router.get('/payments/stats', paymentController_1.PaymentController.getPaymentStats);
// Payment intents
router.post('/payments/intent', paymentController_1.PaymentController.createPaymentIntent);
router.post('/payments/confirm', paymentController_1.PaymentController.confirmPayment);
// Subscription management
router.get('/subscription', paymentController_1.PaymentController.getSubscription);
router.post('/subscription', paymentController_1.PaymentController.createSubscription);
router.put('/subscription', paymentController_1.PaymentController.updateSubscription);
router.delete('/subscription', paymentController_1.PaymentController.cancelSubscription);
// Payment methods
router.get('/payment-methods', paymentController_1.PaymentController.getPaymentMethods);
router.post('/payment-methods', paymentController_1.PaymentController.addPaymentMethod);
router.delete('/payment-methods/:id', paymentController_1.PaymentController.deletePaymentMethod);
router.patch('/payment-methods/:id/default', paymentController_1.PaymentController.setDefaultPaymentMethod);
// Refunds
router.post('/refunds', paymentController_1.PaymentController.requestRefund);
router.get('/refunds', paymentController_1.PaymentController.getRefundRequests);
router.patch('/refunds/:id/process', paymentController_1.PaymentController.processRefund);
exports.default = router;
//# sourceMappingURL=payments.js.map