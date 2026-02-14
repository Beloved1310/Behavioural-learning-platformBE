"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const paymentService_1 = require("../services/paymentService");
class PaymentController {
}
exports.PaymentController = PaymentController;
_a = PaymentController;
PaymentController.getPaymentHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;
    const result = await paymentService_1.PaymentService.getPaymentHistory(userId, Number(page), Number(limit), status);
    res.json(result);
});
PaymentController.getPaymentStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const stats = await paymentService_1.PaymentService.getPaymentStats(userId);
    res.json({ stats });
});
PaymentController.createPaymentIntent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { amount, currency = 'gbp', description, sessionId } = req.body;
    const result = await paymentService_1.PaymentService.createPaymentIntent(userId, amount, currency, description, sessionId);
    res.json(result);
});
PaymentController.confirmPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { paymentIntentId } = req.body;
    const result = await paymentService_1.PaymentService.confirmPayment(paymentIntentId);
    res.json(result);
});
PaymentController.getSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const result = await paymentService_1.PaymentService.getSubscription(userId);
    res.json(result);
});
PaymentController.createSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { planType, billingCycle, paymentMethodId, trialDays } = req.body;
    const result = await paymentService_1.PaymentService.createSubscription(userId, planType, billingCycle, paymentMethodId, trialDays);
    res.status(201).json(result);
});
PaymentController.updateSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { planType, billingCycle } = req.body;
    const result = await paymentService_1.PaymentService.updateSubscription(userId, planType, billingCycle);
    res.json(result);
});
PaymentController.cancelSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { immediate = false } = req.body;
    const result = await paymentService_1.PaymentService.cancelSubscription(userId, immediate);
    res.json(result);
});
PaymentController.getPaymentMethods = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const paymentMethods = await paymentService_1.PaymentService.getPaymentMethods(userId);
    res.json({ paymentMethods });
});
PaymentController.addPaymentMethod = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { stripePaymentMethodId, isDefault = false } = req.body;
    const result = await paymentService_1.PaymentService.addPaymentMethod(userId, stripePaymentMethodId, isDefault);
    res.status(201).json(result);
});
PaymentController.deletePaymentMethod = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await paymentService_1.PaymentService.deletePaymentMethod(userId, id);
    res.json(result);
});
PaymentController.setDefaultPaymentMethod = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const result = await paymentService_1.PaymentService.setDefaultPaymentMethod(userId, id);
    res.json(result);
});
PaymentController.requestRefund = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { paymentId, reason } = req.body;
    const result = await paymentService_1.PaymentService.requestRefund(userId, paymentId, reason);
    res.status(201).json(result);
});
PaymentController.getRefundRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const refunds = await paymentService_1.PaymentService.getRefundRequests(userId);
    res.json({ refunds });
});
PaymentController.processRefund = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const result = await paymentService_1.PaymentService.processRefund(userId, id, status, adminNotes);
    res.json(result);
});
//# sourceMappingURL=paymentController.js.map