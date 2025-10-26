"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const refundRequestSchema = new mongoose_1.Schema({
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processed'],
        default: 'pending'
    },
    adminNotes: {
        type: String
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    stripeRefundId: {
        type: String
    }
}, {
    timestamps: true
});
// Index for efficient queries
refundRequestSchema.index({ userId: 1 });
refundRequestSchema.index({ paymentId: 1 });
refundRequestSchema.index({ status: 1 });
const RefundRequest = (0, mongoose_1.model)('RefundRequest', refundRequestSchema);
exports.default = RefundRequest;
//# sourceMappingURL=RefundRequest.js.map