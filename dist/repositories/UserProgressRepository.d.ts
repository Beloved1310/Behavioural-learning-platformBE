import { IUserProgress } from '../types';
import { BaseRepository } from './BaseRepository';
declare class UserProgressRepository extends BaseRepository<IUserProgress> {
    constructor();
    findByUser(userId: string): Promise<IUserProgress[]>;
    findByUserAndSubject(userId: string, subject: string): Promise<IUserProgress | null>;
}
export declare const userProgressRepository: UserProgressRepository;
export default userProgressRepository;
//# sourceMappingURL=UserProgressRepository.d.ts.map