import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import reflectionEntryRepository from '../repositories/ReflectionEntryRepository';
import { BehavioralService } from '../services/behavioralService';
import { Types } from 'mongoose';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class ReflectionsController {
  // Get reflections
  static getReflections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const period = (req.query.period as string) || 'week';
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    let reflections;
    let total;

    if (period === 'week') {
      // For week view, get all and paginate
      const allReflections = await reflectionEntryRepository.findByWeek(userId);
      total = allReflections.length;
      reflections = allReflections.slice(skip, skip + limit);
    } else {
      // For all view, use repository method with pagination
      const allReflections = await reflectionEntryRepository.findByUser(userId, 1000); // Get large number, then paginate
      total = allReflections.length;
      reflections = allReflections.slice(skip, skip + limit);
    }

    const transformed = (reflections as any[]).map((reflection) => ({
      id: reflection._id.toString(),
      date: reflection.date,
      prompt: reflection.prompt,
      response: reflection.response,
      type: reflection.type,
      mood: reflection.mood,
      tutorFeedback: reflection.tutorFeedback
        ? {
            tutorId: reflection.tutorFeedback.tutorId.toString(),
            comment: reflection.tutorFeedback.comment,
            feedbackAt: reflection.tutorFeedback.feedbackAt,
            isRead: reflection.tutorFeedback.isRead,
          }
        : null,
      createdAt: reflection.createdAt,
    }));

    const paginationResult = createPaginationResult(transformed, total, page, limit);
    res.json({
      success: true,
      reflections: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Create reflection entry
  static createReflection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { prompt, response, type, mood } = req.body;

    if (!prompt || !response) {
      throw new AppError('Prompt and response are required', 400);
    }

    // Check if today's reflection already exists
    if (type === 'daily') {
      const today = await reflectionEntryRepository.findToday(userId);
      if (today) {
        throw new AppError('Daily reflection already completed today', 400);
      }
    }

    const reflection = await reflectionEntryRepository.create({
      userId: new Types.ObjectId(userId) as any,
      date: new Date(),
      prompt,
      response,
      type: type || 'daily',
      mood,
    } as any);

    res.status(201).json({
      success: true,
      reflection: {
        id: (reflection as any)._id.toString(),
        date: (reflection as any).date,
        prompt: (reflection as any).prompt,
        response: (reflection as any).response,
        type: (reflection as any).type,
        mood: (reflection as any).mood,
      },
    });
  });

  // Get reflection insights
  static getInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const reflections = await reflectionEntryRepository.findByWeek(userId);
    const streak = await reflectionEntryRepository.getReflectionStreak(userId);

    // Simple pattern detection
    const responses = (reflections as any[]).map((r: any) => r.response.toLowerCase());
    const patterns: string[] = [];

    if (responses.some((r) => r.includes('struggl'))) {
      patterns.push("You mentioned 'struggling' this week");
    }
    if (responses.some((r) => r.includes('great') || r.includes('good') || r.includes('amazing'))) {
      patterns.push('You had positive reflections this week!');
    }
    if (streak >= 5) {
      patterns.push(`You've been consistent with reflections for ${streak} days!`);
    }

    res.json({
      success: true,
      insights: {
        streak,
        totalReflections: reflections.length,
        patterns: patterns.length > 0 ? patterns : ['Keep reflecting to see insights!'],
      },
    });
  });

  // Get today's reflection prompt
  static getTodayPrompt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const prompts = await BehavioralService.getReflectionPrompts();
    res.json({ success: true, prompts });
  });
}
