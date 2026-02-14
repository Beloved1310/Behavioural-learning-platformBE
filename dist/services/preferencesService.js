"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesService = void 0;
const UserPreferencesRepository_1 = __importDefault(require("../repositories/UserPreferencesRepository"));
class PreferencesService {
    /**
     * Get user preferences, create default if none exist
     */
    async getPreferences(userId) {
        let preferences = await UserPreferencesRepository_1.default.findByUserId(userId);
        // Create default preferences if none exist
        if (!preferences) {
            preferences = await UserPreferencesRepository_1.default.create({
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
            });
        }
        return preferences;
    }
    /**
     * Update user preferences
     */
    async updatePreferences(userId, updates) {
        let preferences = await UserPreferencesRepository_1.default.findByUserId(userId);
        if (!preferences) {
            // Create new preferences if none exist
            preferences = await UserPreferencesRepository_1.default.create({
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
            });
        }
        else {
            // Update existing preferences
            const updatedPreferences = await UserPreferencesRepository_1.default.updateByUserId(userId, updates);
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
    async resetPreferences(userId) {
        const preferences = await UserPreferencesRepository_1.default.updateByUserId(userId, {
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
        });
        if (!preferences) {
            // Create if doesn't exist
            return await UserPreferencesRepository_1.default.create({
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
            });
        }
        return preferences;
    }
}
exports.PreferencesService = PreferencesService;
exports.default = new PreferencesService();
//# sourceMappingURL=preferencesService.js.map