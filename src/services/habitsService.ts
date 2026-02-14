import { Types } from 'mongoose';
import customEventRepository from '../repositories/CustomEventRepository';
import userRepository from '../repositories/UserRepository';
import { AppError } from '../middleware/errorHandler';

export class HabitsService {
  /**
   * Get habit heatmap data
   */
  async getHeatmap(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all events in the period
    const events = await customEventRepository.find(
      {
        userId: new Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      } as any,
      { sort: { timestamp: -1 } }
    );

    // Group by date
    const activityByDate: { [key: string]: number } = {};
    (events as any[]).forEach((event: any) => {
      const date = new Date(event.timestamp);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
    });

    // Generate heatmap data
    const heatmapData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      const activity = activityByDate[dateKey] || 0;

      // Categorize activity level (0-3)
      let level = 0;
      if (activity >= 5) level = 3;
      else if (activity >= 3) level = 2;
      else if (activity >= 1) level = 1;

      heatmapData.push({
        date: dateKey,
        activity: level,
        count: activity,
      });
    }

    return heatmapData;
  }

  /**
   * Get all active streaks
   */
  async getStreaks(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const loginStreak = (user as any).streakCount || 0;

    // Calculate study streak (consecutive days with session_start events)
    const studyStreak = await this.calculateStreak(userId, 'session_start');

    // Calculate quiz streak (consecutive days with quiz_complete events)
    const quizStreak = await this.calculateStreak(userId, 'quiz_complete');

    return [
      { type: 'login', name: 'Login Streak', days: loginStreak, icon: '🔥' },
      { type: 'study', name: 'Study Streak', days: studyStreak, icon: '📚' },
      { type: 'quiz', name: 'Quiz Streak', days: quizStreak, icon: '🧠' },
    ];
  }

  /**
   * Calculate streak for a specific event type
   */
  private async calculateStreak(userId: string, eventType: string): Promise<number> {
    const events = await customEventRepository.find(
      {
        userId: new Types.ObjectId(userId),
        eventType,
      } as any,
      { sort: { timestamp: -1 } }
    );

    if ((events as any[]).length === 0) return 0;

    // Get unique dates
    const dates = new Set(
      (events as any[]).map((e: any) => {
        const date = new Date(e.timestamp);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    // Calculate streak backwards from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);

    while (dates.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }
}

export default new HabitsService();
