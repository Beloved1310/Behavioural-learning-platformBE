import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { User } from '../models/User';
import { UserRole } from '../types';
import {
  sendParentProgressReportEmail,
  sendParentStudyHabitsEmail,
  sendParentBehavioralInsightsEmail,
} from '../services/emailService';
import { Types } from 'mongoose';
import quizAttemptRepository from '../repositories/QuizAttemptRepository';
import userProgressRepository from '../repositories/UserProgressRepository';

export class ParentReportsController {
  // Send periodic progress report email to parent
  static sendProgressReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { period = 'weekly' } = req.body;

    if (userRole !== UserRole.PARENT) {
      throw new AppError('Only parents can request this report', 403);
    }

    const parent = await User.findById(userId);
    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    // Get all children
    const children = await User.find({ parentId: new Types.ObjectId(userId) });
    if (children.length === 0) {
      return res.json({ message: 'No children found', sent: false });
    }

    const childrenIds = children.map((child) => child._id);
    const startDate = new Date();
    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get quiz attempts for all children
    const attempts = await (quizAttemptRepository as any).model
      .find({
        studentId: { $in: childrenIds },
        completedAt: { $gte: startDate },
      })
      .populate('quizId', 'subject');

    // Get progress data for all children
    const progressData = await Promise.all(
      children.map(async (child) => {
        const childAttempts = attempts.filter(
          (a: any) => a.studentId.toString() === child._id.toString()
        );

        const progress = await userProgressRepository.findByUser(child._id.toString());
        const totalStudyHours = progress
          ? (progress as any).studyTime / 60 // Convert minutes to hours
          : 0;

        const averageScore =
          childAttempts.length > 0
            ? Math.round(
                childAttempts.reduce((sum: number, a: any) => sum + a.percentage, 0) /
                  childAttempts.length
              )
            : 0;

        // Get strongest and weakest subjects
        const subjectScores: Record<string, number[]> = {};
        childAttempts.forEach((attempt: any) => {
          const subject = attempt.quizId?.subject || 'Unknown';
          if (!subjectScores[subject]) {
            subjectScores[subject] = [];
          }
          subjectScores[subject].push(attempt.percentage);
        });

        const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
          subject,
          average: scores.reduce((a, b) => a + b, 0) / scores.length,
        }));

        const strongestSubject =
          subjectAverages.length > 0
            ? subjectAverages.sort((a, b) => b.average - a.average)[0].subject
            : 'N/A';
        const weakestSubject =
          subjectAverages.length > 0
            ? subjectAverages.sort((a, b) => a.average - b.average)[0].subject
            : 'N/A';

        return {
          name: `${child.firstName} ${child.lastName}`.trim(),
          studyHours: totalStudyHours,
          quizzesCompleted: childAttempts.length,
          averageScore,
          progress: progress ? (progress as any).averageScore || 0 : 0,
          strongestSubject,
          weakestSubject,
        };
      })
    );

    const familyTotalStudyHours = progressData.reduce((sum, child) => sum + child.studyHours, 0);
    const familyAverageProgress =
      progressData.length > 0
        ? Math.round(
            progressData.reduce((sum, child) => sum + child.progress, 0) / progressData.length
          )
        : 0;

    // Send email
    await sendParentProgressReportEmail(parent.email, parent.firstName, {
      period: period === 'weekly' ? 'Weekly' : 'Monthly',
      children: progressData,
      familyTotalStudyHours,
      familyAverageProgress,
    });

    res.json({
      message: 'Progress report email sent successfully',
      sent: true,
    });
  });

  // Send study habits report email to parent
  static sendStudyHabitsReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { period = 'weekly' } = req.body;

    if (userRole !== UserRole.PARENT) {
      throw new AppError('Only parents can request this report', 403);
    }

    const parent = await User.findById(userId);
    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    const children = await User.find({ parentId: new Types.ObjectId(userId) });
    if (children.length === 0) {
      return res.json({ message: 'No children found', sent: false });
    }

    const startDate = new Date();
    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const habitsData = await Promise.all(
      children.map(async (child) => {
        const progress = await userProgressRepository.findByUser(child._id.toString());
        const streakCount = (child as any).streakCount || 0;

        // Calculate average study time (simplified - in real app, would track daily)
        const totalStudyTime = progress ? (progress as any).studyTime || 0 : 0;
        const days = period === 'weekly' ? 7 : 30;
        const averageStudyTime = totalStudyTime / days / 60; // Convert to hours

        return {
          name: `${child.firstName} ${child.lastName}`.trim(),
          averageStudyTime,
          studyStreak: streakCount,
          preferredStudyTime: 'Afternoon', // Would be calculated from actual data
          mostActiveDay: 'Monday', // Would be calculated from actual data
          consistencyScore: Math.min(100, Math.round((streakCount / 7) * 100)),
        };
      })
    );

    await sendParentStudyHabitsEmail(parent.email, parent.firstName, {
      period: period === 'weekly' ? 'Weekly' : 'Monthly',
      children: habitsData,
    });

    res.json({
      message: 'Study habits report email sent successfully',
      sent: true,
    });
  });

  // Send behavioral insights report email to parent
  static sendBehavioralInsightsReport = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { period = 'weekly' } = req.body;

      if (userRole !== UserRole.PARENT) {
        throw new AppError('Only parents can request this report', 403);
      }

      const parent = await User.findById(userId);
      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      const children = await User.find({ parentId: new Types.ObjectId(userId) });
      if (children.length === 0) {
        return res.json({ message: 'No children found', sent: false });
      }

      const startDate = new Date();
      if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const childrenIds = children.map((child) => child._id);
      const attempts = await (quizAttemptRepository as any).model.find({
        studentId: { $in: childrenIds },
        completedAt: { $gte: startDate },
      });

      const insightsData = await Promise.all(
        children.map(async (child) => {
          const childAttempts = attempts.filter(
            (a: any) => a.studentId.toString() === child._id.toString()
          );

          const averageScore =
            childAttempts.length > 0
              ? childAttempts.reduce((sum: number, a: any) => sum + a.percentage, 0) /
                childAttempts.length
              : 0;

          const engagementLevel =
            averageScore >= 80 ? 'High' : averageScore >= 60 ? 'Medium' : 'Low';
          const motivationTrend = childAttempts.length > 3 ? 'Improving' : 'Stable';

          return {
            name: `${child.firstName} ${child.lastName}`.trim(),
            engagementLevel,
            motivationTrend,
            focusAreas: ['Mathematics', 'Reading'], // Would be calculated from actual data
            achievements:
              childAttempts.length > 0 ? [`Completed ${childAttempts.length} quizzes`] : [],
            recommendations:
              averageScore < 60
                ? ['Encourage more practice', 'Review difficult topics']
                : ['Keep up the great work!', 'Continue consistent study'],
          };
        })
      );

      await sendParentBehavioralInsightsEmail(parent.email, parent.firstName, {
        period: period === 'weekly' ? 'Weekly' : 'Monthly',
        children: insightsData,
      });

      res.json({
        message: 'Behavioral insights report email sent successfully',
        sent: true,
      });
    }
  );
}
