import { IPayment } from '../types';
import { BaseRepository } from './BaseRepository';
declare class PaymentRepository extends BaseRepository<IPayment> {
    constructor();
    findUserPayments(userId: string, page: number, limit: number, status?: string): Promise<{
        payments: any;
        total: any;
    }>;
    findUserPaymentsForStats(userId: string): Promise<IPayment[]>;
    findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<IPayment | null>;
    findByPaymentIdAndUser(paymentId: string, userId: string): Promise<IPayment | null>;
}
export declare const paymentRepository: PaymentRepository;
export default paymentRepository;
//# sourceMappingURL=PaymentRepository.d.ts.map