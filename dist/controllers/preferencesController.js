"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const preferencesService_1 = __importDefault(require("../services/preferencesService"));
class PreferencesController {
}
exports.PreferencesController = PreferencesController;
_a = PreferencesController;
// Get user preferences
PreferencesController.getPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const preferences = await preferencesService_1.default.getPreferences(userId);
    res.json({
        preferences: {
            id: preferences._id.toString(),
            userId: preferences.userId.toString(),
            studyReminders: preferences.studyReminders,
            language: preferences.language,
            timezone: preferences.timezone,
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
            smsNotifications: preferences.smsNotifications,
            sessionReminders: preferences.sessionReminders,
            progressReports: preferences.progressReports,
            weeklyReport: preferences.weeklyReport,
            createdAt: preferences.createdAt,
            updatedAt: preferences.updatedAt,
        },
    });
});
// Update user preferences
PreferencesController.updatePreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const preferences = await preferencesService_1.default.updatePreferences(userId, req.body);
    res.json({
        message: 'Preferences updated successfully',
        preferences: {
            id: preferences._id.toString(),
            userId: preferences.userId.toString(),
            studyReminders: preferences.studyReminders,
            language: preferences.language,
            timezone: preferences.timezone,
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
            smsNotifications: preferences.smsNotifications,
            sessionReminders: preferences.sessionReminders,
            progressReports: preferences.progressReports,
            weeklyReport: preferences.weeklyReport,
            createdAt: preferences.createdAt,
            updatedAt: preferences.updatedAt,
        },
    });
});
// Reset preferences to default
PreferencesController.resetPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const preferences = await preferencesService_1.default.resetPreferences(userId);
    res.json({
        message: 'Preferences reset to default',
        preferences: {
            id: preferences._id.toString(),
            userId: preferences.userId.toString(),
            studyReminders: preferences.studyReminders,
            language: preferences.language,
            timezone: preferences.timezone,
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
            smsNotifications: preferences.smsNotifications,
            sessionReminders: preferences.sessionReminders,
            progressReports: preferences.progressReports,
            weeklyReport: preferences.weeklyReport,
            createdAt: preferences.createdAt,
            updatedAt: preferences.updatedAt,
        },
    });
});
//# sourceMappingURL=preferencesController.js.map