import { IBehavioralData } from '../types';
import { BaseRepository } from './BaseRepository';
declare class BehavioralDataRepository extends BaseRepository<IBehavioralData> {
    constructor();
    findSince(userId: string, startDate: Date): Promise<IBehavioralData[]>;
}
export declare const behavioralDataRepository: BehavioralDataRepository;
export default behavioralDataRepository;
//# sourceMappingURL=BehavioralDataRepository.d.ts.map