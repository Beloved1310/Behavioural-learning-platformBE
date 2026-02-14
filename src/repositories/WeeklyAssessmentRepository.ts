import { BaseRepository } from './BaseRepository';
import { WeeklyAssessment, IWeeklyAssessment } from '../models/WeeklyAssessment';
import { Types } from 'mongoose';

class WeeklyAssessmentRepository extends BaseRepository<IWeeklyAssessment> {
  constructor() {
    super(WeeklyAssessment);
  }

  async findByUser(userId: string, limit?: number) {
    const options: any = { sort: { weekStart: -1 } };
    if (limit) {
      options.limit = limit;
    }
    return this.find({ userId: new Types.ObjectId(userId) }, options);
  }

  async findCurrentWeek(userId: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    return this.findOne({
      userId: new Types.ObjectId(userId),
      weekStart: weekStart,
    } as any);
  }

  async getTrends(userId: string, weeks: number = 8) {
    const assessments = await this.findByUser(userId, weeks);

    return {
      weekRatings: assessments.map((a: any) => ({
        week: a.weekStart,
        rating: a.weekRating,
      })),
      commitmentLevels: assessments.map((a: any) => ({
        week: a.weekStart,
        level: a.commitmentLevel,
      })),
    };
  }

  async addTutorFeedback(
    assessmentId: string,
    tutorId: string,
    comment: string,
    encouragementLevel: 'low' | 'medium' | 'high' = 'medium'
  ) {
    const assessment = await this.findById(assessmentId);
    if (!assessment) return null;

    (assessment as any).tutorFeedback = {
      tutorId: new Types.ObjectId(tutorId),
      comment,
      encouragementLevel,
      feedbackAt: new Date(),
      isRead: false,
    };

    await (assessment as any).save();
    return assessment;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
}

export default new WeeklyAssessmentRepository();
