import { FilterQuery } from 'mongoose';
import { UserPreferences } from '../models/UserPreferences';
import { IUserPreferences } from '../types';
import { BaseRepository } from './BaseRepository';

/**
 * UserPreferences Repository
 * Handles database operations for user preferences
 */
class UserPreferencesRepository extends BaseRepository<IUserPreferences> {
  constructor() {
    super(UserPreferences);
  }

  /**
   * Find preferences by user ID
   */
  async findByUserId(userId: string): Promise<IUserPreferences | null> {
    return await this.findOne({ userId } as FilterQuery<IUserPreferences>);
  }

  /**
   * Update preferences by user ID
   */
  async updateByUserId(
    userId: string,
    updates: Partial<IUserPreferences>
  ): Promise<IUserPreferences | null> {
    return await this.updateOne(
      { userId } as FilterQuery<IUserPreferences>,
      updates as any
    );
  }

  /**
   * Delete preferences by user ID
   */
  async deleteByUserId(userId: string): Promise<IUserPreferences | null> {
    return await this.deleteOne({ userId } as FilterQuery<IUserPreferences>);
  }
}

// Export singleton instance
export const userPreferencesRepository = new UserPreferencesRepository();
export default userPreferencesRepository;
