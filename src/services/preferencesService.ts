import userPreferencesRepository from '../repositories/UserPreferencesRepository';
import { IUserPreferences } from '../types';

export class PreferencesService {
  /**
   * Get user preferences, create default if none exist
   */
  async getPreferences(userId: string): Promise<IUserPreferences> {
    let preferences = await userPreferencesRepository.findByUserId(userId);

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await userPreferencesRepository.create({
        userId,
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      } as any);
    }

    return preferences!;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<IUserPreferences>
  ): Promise<IUserPreferences> {
    let preferences = await userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      // Create new preferences if none exist
      preferences = await userPreferencesRepository.create({
        userId,
        studyReminders: updates.studyReminders ?? true,
        language: updates.language ?? 'en',
        timezone: updates.timezone ?? 'UTC',
        emailNotifications: updates.emailNotifications ?? true,
        pushNotifications: updates.pushNotifications ?? true,
        smsNotifications: updates.smsNotifications ?? false,
        sessionReminders: updates.sessionReminders ?? true,
        progressReports: updates.progressReports ?? true,
        weeklyReport: updates.weeklyReport ?? true,
      } as any);
    } else {
      // Update existing preferences
      const updatedPreferences = await userPreferencesRepository.updateByUserId(userId, updates);
      if (!updatedPreferences) {
        throw new Error('Failed to update preferences');
      }
      preferences = updatedPreferences;
    }

    return preferences;
  }

  /**
   * Reset preferences to default
   */
  async resetPreferences(userId: string): Promise<IUserPreferences> {
    const preferences = await userPreferencesRepository.updateByUserId(userId, {
      studyReminders: true,
      darkMode: false,
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      sessionReminders: true,
      progressReports: true,
      weeklyReport: true,
    } as any);

    if (!preferences) {
      // Create if doesn't exist
      return await userPreferencesRepository.create({
        userId,
        studyReminders: true,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      } as any);
    }

    return preferences;
  }
}

export default new PreferencesService();
