"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesController = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
class PreferencesController {
    // Get user preferences
    static async getPreferences(req, res) {
        try {
            const userId = req.user.id;
            let preferences = await models_1.UserPreferences.findOne({ userId });
            // Create default preferences if none exist
            if (!preferences) {
                preferences = await models_1.UserPreferences.create({
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
                    weeklyReport: true
                });
            }
            res.json({
                preferences: {
                    id: preferences._id.toString(),
                    userId: preferences.userId.toString(),
                    studyReminders: preferences.studyReminders,
                    darkMode: preferences.darkMode,
                    language: preferences.language,
                    timezone: preferences.timezone,
                    emailNotifications: preferences.emailNotifications,
                    pushNotifications: preferences.pushNotifications,
                    smsNotifications: preferences.smsNotifications,
                    sessionReminders: preferences.sessionReminders,
                    progressReports: preferences.progressReports,
                    weeklyReport: preferences.weeklyReport,
                    createdAt: preferences.createdAt,
                    updatedAt: preferences.updatedAt
                }
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch preferences', 500);
        }
    }
    // Update user preferences
    static async updatePreferences(req, res) {
        try {
            const userId = req.user.id;
            const { studyReminders, darkMode, language, timezone, emailNotifications, pushNotifications, smsNotifications, sessionReminders, progressReports, weeklyReport } = req.body;
            let preferences = await models_1.UserPreferences.findOne({ userId });
            if (!preferences) {
                // Create new preferences if none exist
                preferences = await models_1.UserPreferences.create({
                    userId,
                    studyReminders: studyReminders ?? true,
                    darkMode: darkMode ?? false,
                    language: language ?? 'en',
                    timezone: timezone ?? 'UTC',
                    emailNotifications: emailNotifications ?? true,
                    pushNotifications: pushNotifications ?? true,
                    smsNotifications: smsNotifications ?? false,
                    sessionReminders: sessionReminders ?? true,
                    progressReports: progressReports ?? true,
                    weeklyReport: weeklyReport ?? true
                });
            }
            else {
                // Update existing preferences
                if (studyReminders !== undefined)
                    preferences.studyReminders = studyReminders;
                if (darkMode !== undefined)
                    preferences.darkMode = darkMode;
                if (language !== undefined)
                    preferences.language = language;
                if (timezone !== undefined)
                    preferences.timezone = timezone;
                if (emailNotifications !== undefined)
                    preferences.emailNotifications = emailNotifications;
                if (pushNotifications !== undefined)
                    preferences.pushNotifications = pushNotifications;
                if (smsNotifications !== undefined)
                    preferences.smsNotifications = smsNotifications;
                if (sessionReminders !== undefined)
                    preferences.sessionReminders = sessionReminders;
                if (progressReports !== undefined)
                    preferences.progressReports = progressReports;
                if (weeklyReport !== undefined)
                    preferences.weeklyReport = weeklyReport;
                await preferences.save();
            }
            res.json({
                message: 'Preferences updated successfully',
                preferences: {
                    id: preferences._id.toString(),
                    userId: preferences.userId.toString(),
                    studyReminders: preferences.studyReminders,
                    darkMode: preferences.darkMode,
                    language: preferences.language,
                    timezone: preferences.timezone,
                    emailNotifications: preferences.emailNotifications,
                    pushNotifications: preferences.pushNotifications,
                    smsNotifications: preferences.smsNotifications,
                    sessionReminders: preferences.sessionReminders,
                    progressReports: preferences.progressReports,
                    weeklyReport: preferences.weeklyReport,
                    createdAt: preferences.createdAt,
                    updatedAt: preferences.updatedAt
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    // Reset preferences to default
    static async resetPreferences(req, res) {
        try {
            const userId = req.user.id;
            const preferences = await models_1.UserPreferences.findOneAndUpdate({ userId }, {
                studyReminders: true,
                darkMode: false,
                language: 'en',
                timezone: 'UTC',
                emailNotifications: true,
                pushNotifications: true,
                smsNotifications: false,
                sessionReminders: true,
                progressReports: true,
                weeklyReport: true
            }, { new: true, upsert: true });
            res.json({
                message: 'Preferences reset to default',
                preferences: {
                    id: preferences._id.toString(),
                    userId: preferences.userId.toString(),
                    studyReminders: preferences.studyReminders,
                    darkMode: preferences.darkMode,
                    language: preferences.language,
                    timezone: preferences.timezone,
                    emailNotifications: preferences.emailNotifications,
                    pushNotifications: preferences.pushNotifications,
                    smsNotifications: preferences.smsNotifications,
                    sessionReminders: preferences.sessionReminders,
                    progressReports: preferences.progressReports,
                    weeklyReport: preferences.weeklyReport,
                    createdAt: preferences.createdAt,
                    updatedAt: preferences.updatedAt
                }
            });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to reset preferences', 500);
        }
    }
}
exports.PreferencesController = PreferencesController;
//# sourceMappingURL=preferencesController.js.map