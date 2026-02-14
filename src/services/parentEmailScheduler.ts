import cron from 'node-cron';
import { User } from '../models/User';
import { UserRole } from '../types';
import { Types } from 'mongoose';
import goalRepository from '../repositories/GoalRepository';
import weeklyCommitmentRepository from '../repositories/WeeklyCommitmentRepository';
import customEventRepository from '../repositories/CustomEventRepository';
import { sendParentWeeklyProgressEmail } from './emailService';
import { logger } from '../utils/logger';

/**
 * Parent Email Scheduler Service
 * Sends automated weekly progress reports to parents
 */
class ParentEmailScheduler {
  private isRunning = false;

  /**
   * Start the weekly email scheduler
   * Runs every Monday at 9:00 AM
   */
  start(): void {
    if (this.isRunning) {
      logger.info('Parent email scheduler already running');
      return;
    }

    // Schedule weekly emails every Monday at 9:00 AM
    cron.schedule(
      '0 9 * * 1',
      async () => {
        logger.info('Starting weekly parent email job');
        await this.sendWeeklyReports();
      },
      {
        timezone: 'UTC',
      }
    );

    this.isRunning = true;
    logger.info('Weekly email scheduler started (Mondays at 9:00 AM UTC)');
  }

  /**
   * Send weekly progress reports to all parents
   */
  async sendWeeklyReports(): Promise<void> {
    try {
      // Get all parents
      const parents = await User.find({ role: UserRole.PARENT });
      logger.info('Found parents to send reports to', { count: parents.length });

      for (const parent of parents) {
        try {
          // Get all children for this parent
          const children = await User.find({
            parentId: new Types.ObjectId(parent._id),
            role: UserRole.STUDENT,
          });

          if (children.length === 0) {
            console.log(`[ParentEmailScheduler] No children found for parent ${parent.email}`);
            continue;
          }

          // Calculate week start (last Monday)
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Last Monday
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          // Get progress data for all children
          const childrenProgress = await Promise.all(
            children.map(async (child) => {
              const childId = child._id.toString();

              // Get goals progress
              const goals = await goalRepository.findByUser(childId, true);
              const activeGoals = goals.filter((g: any) => g.isActive && g.status !== 'rejected');
              const goalProgress =
                activeGoals.length > 0
                  ? Math.round(
                      activeGoals.reduce((sum: number, g: any) => {
                        const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
                        return sum + progress;
                      }, 0) / activeGoals.length
                    )
                  : 0;

              // Get commitments
              const commitment = await weeklyCommitmentRepository.findCurrentWeek(childId);
              let commitmentsCompleted = 0;
              let commitmentsTotal = 0;
              if (commitment) {
                const commitments = (commitment as any).commitments || [];
                commitmentsTotal = commitments.length;
                commitmentsCompleted = commitments.filter((c: any) => c.completed).length;
              }

              // Calculate consistency (last 7 days)
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

              const events = await customEventRepository.find(
                {
                  userId: new Types.ObjectId(childId),
                  timestamp: { $gte: sevenDaysAgo },
                } as any,
                { limit: 1000 }
              );

              const activeDays = new Set();
              (events as any[]).forEach((event: any) => {
                if (event.timestamp) {
                  const date = new Date(event.timestamp);
                  date.setHours(0, 0, 0, 0);
                  activeDays.add(date.getTime());
                }
              });

              const consistencyScore = Math.round((activeDays.size / 7) * 100);

              // Determine status
              const streakCount = child.streakCount || 0;
              const lastLoginAt = child.lastLoginAt ? new Date(child.lastLoginAt) : null;
              const daysSinceLogin = lastLoginAt
                ? Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
                : 999;

              let status: 'on-track' | 'needs-attention' | 'at-risk' = 'on-track';
              if (streakCount === 0 && daysSinceLogin > 3) {
                status = 'at-risk';
              } else if (
                consistencyScore < 50 ||
                (commitmentsTotal > 0 && commitmentsCompleted / commitmentsTotal < 0.5)
              ) {
                status = 'needs-attention';
              } else if (consistencyScore >= 75 && streakCount >= 3) {
                status = 'on-track';
              }

              return {
                name: `${child.firstName || ''} ${child.lastName || ''}`.trim() || 'Student',
                streak: streakCount,
                goalProgress,
                commitmentsCompleted,
                commitmentsTotal,
                consistencyScore,
                status,
                lastLoginAt: child.lastLoginAt,
              };
            })
          );

          // Send email to parent
          await sendParentWeeklyProgressEmail(parent.email, parent.firstName || 'Parent', {
            weekStart: weekStart.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            weekEnd: weekEnd.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            children: childrenProgress,
          });

          console.log(`[ParentEmailScheduler] Weekly report sent to ${parent.email}`);
        } catch (error) {
          console.error(`[ParentEmailScheduler] Error sending report to ${parent.email}:`, error);
        }
      }

      console.log('[ParentEmailScheduler] Weekly email job completed');
    } catch (error) {
      console.error('[ParentEmailScheduler] Error in weekly email job:', error);
    }
  }

  /**
   * Manually trigger weekly reports (for testing)
   */
  async triggerWeeklyReports(): Promise<void> {
    console.log('[ParentEmailScheduler] Manually triggering weekly reports...');
    await this.sendWeeklyReports();
  }
}

export const parentEmailScheduler = new ParentEmailScheduler();
export default parentEmailScheduler;
