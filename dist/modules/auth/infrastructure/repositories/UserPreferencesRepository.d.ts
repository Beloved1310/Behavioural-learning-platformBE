import { IUserPreferences } from '../types';
import { BaseRepository } from './BaseRepository';
/**
 * UserPreferences Repository
 * Handles database operations for user preferences
 */
declare class UserPreferencesRepository extends BaseRepository<IUserPreferences> {
    constructor();
    /**
     * Find preferences by user ID
     */
    findByUserId(userId: string): Promise<IUserPreferences | null>;
    /**
     * Update preferences by user ID
     */
    updateByUserId(userId: string, updates: Partial<IUserPreferences>): Promise<IUserPreferences | null>;
    /**
     * Delete preferences by user ID
     */
    deleteByUserId(userId: string): Promise<IUserPreferences | null>;
}
export declare const userPreferencesRepository: UserPreferencesRepository;
export default userPreferencesRepository;
//# sourceMappingURL=UserPreferencesRepository.d.ts.map