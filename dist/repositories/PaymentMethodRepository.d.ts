import { IPaymentMethod } from '../types/subscription';
import { BaseRepository } from './BaseRepository';
declare class PaymentMethodRepository extends BaseRepository<IPaymentMethod> {
    constructor();
    findActiveByUserId(userId: string): Promise<any>;
    findByIdAndUserId(id: string, userId: string): Promise<IPaymentMethod | null>;
    removeDefaultForUser(userId: string): Promise<any>;
}
export declare const paymentMethodRepository: PaymentMethodRepository;
export default paymentMethodRepository;
//# sourceMappingURL=PaymentMethodRepository.d.ts.map