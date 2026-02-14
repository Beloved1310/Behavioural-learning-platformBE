import { IUserBadge } from '../types';
import { BaseRepository } from './BaseRepository';
declare class UserBadgeRepository extends BaseRepository<IUserBadge> {
    constructor();
    findForUser(userId: string): Promise<any>;
}
export declare const userBadgeRepository: UserBadgeRepository;
export default userBadgeRepository;
//# sourceMappingURL=UserBadgeRepository.d.ts.map