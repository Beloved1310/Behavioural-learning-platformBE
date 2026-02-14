import { Types } from 'mongoose';
import goalRepository from '../repositories/GoalRepository';
import userRepository from '../repositories/UserRepository';
import badgeRepository from '../repositories/BadgeRepository';
import userBadgeRepository from '../repositories/UserBadgeRepository';
import { BadgeType } from '../types';
import { AppError } from '../middleware/errorHandler';
import notificationService from './notificationService';
import { logger } from '../utils/logger';

export class MilestoneService {
  /**
   * Get upcoming milestones for a user
   */
  async getUpcoming(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const streakCount = (user as any).streakCount || 0;
    const goals = await goalRepository.findByUser(userId, true);

    // Find next milestone for each goal
    const goalMilestones = (goals as any[])
      .map((goal: any) => {
        const progressPercent = (goal.current / goal.target) * 100;
        const milestones = goal.milestones || [];
        const achievedMilestones = goal.achievedMilestones || [];
        const nextMilestone = milestones
          .filter((m: number) => progressPercent < m && !achievedMilestones.includes(m))
          .sort((a: number, b: number) => a - b)[0];

        if (nextMilestone) {
          const targetValue = Math.ceil((goal.target * nextMilestone) / 100);
          return {
            type: 'goal',
            goalId: goal._id.toString(),
            goalTitle: goal.title,
            current: goal.current,
            target: targetValue,
            milestonePercent: nextMilestone,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Streak milestones
    const streakMilestones = [
      { days: 7, current: streakCount },
      { days: 30, current: streakCount },
      { days: 100, current: streakCount },
    ]
      .filter((m) => m.current < m.days)
      .sort((a, b) => a.days - b.days)[0];

    const upcoming = [];
    if (goalMilestones.length > 0) {
      upcoming.push(goalMilestones[0]);
    }
    if (streakMilestones) {
      upcoming.push({
        type: 'streak',
        current: streakMilestones.current,
        target: streakMilestones.days,
      });
    }

    return upcoming[0] || null;
  }

  /**
   * Check and award milestones
   */
  async checkMilestones(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const streakCount = (user as any).streakCount || 0;
    const goals = await goalRepository.findByUser(userId, true);
    const newMilestones: any[] = [];
    const notificationsToSend: Array<{ userId: string; title: string }> = [];

    // Check streak milestones
    const streakMilestones = [7, 30, 100];
    for (const milestone of streakMilestones) {
      if (streakCount >= milestone) {
        // Check if badge already exists
        const existingBadge = await badgeRepository.findOne({
          type: BadgeType.MILESTONE,
          name: `${milestone}-Day Streak`,
        } as any);

        if (existingBadge) {
          const hasBadge = await userBadgeRepository.findOne({
            userId: new Types.ObjectId(userId),
            badgeId: (existingBadge as any)._id,
          } as any);

          if (!hasBadge) {
            const milestoneTitle = `${milestone}-Day Streak`;
            newMilestones.push({
              type: 'streak',
              title: milestoneTitle,
              description: `You've maintained a ${milestone}-day login streak!`,
              icon: '🔥',
              milestone,
            });
            notificationsToSend.push({
              userId,
              title: milestoneTitle,
            });
          }
        }
      }
    }

    // Check goal milestones
    for (const goal of goals as any[]) {
      const progressPercent = (goal.current / goal.target) * 100;
      const milestones = goal.milestones || [];
      const achievedMilestones = goal.achievedMilestones || [];

      const newlyAchieved = milestones.filter((m: number) => {
        return progressPercent >= m && !achievedMilestones.includes(m);
      });

      if (newlyAchieved.length > 0) {
        for (const milestone of newlyAchieved) {
          const milestoneTitle = `${milestone}% Goal Progress - ${goal.title}`;
          newMilestones.push({
            type: 'goal',
            goalId: goal._id.toString(),
            goalTitle: goal.title,
            title: milestoneTitle,
            description: `You've reached ${milestone}% of your "${goal.title}" goal!`,
            icon: '🎯',
            milestone,
          });
          notificationsToSend.push({
            userId,
            title: milestoneTitle,
          });
        }
      }
    }

    // Send notifications for new milestones
    for (const notif of notificationsToSend) {
      await notificationService
        .notifyMilestoneAchieved(notif.userId, notif.title)
        .catch((error) => {
          logger.error('Failed to send milestone notification', error, { userId: notif.userId });
        });
    }

    return {
      newMilestones,
      hasNewMilestones: newMilestones.length > 0,
    };
  }
}

export default new MilestoneService();
