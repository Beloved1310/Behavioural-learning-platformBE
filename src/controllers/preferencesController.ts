import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import preferencesService from '../services/preferencesService';

export class PreferencesController {
  // Get user preferences
  static getPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const preferences = await preferencesService.getPreferences(userId);

    res.json({
      preferences: {
        id: (preferences as any)._id.toString(),
        userId: (preferences as any).userId.toString(),
        studyReminders: preferences.studyReminders,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        smsNotifications: preferences.smsNotifications,
        sessionReminders: preferences.sessionReminders,
        progressReports: preferences.progressReports,
        weeklyReport: preferences.weeklyReport,
        createdAt: (preferences as any).createdAt,
        updatedAt: (preferences as any).updatedAt,
      },
    });
  });

  // Update user preferences
  static updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const preferences = await preferencesService.updatePreferences(userId, req.body);

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        id: (preferences as any)._id.toString(),
        userId: (preferences as any).userId.toString(),
        studyReminders: preferences.studyReminders,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        smsNotifications: preferences.smsNotifications,
        sessionReminders: preferences.sessionReminders,
        progressReports: preferences.progressReports,
        weeklyReport: preferences.weeklyReport,
        createdAt: (preferences as any).createdAt,
        updatedAt: (preferences as any).updatedAt,
      },
    });
  });

  // Reset preferences to default
  static resetPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const preferences = await preferencesService.resetPreferences(userId);

    res.json({
      message: 'Preferences reset to default',
      preferences: {
        id: (preferences as any)._id.toString(),
        userId: (preferences as any).userId.toString(),
        studyReminders: preferences.studyReminders,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        smsNotifications: preferences.smsNotifications,
        sessionReminders: preferences.sessionReminders,
        progressReports: preferences.progressReports,
        weeklyReport: preferences.weeklyReport,
        createdAt: (preferences as any).createdAt,
        updatedAt: (preferences as any).updatedAt,
      },
    });
  });
}
