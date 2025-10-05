import { Schema, model } from 'mongoose';
import { IPayment, PaymentStatus } from '../types';

const paymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session'
  },
  amount: {
    type: Number,
    required: true,
    min: 0 // in pence
  },
  currency: {
    type: String,
    default: 'GBP',
    enum: ['GBP', 'USD', 'EUR']
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

// Virtual to populate user details
paymentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  select: 'firstName lastName email'
});

// Virtual to populate session details
paymentSchema.virtual('session', {
  ref: 'Session',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true
});

// Virtual for amount in major currency unit (pounds, dollars, etc.)
paymentSchema.virtual('amountInCurrency').get(function() {
  return this.amount / 100;
});

// Instance method to format amount as currency
paymentSchema.methods.formatAmount = function() {
  const amount = this.amount / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: this.currency
  }).format(amount);
};

// Static method to get user's payment history
paymentSchema.statics.getUserPayments = function(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .populate('session', 'title scheduledAt tutorId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(startDate?: Date, endDate?: Date) {
  const matchQuery: any = { status: PaymentStatus.COMPLETED };
  
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = startDate;
    if (endDate) matchQuery.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
};

export const Payment = model<IPayment>('Payment', paymentSchema);