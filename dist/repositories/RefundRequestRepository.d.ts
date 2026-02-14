import { IRefundRequest } from '../types/subscription';
import { BaseRepository } from './BaseRepository';
declare class RefundRequestRepository extends BaseRepository<IRefundRequest> {
    constructor();
    findByUserId(userId: string): Promise<any>;
    findByPaymentId(paymentId: string): Promise<IRefundRequest | null>;
    findByIdWithPayment(id: string): Promise<any>;
}
export declare const refundRequestRepository: RefundRequestRepository;
export default refundRequestRepository;
//# sourceMappingURL=RefundRequestRepository.d.ts.map