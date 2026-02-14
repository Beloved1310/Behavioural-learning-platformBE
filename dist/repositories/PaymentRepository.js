"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = void 0;
const mongoose_1 = require("mongoose");
const Payment_1 = require("../models/Payment");
const BaseRepository_1 = require("./BaseRepository");
class PaymentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Payment_1.Payment);
    }
    async findUserPayments(userId, page, limit, status) {
        const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
        if (status)
            filter.status = status;
        const skip = (page - 1) * limit;
        const payments = await Payment_1.Payment
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('sessionId', 'title subject');
        const total = await Payment_1.Payment.countDocuments(filter);
        return { payments, total };
    }
    async findUserPaymentsForStats(userId) {
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId) });
    }
    async findByStripePaymentIntentId(stripePaymentIntentId) {
        return this.findOne({ stripePaymentIntentId });
    }
    async findByPaymentIdAndUser(paymentId, userId) {
        return this.findOne({ _id: new mongoose_1.Types.ObjectId(paymentId), userId: new mongoose_1.Types.ObjectId(userId) });
    }
}
exports.paymentRepository = new PaymentRepository();
exports.default = exports.paymentRepository;
//# sourceMappingURL=PaymentRepository.js.map