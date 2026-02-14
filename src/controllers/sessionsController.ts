import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Session, User } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { UserRole, SessionStatus, SessionType } from '../types';
import { getIO } from '../socket';
import { sendNotificationToUser } from '../socket';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { logger } from '../utils/logger';
import { SessionQueryFilter, TutorSearchQuery } from '../types/queries';
import { transformSession, transformTutor } from '../utils/transformations';
import { toObjectId, toObjectIdString, isPopulatedUser } from '../utils/populatedTypes';
import quizAttemptRepository from '../repositories/QuizAttemptRepository';
import goalRepository from '../repositories/GoalRepository';

export class SessionsController {
  // Get all sessions for current user
  static getUserSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const { status, startDate, endDate, type } = req.query;

    const query: SessionQueryFilter = {};

    // Filter by role
    if (userRole === UserRole.STUDENT) {
      query.studentId = userId;
    } else if (userRole === UserRole.TUTOR) {
      query.tutorId = userId;
    } else {
      // Parents can see their children's sessions
      const children = await User.find({ parentId: userId });
      const childrenIds = children.map((child) => child._id.toString());
      query.studentId = { $in: childrenIds };
    }

    // Apply filters
    if (status) {
      query.status = status as SessionStatus;
    }

    if (type) {
      query.type = type as SessionType;
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

    // Get pagination parameters
    const { page, limit, skip } = getPaginationParams(req, 10, 1000);

    // Get total count for pagination
    const total = await Session.countDocuments(query);

    // Get paginated sessions
    const sessions = await Session.find(query)
      .populate('studentId', 'firstName lastName profileImage')
      .populate('tutorId', 'firstName lastName profileImage')
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit);

    const transformedSessions = sessions.map((session) => transformSession(session));

    // Return paginated response
    const paginationResult = createPaginationResult(transformedSessions, total, page, limit);
    res.json({
      success: true,
      data: {
        sessions: paginationResult.data,
        pagination: paginationResult.pagination,
      },
    });
  });

  // Get session by ID
  static getSessionById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const session = await Session.findById(id)
      .populate('studentId', 'firstName lastName profileImage email')
      .populate('tutorId', 'firstName lastName profileImage email');

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // Check if user has access to this session
    // Use ObjectId comparison for reliability
    const currentUserId = new Types.ObjectId(userId);

    // Check if user is the student (studentId is populated, so it has _id)
    const studentIdObj = toObjectId(session.studentId);
    const isStudent = studentIdObj?.equals(currentUserId) ?? false;

    // Check if user is the tutor (tutorId may be populated or null)
    let isTutor = false;
    if (session.tutorId) {
      const tutorIdObj = toObjectId(session.tutorId);
      isTutor = tutorIdObj?.equals(currentUserId) ?? false;
    }

    if (!isStudent && !isTutor) {
      throw new AppError('Access denied', 403);
    }

    const endTime = new Date(session.scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + session.duration);

    const transformedSession = transformSession(session);
    
    // Add student and tutor details if populated
    if (isPopulatedUser(session.studentId)) {
      transformedSession.student = {
        id: session.studentId._id.toString(),
        name: `${session.studentId.firstName} ${session.studentId.lastName}`,
        avatar: session.studentId.profileImage || null,
        email: session.studentId.email || undefined,
      };
    }
    
    if (session.tutorId && isPopulatedUser(session.tutorId)) {
      transformedSession.tutor = {
        id: session.tutorId._id.toString(),
        name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
        avatar: session.tutorId.profileImage || null,
        email: session.tutorId.email || undefined,
      };
    }

    res.json({ session: transformedSession });
  });

  // Create new session
  static createSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      reminderTime,
    } = req.body;

    // Calculate duration if not provided
    let sessionDuration = duration;
    const scheduledAt = new Date(startTime);

    if (!sessionDuration && endTime) {
      // Calculate duration from startTime and endTime
      const endDateTime = new Date(endTime);
      const durationMs = endDateTime.getTime() - scheduledAt.getTime();
      sessionDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes

      logger.debug('Duration calculation', {
        startTime,
        endTime,
        scheduledAt: scheduledAt.toISOString(),
        endDateTime: endDateTime.toISOString(),
        durationMs,
        sessionDuration,
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

    // Check if a session already exists for this student, tutor, and overlapping time slot
    // This prevents duplicate sessions when frontend calls multiple endpoints
    if (tutorId) {
      const sessionEnd = new Date(scheduledAt.getTime() + sessionDuration * 60000);

      // Find existing sessions with overlapping time slots
      const existingSessions = await Session.find({
        studentId: userId,
        tutorId: tutorId,
        status: {
          $in: [SessionStatus.PENDING, SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS],
        },
        $or: [
          {
            scheduledAt: { $lt: sessionEnd },
            $expr: {
              $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledAt],
            },
          },
        ],
      }).limit(1);

      if (existingSessions.length > 0) {
        const existingSession = existingSessions[0];
        logger.debug('Duplicate/overlapping session detected, returning existing session', {
          sessionId: existingSession._id.toString(),
        });
        await existingSession.populate('tutorId', 'firstName lastName profileImage');
        await existingSession.populate('studentId', 'firstName lastName');

        const transformedSession = transformSession(existingSession);

        return res.status(200).json({
          success: true,
          data: {
            session: transformedSession,
            isDuplicate: true,
          },
          message: 'Session already exists',
        });
      }
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
      price: 0, // Default for self-study sessions
    });

    await session.populate('tutorId', 'firstName lastName profileImage');

    const sessionEndTime = new Date(scheduledAt);
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + sessionDuration);

    const transformedSession = transformSession(session);
    
    // Add tutor details if populated
    if (session.tutorId && isPopulatedUser(session.tutorId)) {
      transformedSession.tutor = {
        id: session.tutorId._id.toString(),
        name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
        avatar: session.tutorId.profileImage || null,
      };
    }

    // Send notification to tutor if session has a tutor
    if (session.tutorId) {
      const student = await User.findById(session.studentId);
      const io = getIO();
      if (io && student) {
        const tutorIdString = toObjectIdString(session.tutorId);
        if (tutorIdString) {
          await sendNotificationToUser(io, tutorIdString, {
            type: 'session_request',
            title: '📅 New Session Request',
            message: `${student.firstName} ${student.lastName} has requested a ${session.subject} session: "${session.title}"`,
            data: {
              sessionId: session._id.toString(),
              studentId: session.studentId.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              subject: session.subject,
              title: session.title,
              startTime: session.scheduledAt.toISOString(),
              duration: session.duration,
            },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: { session: transformedSession },
    });
  });

  // Update session
  static updateSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== 'startTime' && key !== 'endTime') {
        // Type-safe field assignment
        if (key in session) {
          (session as unknown as Record<string, unknown>)[key] = updates[key];
        }
      }
    });

    await session.save();
    await session.populate('tutorId', 'firstName lastName profileImage');

    // Send notification to tutor if session was updated and has a tutor
    if (session.tutorId) {
      const student = await User.findById(session.studentId);
      const io = getIO();
      if (io && student) {
        const tutorIdString = toObjectIdString(session.tutorId);
        if (tutorIdString) {
          await sendNotificationToUser(io, tutorIdString, {
            type: 'session_changed',
            title: '🔄 Session Updated',
            message: `${student.firstName} ${student.lastName} has updated the ${session.subject} session: "${session.title}"`,
            data: {
              sessionId: session._id.toString(),
              studentId: session.studentId.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              subject: session.subject,
              title: session.title,
              startTime: session.scheduledAt.toISOString(),
              duration: session.duration,
            },
          });
        }
      }
    }

    const transformedSession = transformSession(session);
    
    // Add tutor details if populated
    if (session.tutorId && isPopulatedUser(session.tutorId)) {
      transformedSession.tutor = {
        id: session.tutorId._id.toString(),
        name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
        avatar: session.tutorId.profileImage || null,
      };
    }

    res.json({ session: transformedSession });
  });

  // Delete session
  static deleteSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    // Send notification to tutor if session has a tutor
    if (session.tutorId) {
      const student = await User.findById(session.studentId);
      const io = getIO();
      if (io && student) {
        const tutorIdString = toObjectIdString(session.tutorId);
        if (tutorIdString) {
          await sendNotificationToUser(io, tutorIdString, {
            type: 'session_cancelled',
            title: '❌ Session Cancelled',
            message: `${student.firstName} ${student.lastName} has cancelled the ${session.subject} session: "${session.title}"`,
            data: {
              sessionId: session._id.toString(),
              studentId: session.studentId.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              subject: session.subject,
              title: session.title,
            },
          });
        }
      }
    }

    await Session.findByIdAndDelete(id);

    res.json({ success: true, message: 'Session deleted successfully' });
  });

  // Update session status
  static updateSessionStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const session = await Session.findById(id);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // Check if user has access
    // Use ObjectId comparison for reliability
    const currentUserId = new Types.ObjectId(userId);
    const studentIdObj = new Types.ObjectId(session.studentId);
    const isStudent = studentIdObj.equals(currentUserId);

    // Use ObjectId comparison for reliability (tutorId may be populated or not)
    let isTutor = false;
    if (session.tutorId) {
      const tutorIdObj = toObjectId(session.tutorId);
      isTutor = tutorIdObj?.equals(currentUserId) ?? false;
    }

    if (!isStudent && !isTutor) {
      throw new AppError('Access denied', 403);
    }

    const previousStatus = session.status;
    session.status = status;
    await session.save();
    await session.populate('tutorId', 'firstName lastName profileImage');
    await session.populate('studentId', 'firstName lastName');

    // Award points to student when session is completed
    if (
      status === SessionStatus.COMPLETED &&
      previousStatus !== SessionStatus.COMPLETED &&
      isStudent
    ) {
      const student = await User.findById(session.studentId);
      if (student) {
        const pointsAwarded = 25; // Points for completing a tutoring session
        const currentPoints = (student.totalPoints as number) || 0;
        student.totalPoints = currentPoints + pointsAwarded;
        await student.save();
      }
    }

    // When a session moves to COMPLETED for the first time, auto-update all of the student's goals
    if (status === SessionStatus.COMPLETED && previousStatus !== SessionStatus.COMPLETED) {
      try {
        const studentId = session.studentId.toString();

        // Recalculate the unified "current" progress value based on all quizzes + completed sessions
        const [quizzes, completedSessions] = await Promise.all([
          quizAttemptRepository.find({ studentId: new Types.ObjectId(studentId) } as any),
          Session.find(
            { studentId: new Types.ObjectId(studentId), status: SessionStatus.COMPLETED } as any
          ),
        ]);

        const currentCount = (quizzes as any[]).length + (completedSessions as any[]).length;

        const goals = await goalRepository.findByUser(studentId, true);
        await Promise.all(
          (goals as any[]).map((goal: any) =>
            goalRepository.updateProgress(goal._id.toString(), currentCount)
          )
        );

        logger.debug('[SessionsController.updateSessionStatus] Goal progress auto-updated', {
          studentId,
          goalsUpdated: (goals as any[]).length,
          currentCount,
        });
      } catch (error) {
        logger.error(
          '[SessionsController.updateSessionStatus] Failed to auto-update goal progress',
          error,
          {
            sessionId: session._id.toString(),
            studentId: session.studentId.toString(),
          }
        );
      }
    }

    // Send notification to tutor if session status changed to cancelled
    if (
      status === SessionStatus.CANCELLED &&
      session.tutorId &&
      previousStatus !== SessionStatus.CANCELLED
    ) {
      const student = await User.findById(session.studentId);
      const io = getIO();
      if (io && student) {
        const tutorIdString = toObjectIdString(session.tutorId);
        if (tutorIdString) {
          await sendNotificationToUser(io, tutorIdString, {
            type: 'session_cancelled',
            title: '❌ Session Cancelled',
            message: `${student.firstName} ${student.lastName} has cancelled the ${session.subject} session: "${session.title}"`,
            data: {
              sessionId: session._id.toString(),
              studentId: session.studentId.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              subject: session.subject,
              title: session.title,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Session status updated',
      status,
      pointsAwarded:
        status === SessionStatus.COMPLETED &&
        previousStatus !== SessionStatus.COMPLETED &&
        isStudent
          ? 25
          : undefined,
    });
  });

  // Get session statistics
  static getSessionStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const query: SessionQueryFilter = {};
    if (userRole === UserRole.STUDENT) {
      query.studentId = userId;
    } else if (userRole === UserRole.TUTOR) {
      query.tutorId = userId;
    }

    // Get counts by status
    const totalSessions = await Session.countDocuments(query);
    const scheduledSessions = await Session.countDocuments({
      ...query,
      status: SessionStatus.SCHEDULED,
    });
    const completedSessions = await Session.countDocuments({
      ...query,
      status: SessionStatus.COMPLETED,
    });
    const missedSessions = await Session.countDocuments({ ...query, status: SessionStatus.MISSED });
    const cancelledSessions = await Session.countDocuments({
      ...query,
      status: SessionStatus.CANCELLED,
    });

    // Get upcoming sessions count
    const upcomingSessions = await Session.countDocuments({
      ...query,
      scheduledAt: { $gte: new Date() },
      status: SessionStatus.SCHEDULED,
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
        $lt: tomorrow,
      },
      status: SessionStatus.SCHEDULED,
    });

    // Calculate average rating (for students viewing tutor sessions)
    const sessionsWithRatings = await Session.find({
      ...query,
      rating: { $exists: true, $ne: null },
    }).select('rating');

    const averageRating =
      sessionsWithRatings.length > 0
        ? sessionsWithRatings.reduce((sum, s) => sum + (s.rating || 0), 0) /
          sessionsWithRatings.length
        : 0;

    // Calculate total study hours from completed sessions
    const completedSessionsData = await Session.find({
      ...query,
      status: SessionStatus.COMPLETED,
    }).select('duration');

    const totalDurationMinutes = completedSessionsData.reduce((sum, s) => {
      return sum + (s.duration || 0);
    }, 0);

    const totalStudyHours = Math.round((totalDurationMinutes / 60) * 10) / 10; // Round to 1 decimal place

    // Calculate average session duration
    const averageSessionDuration =
      completedSessionsData.length > 0
        ? Math.round(totalDurationMinutes / completedSessionsData.length)
        : 0;

    res.json({
      success: true,
      data: {
        total: totalSessions,
        scheduled: scheduledSessions,
        completed: completedSessions,
        missed: missedSessions,
        cancelled: cancelledSessions,
        upcoming: upcomingSessions,
        today: todaysSessions,
        averageRating: Math.round(averageRating * 10) / 10,
        totalStudyHours: totalStudyHours,
        averageSessionDuration: averageSessionDuration,
      },
    });
  });

  // Search available tutors
  static searchTutors = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subject, query, page = '1', limit = '7' } = req.query;

    logger.debug('Tutor search request received', {
      subject,
      query,
      page,
      limit,
      userId: req.user?.id,
    });

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 7;
    const skip = (pageNum - 1) * limitNum;
    const searchQuery: TutorSearchQuery = {
      role: UserRole.TUTOR,
    };

    // Subject filter logic:
    // - If 'all' or not provided: Return ALL tutors (no subject filter)
    // - If specific subject: Return tutors with that subject OR tutors with no subjects (empty array)
    //   This ensures tutors who haven't updated their subjects are still shown
    const subjectFilter: Partial<TutorSearchQuery> = {};
    if (subject && subject !== 'all') {
      // Match tutors who have the subject OR tutors with no subjects (empty/null array)
      subjectFilter.$or = [
        { subjects: { $regex: new RegExp(`^${subject}$`, 'i') } }, // Has the subject
        { subjects: { $size: 0 } }, // Empty subjects array
        { subjects: { $exists: false } }, // Subjects field doesn't exist
        { subjects: null }, // Subjects is null
      ];
      logger.debug('Subject filter applied', { subject, note: 'Including tutors with no subjects' });
    } else {
      // "All Subjects" - no subject filter, return all tutors
      logger.debug('All subjects selected - returning all tutors');
    }

    // Optimized search query - search in name, bio, and subjects
    const searchFilter: Partial<TutorSearchQuery> = {};
    if (query && query.toString().trim()) {
      const searchTerm = query.toString().trim();
      const searchRegex = new RegExp(searchTerm, 'i');

      // Build optimized $or query
      // Include full name search by concatenating firstName and lastName
      searchFilter.$or = [
        { firstName: { $regex: searchRegex, $options: 'i' } },
        { lastName: { $regex: searchRegex, $options: 'i' } },
        { bio: searchRegex },
        { subjects: { $in: [searchRegex] } }, // Check if search term matches any subject in array
        // Search for full name (firstName + " " + lastName)
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: searchTerm,
              options: 'i',
            },
          },
        },
      ];

      logger.debug('Search query applied', { searchTerm, regexPattern: searchRegex.toString() });
    }

    // Combine filters using $and if both exist
    const combinedFilters: Partial<TutorSearchQuery>[] = [];
    if (Object.keys(subjectFilter).length > 0) {
      combinedFilters.push(subjectFilter);
    }
    if (Object.keys(searchFilter).length > 0) {
      combinedFilters.push(searchFilter);
    }

    // If we have multiple filters, combine them with $and
    if (combinedFilters.length > 0) {
      if (combinedFilters.length === 1) {
        // Only one filter, merge it directly
        Object.assign(searchQuery, combinedFilters[0]);
      } else {
        // Multiple filters, use $and
        searchQuery.$and = combinedFilters;
      }
    }

    // Get total count for pagination
    const totalTutors = await User.countDocuments(searchQuery);
    logger.debug('Tutor search query executed', {
      totalTutors,
      query: JSON.stringify(searchQuery),
    });

    // Get tutors with pagination
    const tutors = await User.find(searchQuery)
      .select('firstName lastName profileImage subjects hourlyRate rating totalSessions bio')
      .sort({ rating: -1, totalSessions: -1 })
      .skip(skip)
      .limit(limitNum);

    logger.debug('Tutors returned from search', {
      count: tutors.length,
      page: pageNum,
      limit: limitNum,
    });

    if (tutors.length === 0) {
      logger.debug('No tutors found, checking if query is too restrictive');
      // Try a simpler query to see if there are any tutors at all
      const simpleQuery: Partial<TutorSearchQuery> = { role: UserRole.TUTOR };
      if (query && query.toString().trim()) {
        const searchTerm = query.toString().trim();
        const searchRegex = new RegExp(searchTerm, 'i');
        simpleQuery.$or = [
          { firstName: { $regex: searchRegex, $options: 'i' } },
          { lastName: { $regex: searchRegex, $options: 'i' } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$firstName', ' ', '$lastName'] },
                regex: searchTerm,
                options: 'i',
              },
            },
          },
        ];
      }
      const simpleCount = await User.countDocuments(simpleQuery);
      logger.debug('Tutors found without verification filters', { count: simpleCount });
    }

    const transformedTutors = tutors.map(transformTutor);

    const response = {
      tutors: transformedTutors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalTutors,
        totalPages: Math.ceil(totalTutors / limitNum),
        hasNextPage: pageNum < Math.ceil(totalTutors / limitNum),
        hasPrevPage: pageNum > 1,
      },
    };

    logger.debug('Tutor search response sent', {
      tutorsCount: transformedTutors.length,
      pagination: response.pagination,
    });

    res.json(response);
  });

  // Get tutor availability (for students to see available slots)
  static getTutorAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tutorId } = req.params;
    const { date, duration = 60 } = req.query; // duration in minutes, default 60

    // Verify tutor exists
    const tutor = await User.findOne({
      _id: tutorId,
      role: UserRole.TUTOR,
    });

    if (!tutor) {
      throw new AppError('Tutor not found', 404);
    }

    // Parse date string properly to avoid timezone issues
    // If date is in YYYY-MM-DD format, parse it as local date
    let queryDate: Date;
    if (date) {
      const dateStr = date as string;
      // Check if it's in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Parse as local date to avoid UTC timezone issues
        const [year, month, day] = dateStr.split('-').map(Number);
        queryDate = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        queryDate = new Date(dateStr);
      }
    } else {
      queryDate = new Date();
    }

    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Import TutorAvailability model
    const { TutorAvailability } = await import('../models/TutorAvailability');

    // Get tutor's availability for this day
    // getDay() returns 0 (Sunday) to 6 (Saturday)
    const dayOfWeek = queryDate.getDay();

    logger.debug('Querying tutor availability', {
      tutorId,
      date: queryDate.toISOString(),
      dayOfWeek,
    });

    // Query for recurring availability (matches day of week)
    // and specific date availability (matches exact date)
    const availabilities = await TutorAvailability.find({
      tutorId: new Types.ObjectId(tutorId),
      isActive: true,
      $or: [
        { isRecurring: true, dayOfWeek },
        {
          isRecurring: false,
          specificDate: {
            $gte: queryDate,
            $lt: nextDay,
          },
        },
      ],
    }).sort({ startTime: 1 });

    logger.debug('Found availability entries', {
      count: availabilities.length,
      dayOfWeek,
    });

    // Find tutor's booked sessions for the date
    const bookedSessions = await Session.find({
      tutorId,
      scheduledAt: {
        $gte: queryDate,
        $lt: nextDay,
      },
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
    }).select('scheduledAt duration');

    // Generate available time slots
    const availableSlots: Array<{ startTime: string; endTime: string; isAvailable: boolean }> = [];
    const durationMinutes = parseInt(duration as string, 10);

    availabilities.forEach((avail: any) => {
      const [startHour, startMin] = avail.startTime.split(':').map(Number);
      const [endHour, endMin] = avail.endTime.split(':').map(Number);

      const slotStart = new Date(queryDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(queryDate);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // Generate slots every 30 minutes within the availability window
      let currentSlot = new Date(slotStart);
      while (currentSlot.getTime() + durationMinutes * 60000 <= slotEnd.getTime()) {
        const slotStartTime = new Date(currentSlot);
        const slotEndTime = new Date(currentSlot.getTime() + durationMinutes * 60000);

        // Check if this slot conflicts with any booked session
        const hasConflict = bookedSessions.some((session: any) => {
          const sessionStart = new Date(session.scheduledAt);
          const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);

          // Check for overlap
          return slotStartTime < sessionEnd && slotEndTime > sessionStart;
        });

        // Only include slots that don't conflict and are in the future
        if (!hasConflict && slotStartTime > new Date()) {
          availableSlots.push({
            startTime: slotStartTime.toISOString(),
            endTime: slotEndTime.toISOString(),
            isAvailable: true,
          });
        }

        // Move to next slot (30-minute intervals)
        currentSlot.setMinutes(currentSlot.getMinutes() + 30);
      }
    });

    res.json({
      tutorId,
      date: queryDate.toISOString(),
      dayOfWeek, // Include dayOfWeek for debugging
      availableSlots,
      bookedSlots: bookedSessions.map((session: any) => ({
        start: session.scheduledAt.toISOString(),
        end: new Date(session.scheduledAt.getTime() + session.duration * 60000).toISOString(),
      })),
      tutor: {
        id: tutor._id.toString(),
        name: `${tutor.firstName} ${tutor.lastName}`,
        hourlyRate: tutor.hourlyRate,
        rating: tutor.rating,
      },
      // Debug info (can be removed in production)
      debug: {
        queryDate: queryDate.toISOString(),
        dayOfWeek,
        availabilityCount: availabilities.length,
        bookedSessionsCount: bookedSessions.length,
        generatedSlotsCount: availableSlots.length,
      },
    });
  });

  // Book session with tutor
  static bookTutorSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { tutorId, title, subject, startTime, duration, description } = req.body;

    // Verify tutor exists and is available
    const tutor = await User.findOne({
      _id: tutorId,
      role: UserRole.TUTOR,
      isVerified: true,
    });

    if (!tutor) {
      throw new AppError('Tutor not found or not available', 404);
    }

    // Check for conflicts with scheduled/in-progress sessions
    const scheduledAt = new Date(startTime);
    const sessionEnd = new Date(scheduledAt.getTime() + duration * 60000);

    logger.debug('Checking for conflicts before creating session', {
      requestedStart: scheduledAt.toISOString(),
      requestedEnd: sessionEnd.toISOString(),
    });

    // Check conflicts with scheduled/in-progress sessions
    const conflictWithScheduled = await Session.findOne({
      tutorId,
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      $or: [
        {
          scheduledAt: { $lt: sessionEnd },
          $expr: {
            $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledAt],
          },
        },
      ],
    });

    if (conflictWithScheduled) {
      logger.warn('Conflict found with scheduled session', {
        conflictingSessionId: conflictWithScheduled._id.toString(),
      });
      throw new AppError('Tutor is not available at this time', 409);
    }

    // Also check for conflicts with other PENDING sessions to prevent duplicate requests
    const conflictWithPending = await Session.findOne({
      tutorId,
      status: SessionStatus.PENDING,
      $or: [
        {
          scheduledAt: { $lt: sessionEnd },
          $expr: {
            $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledAt],
          },
        },
      ],
    });

    if (conflictWithPending) {
      logger.warn('Conflict found with pending session', {
        conflictingSessionId: conflictWithPending._id.toString(),
      });
      throw new AppError('You already have a pending session request for this time slot', 409);
    }

    logger.debug('No conflicts found, creating session');

    // Calculate price
    const price = (tutor.hourlyRate || 0) * (duration / 60);

    // Check for conflicts BEFORE creating the session
    // This prevents creating sessions that will be immediately auto-rejected
    const conflictCheck = await Session.findOne({
      tutorId,
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      $or: [
        {
          scheduledAt: { $lt: sessionEnd },
          $expr: {
            $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, scheduledAt],
          },
        },
      ],
    });

    if (conflictCheck) {
      throw new AppError('Tutor is not available at this time', 409);
    }

    // Create session with PENDING status (requires tutor approval)
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
      status: SessionStatus.PENDING, // Teacher-centric: requires approval
      reminderEnabled: true,
      reminderTime: 15,
      isRecurring: false,
    });

    await session.populate('tutorId', 'firstName lastName profileImage');
    await session.populate('studentId', 'firstName lastName email');

    // Verify session was created as PENDING before sending notification
    const createdSession = await Session.findById(session._id);
    if (!createdSession || createdSession.status !== SessionStatus.PENDING) {
      logger.error('Session was not created as PENDING', {
        sessionId: session._id.toString(),
        status: createdSession?.status,
      });
      throw new AppError('Failed to create session request', 500);
    }

    // Send notification to tutor ONLY if session was successfully created as PENDING
    const io = getIO();
    if (io) {
      const student = session.studentId as any;
      logger.debug('Sending notification to tutor', {
        tutorId: tutorId.toString(),
        sessionId: session._id.toString(),
      });
      await sendNotificationToUser(io, tutorId.toString(), {
        type: 'session_request',
        title: '📅 New Session Request',
        message: `${student.firstName} ${student.lastName} has requested a ${session.subject} session: "${session.title}"`,
        data: {
          sessionId: session._id.toString(),
          studentId: session.studentId.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          subject: session.subject,
          title: session.title,
          startTime: session.scheduledAt.toISOString(),
          duration: session.duration,
        },
      });
      logger.debug('Notification sent to tutor for new session request', {
        sessionId: session._id.toString(),
      });
    } else {
      logger.warn('Socket IO not available, notification not sent', {
        sessionId: session._id.toString(),
      });
    }

    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const transformedSession = transformSession(session);
    
    // Add tutor details if populated
    if (session.tutorId && isPopulatedUser(session.tutorId)) {
      transformedSession.tutor = {
        id: session.tutorId._id.toString(),
        name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
        avatar: session.tutorId.profileImage || null,
      };
    }

    res.status(201).json({
      success: true,
      data: { session: transformedSession },
    });
  });
}
