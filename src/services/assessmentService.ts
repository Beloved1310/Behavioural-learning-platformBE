import { Types } from 'mongoose';
import weeklyAssessmentRepository from '../repositories/WeeklyAssessmentRepository';
import { AppError } from '../middleware/errorHandler';

export class AssessmentService {
  /**
   * Get current week's assessment for a user
   */
  async getCurrentAssessment(userId: string) {
    const assessment = await weeklyAssessmentRepository.findCurrentWeek(userId);

    if (!assessment) {
      return null;
    }

    return {
      id: (assessment as any)._id.toString(),
      weekStart: (assessment as any).weekStart,
      weekRating: (assessment as any).weekRating,
      whatWentWell: (assessment as any).whatWentWell,
      challenges: (assessment as any).challenges,
      nextWeekFocus: (assessment as any).nextWeekFocus,
      commitmentLevel: (assessment as any).commitmentLevel,
      tutorFeedback: (assessment as any).tutorFeedback,
      completedAt: (assessment as any).completedAt,
    };
  }

  /**
   * Submit weekly assessment
   */
  async submitAssessment(
    userId: string,
    data: {
      weekRating: number;
      whatWentWell: string;
      challenges: string;
      nextWeekFocus: string;
      commitmentLevel: number;
    }
  ) {
    // Validate input
    if (
      !data.weekRating ||
      !data.whatWentWell ||
      !data.challenges ||
      !data.nextWeekFocus ||
      !data.commitmentLevel
    ) {
      throw new AppError('All fields are required', 400);
    }

    if (
      data.weekRating < 1 ||
      data.weekRating > 5 ||
      data.commitmentLevel < 1 ||
      data.commitmentLevel > 5
    ) {
      throw new AppError('Ratings must be between 1 and 5', 400);
    }

    // Calculate week start (Monday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Check if assessment already exists for this week
    const existing = await weeklyAssessmentRepository.findCurrentWeek(userId);
    if (existing) {
      throw new AppError('Assessment already submitted for this week', 400);
    }

    // Create assessment
    const assessment = await weeklyAssessmentRepository.create({
      userId: new Types.ObjectId(userId) as any,
      weekStart,
      weekRating: parseInt(data.weekRating.toString()),
      whatWentWell: data.whatWentWell,
      challenges: data.challenges,
      nextWeekFocus: data.nextWeekFocus,
      commitmentLevel: parseInt(data.commitmentLevel.toString()),
      completedAt: new Date(),
    } as any);

    return {
      id: (assessment as any)._id.toString(),
      weekStart: (assessment as any).weekStart,
      weekRating: (assessment as any).weekRating,
      commitmentLevel: (assessment as any).commitmentLevel,
    };
  }

  /**
   * Get assessment trends
   */
  async getTrends(userId: string, weeks: number = 8) {
    const trends = await weeklyAssessmentRepository.getTrends(userId, weeks);

    return {
      weekRatings: (trends.weekRatings as any[]).map((t: any) => ({
        week: t.week,
        rating: t.rating,
      })),
      commitmentLevels: (trends.commitmentLevels as any[]).map((t: any) => ({
        week: t.week,
        level: t.level,
      })),
    };
  }
}

export default new AssessmentService();
