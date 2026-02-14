export declare class PaymentService {
    static getPaymentHistory(userId: string, page: number, limit: number, status?: string): Promise<{
        payments: {
            id: any;
            amount: number;
            currency: any;
            status: any;
            description: any;
            date: any;
            session: any;
        }[];
        pagination: {
            total: any;
            page: number;
            pages: number;
        };
    }>;
    static getPaymentStats(userId: string): Promise<{
        totalSpent: number;
        pendingAmount: number;
        totalTransactions: number;
        completedTransactions: number;
        failedTransactions: number;
    }>;
    static createPaymentIntent(userId: string, amount: number, currency: string, description: string | undefined, sessionId: string | undefined): Promise<{
        paymentIntentId: string;
        clientSecret: string | null;
        paymentId: any;
    }>;
    static confirmPayment(paymentIntentId: string): Promise<{
        success: boolean;
        status: any;
        payment: {
            id: any;
            amount: number;
            currency: any;
            status: any;
        };
    }>;
    static getSubscription(userId: string): Promise<{
        subscription: null;
    } | {
        subscription: {
            id: any;
            planType: any;
            status: any;
            billingCycle: any;
            amount: number;
            currency: any;
            currentPeriodStart: any;
            currentPeriodEnd: any;
            cancelAtPeriodEnd: any;
            isActive: any;
            isInTrial: any;
            daysUntilRenewal: number;
        };
    }>;
    static createSubscription(userId: string, planType: string, billingCycle: string, paymentMethodId: string | undefined, trialDays: number | undefined): Promise<{
        subscription: {
            id: any;
            planType: any;
            status: any;
            billingCycle: any;
            amount: number;
            currentPeriodEnd: any;
            isInTrial: any;
        };
    }>;
    static updateSubscription(userId: string, planType: string | undefined, billingCycle: string | undefined): Promise<{
        subscription: {
            id: any;
            planType: any;
            billingCycle: any;
            amount: number;
            status: any;
        };
    }>;
    static cancelSubscription(userId: string, immediate: boolean): Promise<{
        success: boolean;
        message: string;
        subscription: {
            id: any;
            status: any;
            cancelAtPeriodEnd: any;
            currentPeriodEnd: any;
        };
    }>;
    static getPaymentMethods(userId: string): Promise<{
        id: any;
        type: any;
        isDefault: any;
        maskedNumber: any;
        cardBrand: any;
        cardExpMonth: any;
        cardExpYear: any;
        bankName: any;
        createdAt: any;
    }[]>;
    static addPaymentMethod(userId: string, stripePaymentMethodId: string, isDefault: boolean): Promise<{
        paymentMethod: {
            id: any;
            type: any;
            isDefault: any;
            maskedNumber: any;
            cardBrand: any;
        };
    }>;
    static deletePaymentMethod(userId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    static setDefaultPaymentMethod(userId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    static requestRefund(userId: string, paymentId: string, reason: string): Promise<{
        refund: {
            id: any;
            amount: number;
            reason: any;
            status: any;
            createdAt: any;
        };
    }>;
    static getRefundRequests(userId: string): Promise<{
        id: any;
        amount: number;
        reason: any;
        status: any;
        payment: any;
        adminNotes: any;
        createdAt: any;
        processedAt: any;
    }[]>;
    static processRefund(userId: string, id: string, status: string, adminNotes: string | undefined): Promise<{
        success: boolean;
        refund: {
            id: any;
            status: any;
            adminNotes: any;
            processedAt: any;
        };
    }>;
}
export default PaymentService;
//# sourceMappingURL=paymentService.d.ts.map