import { IBadge } from '../types';
import { BaseRepository } from './BaseRepository';
declare class BadgeRepository extends BaseRepository<IBadge> {
    constructor();
    findActive(): Promise<IBadge[]>;
}
export declare const badgeRepository: BadgeRepository;
export default badgeRepository;
//# sourceMappingURL=BadgeRepository.d.ts.map