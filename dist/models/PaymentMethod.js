"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const paymentMethodSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['card', 'bank_account', 'paypal'],
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    // Card details (encrypted or tokenized)
    cardLast4: {
        type: String
    },
    cardBrand: {
        type: String
    },
    cardExpMonth: {
        type: Number
    },
    cardExpYear: {
        type: Number
    },
    // Bank account details
    bankName: {
        type: String
    },
    accountLast4: {
        type: String
    },
    // PayPal
    paypalEmail: {
        type: String
    },
    // Stripe
    stripePaymentMethodId: {
        type: String
    },
    stripeCustomerId: {
        type: String
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Index for efficient queries
paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ isDefault: 1, userId: 1 });
// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await PaymentMethod.updateMany({ userId: this.userId, _id: { $ne: this._id } }, { isDefault: false });
    }
    next();
});
// Get masked card/account number
paymentMethodSchema.methods.getMaskedNumber = function () {
    if (this.type === 'card' && this.cardLast4) {
        return `**** **** **** ${this.cardLast4}`;
    }
    else if (this.type === 'bank_account' && this.accountLast4) {
        return `****${this.accountLast4}`;
    }
    else if (this.type === 'paypal' && this.paypalEmail) {
        return this.paypalEmail;
    }
    return 'N/A';
};
const PaymentMethod = (0, mongoose_1.model)('PaymentMethod', paymentMethodSchema);
exports.default = PaymentMethod;
//# sourceMappingURL=PaymentMethod.js.map