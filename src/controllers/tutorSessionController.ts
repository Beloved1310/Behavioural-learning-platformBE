import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Session, User } from '../models';
import { UserRole, SessionStatus } from '../types';
import { Types } from 'mongoose';
import { getIO, sendNotificationToUser } from '../socket';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { logger } from '../utils/logger';
import { transformSession } from '../utils/transformations';
import { isPopulatedUser, toObjectIdString } from '../utils/populatedTypes';

export class TutorSessionController {
  // Get all pending session requests for tutor
  static getPendingRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can access pending requests', 403);
    }

    // Get pagination parameters
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    // Get total count for pagination
    const total = await Session.countDocuments({
      tutorId: new Types.ObjectId(tutorId),
      status: SessionStatus.PENDING,
    });

    // Get paginated pending sessions
    const pendingSessions = await Session.find({
      tutorId: new Types.ObjectId(tutorId),
      status: SessionStatus.PENDING,
    })
      .populate('studentId', 'firstName lastName profileImage email')
      .sort({ createdAt: -1 }) // Newest requests first
      .skip(skip)
      .limit(limit);

    const transformed = (pendingSessions as any[]).map((session) => {
      const endTime = new Date(session.scheduledAt);
      endTime.setMinutes(endTime.getMinutes() + session.duration);

      return {
        id: session._id.toString(),
        studentId: session.studentId.toString(),
        student: {
          id: (session.studentId as any)._id.toString(),
          name: `${(session.studentId as any).firstName} ${(session.studentId as any).lastName}`,
          email: (session.studentId as any).email,
          avatar: (session.studentId as any).profileImage || null,
        },
        title: session.title,
        subject: session.subject,
        description: session.description,
        scheduledAt: session.scheduledAt.toISOString(),
        endTime: endTime.toISOString(),
        duration: session.duration,
        price: session.price,
        requestedAt: session.createdAt.toISOString(),
      };
    });

    // Return paginated response
    const paginationResult = createPaginationResult(transformed, total, page, limit);
    res.json({
      success: true,
      requests: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Tutor approves a pending session request
  static approveRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { id } = req.params;

    logger.debug('Tutor approve request called', { tutorId, sessionId: id });

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can approve requests', 403);
    }

    // Find session - populate studentId for notification, but not tutorId (for comparison)
    const session = await Session.findById(id).populate('studentId', 'firstName lastName email');

    if (!session) {
      logger.warn('Session not found for approval', { sessionId: id, tutorId });
      throw new AppError('Session request not found', 404);
    }

    logger.debug('Session found for approval', {
      sessionId: id,
      status: session.status,
      tutorId: session.tutorId?.toString(),
    });

    // Compare tutorId using ObjectId comparison (more reliable)
    // tutorId is not populated, so it's an ObjectId
    const sessionTutorId = new Types.ObjectId(session.tutorId as Types.ObjectId);
    const currentTutorId = new Types.ObjectId(tutorId);

    if (!sessionTutorId.equals(currentTutorId)) {
      logger.warn('Tutor ID mismatch for session approval', { sessionId: id, tutorId });
      throw new AppError('You can only approve your own session requests', 403);
    }

    if (session.status !== SessionStatus.PENDING) {
      const currentStatus = session.status;
      logger.warn('Session not pending for approval', { sessionId: id, currentStatus });
      if (currentStatus === SessionStatus.SCHEDULED) {
        throw new AppError('This session has already been approved', 400);
      } else if (currentStatus === SessionStatus.REJECTED) {
        throw new AppError('This session has already been rejected', 400);
      } else {
        throw new AppError(
          `Session is not pending approval (current status: ${currentStatus})`,
          400
        );
      }
    }

    logger.debug('Session is pending, proceeding with approval', {
      sessionId: session._id.toString(),
      title: session.title,
      scheduledAt: session.scheduledAt.toISOString(),
      duration: session.duration,
    });

    const scheduledAt = new Date(session.scheduledAt);
    const sessionEnd = new Date(scheduledAt.getTime() + session.duration * 60000);

    logger.debug('Checking for conflicts', {
      sessionId: session._id.toString(),
      start: scheduledAt.toISOString(),
      end: sessionEnd.toISOString(),
      duration: session.duration,
    });

    // Get all scheduled/in-progress sessions for this tutor (excluding current session)
    const existingSessions = await Session.find({
      tutorId: new Types.ObjectId(tutorId),
      _id: { $ne: new Types.ObjectId(id) },
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
    })
      .select('_id scheduledAt duration status title')
      .lean();

    logger.debug('Found existing sessions for conflict check', {
      count: existingSessions.length,
      sessionId: id,
    });

    // Check for time overlaps manually
    let conflict = null;
    for (const existingSession of existingSessions) {
      const existingStart = new Date(existingSession.scheduledAt);
      const existingEnd = new Date(existingStart.getTime() + existingSession.duration * 60000);

      // Sessions overlap if: newStart < existingEnd AND newEnd > existingStart
      const overlaps = scheduledAt < existingEnd && sessionEnd > existingStart;

      if (overlaps) {
        conflict = existingSession;
        logger.warn('Session conflict detected', {
          newSessionId: session._id.toString(),
          newSessionTitle: session.title,
          newSessionStart: scheduledAt.toISOString(),
          newSessionEnd: sessionEnd.toISOString(),
          existingSessionId: existingSession._id.toString(),
          existingSessionTitle: existingSession.title,
          existingSessionStart: existingStart.toISOString(),
          existingSessionEnd: existingEnd.toISOString(),
        });
        break;
      }
    }

    if (conflict) {
      const conflictStart = new Date(conflict.scheduledAt);
      const conflictEnd = new Date(conflictStart.getTime() + conflict.duration * 60000);

      logger.info('Auto-rejecting pending session due to conflict', {
        sessionId: id,
        conflictSessionId: conflict._id.toString(),
        conflictTitle: conflict.title,
      });

      // Auto-reject the pending session since there's already a scheduled session at this time
      const rejectedSession = await Session.findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          $set: {
            status: SessionStatus.REJECTED,
            notes: `Auto-rejected: Conflicts with existing scheduled session "${conflict.title}" at ${conflictStart.toLocaleString()}`,
          },
        },
        { new: true }
      ).populate('studentId', 'firstName lastName email');

      // Notify student about auto-rejection
      if (rejectedSession && isPopulatedUser(rejectedSession.studentId)) {
        const io = getIO();
        const studentId = rejectedSession.studentId._id.toString();
        if (io) {
          await sendNotificationToUser(io, studentId, {
            type: 'session_rejected',
            title: 'Session Request Auto-Rejected',
            message: `Your session request "${rejectedSession.title}" was automatically rejected because it conflicts with an existing scheduled session at ${conflictStart.toLocaleString()}.`,
            data: {
              sessionId: id,
              reason: `Conflicts with existing session "${conflict.title}"`,
            },
          });
          logger.debug('Notification sent to student about auto-rejection', { studentId, sessionId: id });
        }
      }

      throw new AppError(
        `This session request conflicts with an existing scheduled session "${conflict.title}" at ${conflictStart.toLocaleString()}. The request has been automatically rejected.`,
        409
      );
    }

    logger.debug('No conflicts found, proceeding with approval', { sessionId: id });

    // Use findOneAndUpdate with atomic operation to prevent duplicate approvals
    // This ensures the status is still PENDING when we update it
    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        tutorId: new Types.ObjectId(tutorId),
        status: SessionStatus.PENDING, // Only update if still pending (prevents duplicate approvals)
      },
      {
        $set: {
          status: SessionStatus.SCHEDULED,
        },
      },
      {
        new: true, // Return updated document
        runValidators: true,
      }
    ).populate('studentId', 'firstName lastName email');

    if (!updatedSession) {
      logger.warn('Session not found or already processed', { sessionId: id, tutorId });
      // Re-check the session status to provide better error message
      const currentSession = await Session.findById(id);
      if (!currentSession) {
        throw new AppError('Session request not found', 404);
      }
      const currentStatus = currentSession.status;
      if (currentStatus === SessionStatus.SCHEDULED) {
        throw new AppError('This session has already been approved', 400);
      }
      throw new AppError(`Session is no longer pending (current status: ${currentStatus})`, 400);
    }

    logger.debug(
      '[TutorSessionController] Session approved successfully, new status:',
      (updatedSession as any).status
    );

    // Notify student
    const io = getIO();
    // studentId is populated, so access _id
    const studentId = (updatedSession as any).studentId._id.toString();
    if (io) {
      await sendNotificationToUser(io, studentId, {
        type: 'session_approved',
        title: 'Session Approved',
        message: `Your session request "${(updatedSession as any).title}" has been approved!`,
        data: { sessionId: id },
      });
    }

    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + (updatedSession as any).duration);

    res.json({
      success: true,
      message: 'Session request approved',
      session: {
        id: (updatedSession as any)._id.toString(),
        status: SessionStatus.SCHEDULED,
        scheduledAt: scheduledAt.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
  });

  // Tutor rejects a pending session request
  static rejectRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can reject requests', 403);
    }

    const session = await Session.findById(id).populate('studentId');

    if (!session) {
      throw new AppError('Session request not found', 404);
    }

    if ((session as any).tutorId.toString() !== tutorId) {
      throw new AppError('You can only reject your own session requests', 403);
    }

    if ((session as any).status !== SessionStatus.PENDING) {
      throw new AppError('Session is not pending approval', 400);
    }

    // Reject the session
    (session as any).status = SessionStatus.REJECTED;
    if (reason) {
      (session as any).notes = `Rejected: ${reason}`;
    }
    await (session as any).save();

    // Notify student
    const io = getIO();
    const studentId = (session as any).studentId._id.toString();
    if (io) {
      await sendNotificationToUser(io, studentId, {
        type: 'session_rejected',
        title: 'Session Request Rejected',
        message: reason
          ? `Your session request was not approved. Reason: ${reason}`
          : `Your session request "${(session as any).title}" was not approved.`,
        data: { sessionId: id },
      });
    }

    res.json({
      success: true,
      message: 'Session request rejected',
      session: {
        id: (session as any)._id.toString(),
        status: SessionStatus.REJECTED,
      },
    });
  });

  // Tutor creates a session for a student (tutor-initiated)
  static createSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { studentId, title, subject, scheduledAt, duration, description } = req.body;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can create sessions', 403);
    }

    if (!studentId || !title || !subject || !scheduledAt || !duration) {
      throw new AppError('Missing required fields', 400);
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || (student as any).role !== UserRole.STUDENT) {
      throw new AppError('Student not found', 404);
    }

    // Check for conflicts
    const sessionStart = new Date(scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

    const conflict = await Session.findOne({
      tutorId,
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      $or: [
        {
          scheduledAt: { $lt: sessionEnd },
          $expr: {
            $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, sessionStart],
          },
        },
      ],
    });

    if (conflict) {
      throw new AppError('You already have a session scheduled at this time', 409);
    }

    // Get tutor for hourly rate
    const tutor = await User.findById(tutorId);
    const price = ((tutor as any)?.hourlyRate || 0) * (duration / 60);

    // Create session (directly scheduled, no approval needed)
    const session = await Session.create({
      studentId: new Types.ObjectId(studentId) as any,
      tutorId: new Types.ObjectId(tutorId) as any,
      title,
      subject,
      type: 'tutoring',
      scheduledAt: sessionStart,
      duration,
      description,
      price,
      status: SessionStatus.SCHEDULED, // Tutor-initiated = directly scheduled
      reminderEnabled: true,
      reminderTime: 15,
      isRecurring: false,
    });

    await session.populate('studentId', 'firstName lastName profileImage');
    await session.populate('tutorId', 'firstName lastName profileImage');

    // Notify student
    const io = getIO();
    if (io) {
      await sendNotificationToUser(io, studentId, {
        type: 'session_scheduled',
        title: 'New Session Scheduled',
        message: `Your tutor has scheduled a session: "${title}"`,
        data: { sessionId: (session as any)._id.toString() },
      });
    }

    const endTime = new Date(sessionStart);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const transformedSession = {
      id: (session as any)._id.toString(),
      studentId: (session as any).studentId.toString(),
      student: {
        id: ((session as any).studentId as any)._id.toString(),
        name: `${((session as any).studentId as any).firstName} ${((session as any).studentId as any).lastName}`,
        avatar: ((session as any).studentId as any).profileImage || null,
      },
      title: (session as any).title,
      subject: (session as any).subject,
      type: (session as any).type,
      startTime: sessionStart.toISOString(),
      endTime: endTime.toISOString(),
      duration: (session as any).duration,
      status: (session as any).status,
      price: (session as any).price,
      description: (session as any).description,
      createdAt: (session as any).createdAt,
      updatedAt: (session as any).updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: {
        session: transformedSession,
      },
    });
  });

  // Tutor reschedules a session
  static rescheduleSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { id } = req.params;
    const { scheduledAt, duration } = req.body;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can reschedule sessions', 403);
    }

    const session = await Session.findById(id).populate('studentId');

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if ((session as any).tutorId.toString() !== tutorId) {
      throw new AppError('You can only reschedule your own sessions', 403);
    }

    if (![SessionStatus.SCHEDULED, SessionStatus.PENDING].includes((session as any).status)) {
      throw new AppError('Only scheduled or pending sessions can be rescheduled', 400);
    }

    const newStartTime = scheduledAt ? new Date(scheduledAt) : (session as any).scheduledAt;
    const newDuration = duration || (session as any).duration;
    const newEndTime = new Date(newStartTime.getTime() + newDuration * 60000);

    // Check for conflicts (excluding current session)
    const conflict = await Session.findOne({
      tutorId,
      _id: { $ne: id },
      status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] },
      $or: [
        {
          scheduledAt: { $lt: newEndTime },
          $expr: {
            $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, newStartTime],
          },
        },
      ],
    });

    if (conflict) {
      throw new AppError('You already have a session scheduled at this time', 409);
    }

    // Update session
    (session as any).scheduledAt = newStartTime;
    (session as any).duration = newDuration;
    if ((session as any).status === SessionStatus.PENDING) {
      (session as any).status = SessionStatus.SCHEDULED; // Auto-approve when rescheduled
    }
    await (session as any).save();

    // Notify student
    const io = getIO();
    const studentId = (session as any).studentId._id.toString();
    if (io) {
      await sendNotificationToUser(io, studentId, {
        type: 'session_rescheduled',
        title: 'Session Rescheduled',
        message: `Your session "${(session as any).title}" has been rescheduled to ${newStartTime.toLocaleString()}`,
        data: { sessionId: id },
      });
    }

    res.json({
      success: true,
      message: 'Session rescheduled successfully',
      session: {
        id: (session as any)._id.toString(),
        scheduledAt: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        duration: newDuration,
      },
    });
  });

  // Tutor cancels a session
  static cancelSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body; // Optional cancellation reason

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can cancel sessions', 403);
    }

    const session = await Session.findById(id).populate('studentId');

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if ((session as any).tutorId.toString() !== tutorId) {
      throw new AppError('You can only cancel your own sessions', 403);
    }

    if (![SessionStatus.SCHEDULED, SessionStatus.PENDING].includes((session as any).status)) {
      throw new AppError('Only scheduled or pending sessions can be cancelled', 400);
    }

    // Cancel the session
    (session as any).status = SessionStatus.CANCELLED;
    if (reason) {
      (session as any).notes = `Cancelled by tutor: ${reason}`;
    }
    await (session as any).save();

    // Notify student
    const io = getIO();
    const studentId = (session as any).studentId._id.toString();
    if (io) {
      await sendNotificationToUser(io, studentId, {
        type: 'session_cancelled',
        title: 'Session Cancelled',
        message: reason
          ? `Your session "${(session as any).title}" has been cancelled. Reason: ${reason}`
          : `Your session "${(session as any).title}" has been cancelled.`,
        data: { sessionId: id },
      });
    }

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      session: {
        id: (session as any)._id.toString(),
        status: SessionStatus.CANCELLED,
      },
    });
  });
}
