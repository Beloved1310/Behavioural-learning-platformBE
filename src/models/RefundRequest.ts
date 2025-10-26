import { Schema, model } from 'mongoose';
import { IRefundRequest } from '../types/subscription';

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
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
    } as any,
    adminNotes: {
      type: String
    },
    processedAt: {
      type: Date
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    stripeRefundId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
refundRequestSchema.index({ userId: 1 });
refundRequestSchema.index({ paymentId: 1 });
refundRequestSchema.index({ status: 1 });

const RefundRequest = model<IRefundRequest>('RefundRequest', refundRequestSchema);

export default RefundRequest;
