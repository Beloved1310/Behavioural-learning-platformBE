import { ICustomEvent } from '../types';
import { BaseRepository } from './BaseRepository';
declare class CustomEventRepository extends BaseRepository<ICustomEvent> {
    constructor();
    createEvent(data: Partial<ICustomEvent>): Promise<ICustomEvent>;
    getHistory(userId: string, eventType: string | undefined, limit: number): Promise<ICustomEvent[]>;
    getCounts(userId: string, days: number): Promise<any>;
    getPageViews(userId: string, days: number): Promise<any>;
}
export declare const customEventRepository: CustomEventRepository;
export default customEventRepository;
//# sourceMappingURL=CustomEventRepository.d.ts.map