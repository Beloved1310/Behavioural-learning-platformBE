import { ISubscription } from '../types/subscription';
import { BaseRepository } from './BaseRepository';
declare class SubscriptionRepository extends BaseRepository<ISubscription> {
    constructor();
    findActiveByUserId(userId: string): Promise<any>;
    findByUserId(userId: string): Promise<ISubscription[]>;
}
export declare const subscriptionRepository: SubscriptionRepository;
export default subscriptionRepository;
//# sourceMappingURL=SubscriptionRepository.d.ts.map