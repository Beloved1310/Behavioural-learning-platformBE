import { Document, Types } from 'mongoose';
import { SubscriptionStatus, PaymentMethodType } from './index';
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
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    bankName?: string;
    accountLast4?: string;
    paypalEmail?: string;
    stripePaymentMethodId?: string;
    stripeCustomerId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    getMaskedNumber(): string;
}
//# sourceMappingURL=subscription.d.ts.map