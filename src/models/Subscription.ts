import { Schema, model } from 'mongoose';
import { ISubscription } from '../types/subscription';

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    planType: {
      type: String,
      enum: ['basic', 'premium'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'expired', 'trialing'],
      default: 'active'
    } as any,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'GBP'
    },
    currentPeriodStart: {
      type: Date,
      required: true
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    stripeSubscriptionId: {
      type: String
    },
    stripeCustomerId: {
      type: String
    },
    trialStart: {
      type: Date
    },
    trialEnd: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function(): boolean {
  return this.status === 'active' && new Date() < this.currentPeriodEnd;
};

// Check if in trial period
subscriptionSchema.methods.isInTrial = function(): boolean {
  if (!this.trialStart || !this.trialEnd) return false;
  const now = new Date();
  return now >= this.trialStart && now <= this.trialEnd;
};

// Calculate days until renewal or expiry
subscriptionSchema.virtual('daysUntilRenewal').get(function(this: ISubscription) {
  const now = new Date();
  const diff = this.currentPeriodEnd.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

const Subscription = model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;
