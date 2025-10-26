import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Session, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { UserRole, SessionStatus } from '../types';

export class SessionsController {
  // Get all sessions for current user
  static async getUserSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const { status, startDate, endDate, type } = req.query;

      const query: any = {};

      // Filter by role
      if (userRole === UserRole.STUDENT) {
        query.studentId = userId;
      } else if (userRole === UserRole.TUTOR) {
        query.tutorId = userId;
      } else {
        // Parents can see their children's sessions
        const children = await User.find({ parentId: userId });
        const childrenIds = children.map(child => child._id);
        query.studentId = { $in: childrenIds };
      }

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      if (startDate || endDate) {
        query.scheduledAt = {};
        if (startDate) {
          query.scheduledAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.scheduledAt.$lte = new Date(endDate as string);
        }
      }

      const sessions = await Session.find(query)
        .populate('studentId', 'firstName lastName profileImage')
        .populate('tutorId', 'firstName lastName profileImage')
        .sort({ scheduledAt: 1 });

      const transformedSessions = sessions.map(session => {
        const endTime = new Date(session.scheduledAt);
        endTime.setMinutes(endTime.getMinutes() + session.duration);

        return {
          id: session._id.toString(),
          userId: session.studentId.toString(),
          title: session.title,
          subject: session.subject,
          type: session.type,
          startTime: session.scheduledAt.toISOString(),
          endTime: endTime.toISOString(),
          duration: session.duration,
          tutor: session.tutorId ? {
            id: (session.tutorId as any)._id.toString(),
            name: `${(session.tutorId as any).firstName} ${(session.tutorId as any).lastName}`,
            avatar: (session.tutorId as any).profileImage || null
          } : undefined,
          status: session.status,
          isRecurring: session.isRecurring,
          recurringPattern: session.recurringPattern,
          reminderEnabled: session.reminderEnabled,
          reminderTime: session.reminderTime,
          description: session.description,
          notes: session.notes,
          meetingUrl: session.meetingUrl,
          price: session.price,
          rating: session.rating,
          feedback: session.feedback,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        };
      });

      res.json({ sessions: transformedSessions });
    } catch (error) {
      throw new AppError('Failed to fetch sessions', 500);
    }
  }

  // Get session by ID
  static async getSessionById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const session = await Session.findById(id)
        .populate('studentId', 'firstName lastName profileImage email')
        .populate('tutorId', 'firstName lastName profileImage email');

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Check if user has access to this session
      const isStudent = session.studentId.toString() === userId;
      const isTutor = session.tutorId && session.tutorId.toString() === userId;

      if (!isStudent && !isTutor) {
        throw new AppError('Access denied', 403);
      }

      const endTime = new Date(session.scheduledAt);
      endTime.setMinutes(endTime.getMinutes() + session.duration);

      const transformedSession = {
        id: session._id.toString(),
        userId: session.studentId.toString(),
        title: session.title,
        subject: session.subject,
        type: session.type,
        startTime: session.scheduledAt.toISOString(),
        endTime: endTime.toISOString(),
        duration: session.duration,
        student: {
          id: (session.studentId as any)._id.toString(),
          name: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
          avatar: (session.studentId as any).profileImage || null,
          email: (session.studentId as any).email
        },
        tutor: session.tutorId ? {
          id: (session.tutorId as any)._id.toString(),
          name: `${(session.tutorId as any).firstName} ${(session.tutorId as any).lastName}`,
          avatar: (session.tutorId as any).profileImage || null,
          email: (session.tutorId as any).email
        } : undefined,
        status: session.status,
        isRecurring: session.isRecurring,
        recurringPattern: session.recurringPattern,
        reminderEnabled: session.reminderEnabled,
        reminderTime: session.reminderTime,
        description: session.description,
        notes: session.notes,
        meetingUrl: session.meetingUrl,
        price: session.price,
        rating: session.rating,
        feedback: session.feedback,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };

      res.json({ session: transformedSession });
    } catch (error) {
      throw error;
    }
  }

  // Create new session
  static async createSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        title,
        subject,
        type,
        startTime,
        endTime,
        duration,
        tutorId,
        description,
        isRecurring,
        recurringPattern,
        reminderEnabled,
        reminderTime
      } = req.body;

      // Calculate duration if not provided
      let sessionDuration = duration;
      const scheduledAt = new Date(startTime);

      if (!sessionDuration && endTime) {
        // Calculate duration from startTime and endTime
        const endDateTime = new Date(endTime);
        const durationMs = endDateTime.getTime() - scheduledAt.getTime();
        sessionDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes

        console.log('Duration calculation:', {
          startTime,
          endTime,
          scheduledAt: scheduledAt.toISOString(),
          endDateTime: endDateTime.toISOString(),
          durationMs,
          sessionDuration
        });
      }

      // Validate duration
      if (!sessionDuration || sessionDuration < 15 || sessionDuration > 180) {
        throw new AppError(
          `Duration must be between 15 and 180 minutes. Calculated duration: ${sessionDuration} minutes. ` +
          `Please ensure endTime is on the same day as startTime and represents the session end time, not a future date.`,
          400
        );
      }

      // Create session
      const session = await Session.create({
        studentId: userId,
        tutorId: tutorId || undefined,
        title,
        subject,
        type,
        scheduledAt,
        duration: sessionDuration,
        description,
        isRecurring: isRecurring || false,
        recurringPattern,
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
        reminderTime: reminderTime || 15,
        price: 0 // Default for self-study sessions
      });

      await session.populate('tutorId', 'firstName lastName profileImage');

      const sessionEndTime = new Date(scheduledAt);
      sessionEndTime.setMinutes(sessionEndTime.getMinutes() + sessionDuration);

      const transformedSession = {
        id: session._id.toString(),
        userId: session.studentId.toString(),
        title: session.title,
        subject: session.subject,
        type: session.type,
        startTime: session.scheduledAt.toISOString(),
        endTime: sessionEndTime.toISOString(),
        duration: session.duration,
        tutor: session.tutorId ? {
          id: (session.tutorId as any)._id.toString(),
          name: `${(session.tutorId as any).firstName} ${(session.tutorId as any).lastName}`,
          avatar: (session.tutorId as any).profileImage || null
        } : undefined,
        status: session.status,
        isRecurring: session.isRecurring,
        recurringPattern: session.recurringPattern,
        reminderEnabled: session.reminderEnabled,
        reminderTime: session.reminderTime,
        description: session.description,
        notes: session.notes,
        meetingUrl: session.meetingUrl,
        price: session.price,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };

      res.status(201).json({ session: transformedSession });
    } catch (error) {
      throw error;
    }
  }

  // Update session
  static async updateSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const session = await Session.findById(id);

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Check if user can update this session
      if (session.studentId.toString() !== userId) {
        throw new AppError('Access denied', 403);
      }

      // If startTime is updated, update scheduledAt
      if (updates.startTime) {
        session.scheduledAt = new Date(updates.startTime);
        delete updates.startTime; // Remove so it doesn't get set again below
      }

      // Calculate duration from endTime if provided
      if (updates.endTime && session.scheduledAt) {
        const endDateTime = new Date(updates.endTime);
        const durationMs = endDateTime.getTime() - session.scheduledAt.getTime();
        const calculatedDuration = Math.round(durationMs / (1000 * 60));

        if (calculatedDuration >= 15 && calculatedDuration <= 180) {
          session.duration = calculatedDuration;
        }
        delete updates.endTime; // Remove so it doesn't cause issues
      }

      // Update remaining fields
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'startTime' && key !== 'endTime') {
          (session as any)[key] = updates[key];
        }
      });

      await session.save();
      await session.populate('tutorId', 'firstName lastName profileImage');

      const endTime = new Date(session.scheduledAt);
      endTime.setMinutes(endTime.getMinutes() + session.duration);

      const transformedSession = {
        id: session._id.toString(),
        userId: session.studentId.toString(),
        title: session.title,
        subject: session.subject,
        type: session.type,
        startTime: session.scheduledAt.toISOString(),
        endTime: endTime.toISOString(),
        duration: session.duration,
        tutor: session.tutorId ? {
          id: (session.tutorId as any)._id.toString(),
          name: `${(session.tutorId as any).firstName} ${(session.tutorId as any).lastName}`,
          avatar: (session.tutorId as any).profileImage || null
        } : undefined,
        status: session.status,
        isRecurring: session.isRecurring,
        recurringPattern: session.recurringPattern,
        reminderEnabled: session.reminderEnabled,
        reminderTime: session.reminderTime,
        description: session.description,
        notes: session.notes,
        meetingUrl: session.meetingUrl,
        price: session.price,
        rating: session.rating,
        feedback: session.feedback,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };

      res.json({ session: transformedSession });
    } catch (error) {
      throw error;
    }
  }

  // Delete session
  static async deleteSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const session = await Session.findById(id);

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Check if user can delete this session
      if (session.studentId.toString() !== userId) {
        throw new AppError('Access denied', 403);
      }

      await Session.findByIdAndDelete(id);

      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  // Update session status
  static async updateSessionStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      const session = await Session.findById(id);

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Check if user has access
      const isStudent = session.studentId.toString() === userId;
      const isTutor = session.tutorId && session.tutorId.toString() === userId;

      if (!isStudent && !isTutor) {
        throw new AppError('Access denied', 403);
      }

      session.status = status;
      await session.save();

      res.json({ success: true, message: 'Session status updated', status });
    } catch (error) {
      throw error;
    }
  }

  // Get session statistics
  static async getSessionStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const query: any = {};
      if (userRole === UserRole.STUDENT) {
        query.studentId = userId;
      } else if (userRole === UserRole.TUTOR) {
        query.tutorId = userId;
      }

      // Get counts by status
      const totalSessions = await Session.countDocuments(query);
      const scheduledSessions = await Session.countDocuments({ ...query, status: SessionStatus.SCHEDULED });
      const completedSessions = await Session.countDocuments({ ...query, status: SessionStatus.COMPLETED });
      const missedSessions = await Session.countDocuments({ ...query, status: SessionStatus.MISSED });
      const cancelledSessions = await Session.countDocuments({ ...query, status: SessionStatus.CANCELLED });

      // Get upcoming sessions count
      const upcomingSessions = await Session.countDocuments({
        ...query,
        scheduledAt: { $gte: new Date() },
        status: SessionStatus.SCHEDULED
      });

      // Get today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysSessions = await Session.countDocuments({
        ...query,
        scheduledAt: {
          $gte: today,
          $lt: tomorrow
        },
        status: SessionStatus.SCHEDULED
      });

      // Calculate average rating (for students viewing tutor sessions)
      const sessionsWithRatings = await Session.find({
        ...query,
        rating: { $exists: true, $ne: null }
      }).select('rating');

      const averageRating = sessionsWithRatings.length > 0
        ? sessionsWithRatings.reduce((sum, s) => sum + (s.rating || 0), 0) / sessionsWithRatings.length
        : 0;

      res.json({
        stats: {
          total: totalSessions,
          scheduled: scheduledSessions,
          completed: completedSessions,
          missed: missedSessions,
          cancelled: cancelledSessions,
          upcoming: upcomingSessions,
          today: todaysSessions,
          averageRating: Math.round(averageRating * 10) / 10
        }
      });
    } catch (error) {
      throw new AppError('Failed to fetch session statistics', 500);
    }
  }

  // Search available tutors
  static async searchTutors(req: AuthenticatedRequest, res: Response) {
    try {
      const { subject, query } = req.query;

      const searchQuery: any = {
        role: UserRole.TUTOR,
        isVerified: true,
        isBackgroundChecked: true
      };

      if (subject) {
        searchQuery.subjects = subject;
      }

      if (query) {
        searchQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ];
      }

      const tutors = await User.find(searchQuery)
        .select('firstName lastName profileImage subjects hourlyRate rating totalSessions bio')
        .sort({ rating: -1, totalSessions: -1 })
        .limit(20);

      const transformedTutors = tutors.map(tutor => ({
        id: tutor._id.toString(),
        name: `${tutor.firstName} ${tutor.lastName}`,
        avatar: tutor.profileImage || null,
        subjects: tutor.subjects,
        hourlyRate: tutor.hourlyRate,
        rating: tutor.rating,
        totalSessions: tutor.totalSessions,
        bio: tutor.bio
      }));

      res.json({ tutors: transformedTutors });
    } catch (error) {
      throw new AppError('Failed to search tutors', 500);
    }
  }

  // Get tutor availability
  static async getTutorAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { tutorId } = req.params;
      const { date } = req.query;

      // Verify tutor exists
      const tutor = await User.findOne({
        _id: tutorId,
        role: UserRole.TUTOR
      });

      if (!tutor) {
        throw new AppError('Tutor not found', 404);
      }

      // Get the date range
      const queryDate = date ? new Date(date as string) : new Date();
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find tutor's sessions for the date
      const bookedSessions = await Session.find({
        tutorId,
        scheduledAt: {
          $gte: queryDate,
          $lt: nextDay
        },
        status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] }
      }).select('scheduledAt duration');

      // Transform to time slots
      const bookedSlots = bookedSessions.map(session => ({
        start: session.scheduledAt.toISOString(),
        end: new Date(session.scheduledAt.getTime() + session.duration * 60000).toISOString()
      }));

      res.json({
        tutorId,
        date: queryDate.toISOString(),
        bookedSlots,
        tutor: {
          id: tutor._id.toString(),
          name: `${tutor.firstName} ${tutor.lastName}`,
          hourlyRate: tutor.hourlyRate,
          rating: tutor.rating
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Book session with tutor
  static async bookTutorSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        tutorId,
        title,
        subject,
        startTime,
        duration,
        description
      } = req.body;

      // Verify tutor exists and is available
      const tutor = await User.findOne({
        _id: tutorId,
        role: UserRole.TUTOR,
        isVerified: true
      });

      if (!tutor) {
        throw new AppError('Tutor not found or not available', 404);
      }

      // Check for conflicts
      const scheduledAt = new Date(startTime);
      const sessionEnd = new Date(scheduledAt.getTime() + duration * 60000);

      const conflict = await Session.findOne({
        tutorId,
        status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
        $or: [
          {
            scheduledAt: { $lt: sessionEnd },
            $expr: {
              $gt: [
                { $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] },
                scheduledAt
              ]
            }
          }
        ]
      });

      if (conflict) {
        throw new AppError('Tutor is not available at this time', 409);
      }

      // Calculate price
      const price = (tutor.hourlyRate || 0) * (duration / 60);

      // Create session
      const session = await Session.create({
        studentId: userId,
        tutorId,
        title,
        subject,
        type: 'tutoring',
        scheduledAt,
        duration,
        description,
        price,
        reminderEnabled: true,
        reminderTime: 15,
        isRecurring: false
      });

      await session.populate('tutorId', 'firstName lastName profileImage');

      const endTime = new Date(scheduledAt);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const transformedSession = {
        id: session._id.toString(),
        userId: session.studentId.toString(),
        title: session.title,
        subject: session.subject,
        type: session.type,
        startTime: session.scheduledAt.toISOString(),
        endTime: endTime.toISOString(),
        duration: session.duration,
        tutor: {
          id: (session.tutorId as any)._id.toString(),
          name: `${(session.tutorId as any).firstName} ${(session.tutorId as any).lastName}`,
          avatar: (session.tutorId as any).profileImage || null
        },
        status: session.status,
        isRecurring: session.isRecurring,
        recurringPattern: session.recurringPattern,
        reminderEnabled: session.reminderEnabled,
        reminderTime: session.reminderTime,
        description: session.description,
        notes: session.notes,
        meetingUrl: session.meetingUrl,
        price: session.price,
        rating: session.rating,
        feedback: session.feedback,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };

      res.status(201).json({ session: transformedSession });
    } catch (error) {
      throw error;
    }
  }
}
