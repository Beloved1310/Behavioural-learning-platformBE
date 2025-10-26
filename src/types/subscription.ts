import { Document, Types } from 'mongoose';
import { SubscriptionStatus, PaymentMethodType, RefundStatus } from './index';

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planType: 'basic' | 'premium';
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive(): boolean;
  isInTrial(): boolean;
}

export interface IPaymentMethod extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: PaymentMethodType;
  isDefault: boolean;
  // Card details
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  // Bank account
  bankName?: string;
  accountLast4?: string;
  // PayPal
  paypalEmail?: string;
  // Stripe
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getMaskedNumber(): string;
}

export interface IRefundRequest extends Document {
  _id: Types.ObjectId;
  paymentId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  reason: string;
  status: RefundStatus;
  adminNotes?: string;
  processedAt?: Date;
  processedBy?: Types.ObjectId;
  stripeRefundId?: string;
  createdAt: Date;
  updatedAt: Date;
}
