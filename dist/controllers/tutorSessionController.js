"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSessionController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const types_1 = require("../types");
const mongoose_1 = require("mongoose");
const socket_1 = require("../socket");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../utils/logger");
const populatedTypes_1 = require("../utils/populatedTypes");
class TutorSessionController {
}
exports.TutorSessionController = TutorSessionController;
_a = TutorSessionController;
// Get all pending session requests for tutor
TutorSessionController.getPendingRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can access pending requests', 403);
    }
    // Get pagination parameters
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    // Get total count for pagination
    const total = await models_1.Session.countDocuments({
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        status: types_1.SessionStatus.PENDING,
    });
    // Get paginated pending sessions
    const pendingSessions = await models_1.Session.find({
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        status: types_1.SessionStatus.PENDING,
    })
        .populate('studentId', 'firstName lastName profileImage email')
        .sort({ createdAt: -1 }) // Newest requests first
        .skip(skip)
        .limit(limit);
    const transformed = pendingSessions.map((session) => {
        const endTime = new Date(session.scheduledAt);
        endTime.setMinutes(endTime.getMinutes() + session.duration);
        return {
            id: session._id.toString(),
            studentId: session.studentId.toString(),
            student: {
                id: session.studentId._id.toString(),
                name: `${session.studentId.firstName} ${session.studentId.lastName}`,
                email: session.studentId.email,
                avatar: session.studentId.profileImage || null,
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
    const paginationResult = (0, pagination_1.createPaginationResult)(transformed, total, page, limit);
    res.json({
        success: true,
        requests: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Tutor approves a pending session request
TutorSessionController.approveRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { id } = req.params;
    logger_1.logger.debug('Tutor approve request called', { tutorId, sessionId: id });
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can approve requests', 403);
    }
    // Find session - populate studentId for notification, but not tutorId (for comparison)
    const session = await models_1.Session.findById(id).populate('studentId', 'firstName lastName email');
    if (!session) {
        logger_1.logger.warn('Session not found for approval', { sessionId: id, tutorId });
        throw new errorHandler_1.AppError('Session request not found', 404);
    }
    logger_1.logger.debug('Session found for approval', {
        sessionId: id,
        status: session.status,
        tutorId: session.tutorId?.toString(),
    });
    // Compare tutorId using ObjectId comparison (more reliable)
    // tutorId is not populated, so it's an ObjectId
    const sessionTutorId = new mongoose_1.Types.ObjectId(session.tutorId);
    const currentTutorId = new mongoose_1.Types.ObjectId(tutorId);
    if (!sessionTutorId.equals(currentTutorId)) {
        logger_1.logger.warn('Tutor ID mismatch for session approval', { sessionId: id, tutorId });
        throw new errorHandler_1.AppError('You can only approve your own session requests', 403);
    }
    if (session.status !== types_1.SessionStatus.PENDING) {
        const currentStatus = session.status;
        logger_1.logger.warn('Session not pending for approval', { sessionId: id, currentStatus });
        if (currentStatus === types_1.SessionStatus.SCHEDULED) {
            throw new errorHandler_1.AppError('This session has already been approved', 400);
        }
        else if (currentStatus === types_1.SessionStatus.REJECTED) {
            throw new errorHandler_1.AppError('This session has already been rejected', 400);
        }
        else {
            throw new errorHandler_1.AppError(`Session is not pending approval (current status: ${currentStatus})`, 400);
        }
    }
    logger_1.logger.debug('Session is pending, proceeding with approval', {
        sessionId: session._id.toString(),
        title: session.title,
        scheduledAt: session.scheduledAt.toISOString(),
        duration: session.duration,
    });
    const scheduledAt = new Date(session.scheduledAt);
    const sessionEnd = new Date(scheduledAt.getTime() + session.duration * 60000);
    logger_1.logger.debug('Checking for conflicts', {
        sessionId: session._id.toString(),
        start: scheduledAt.toISOString(),
        end: sessionEnd.toISOString(),
        duration: session.duration,
    });
    // Get all scheduled/in-progress sessions for this tutor (excluding current session)
    const existingSessions = await models_1.Session.find({
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        _id: { $ne: new mongoose_1.Types.ObjectId(id) },
        status: { $in: [types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS] },
    })
        .select('_id scheduledAt duration status title')
        .lean();
    logger_1.logger.debug('Found existing sessions for conflict check', {
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
            logger_1.logger.warn('Session conflict detected', {
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
        logger_1.logger.info('Auto-rejecting pending session due to conflict', {
            sessionId: id,
            conflictSessionId: conflict._id.toString(),
            conflictTitle: conflict.title,
        });
        // Auto-reject the pending session since there's already a scheduled session at this time
        const rejectedSession = await models_1.Session.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), {
            $set: {
                status: types_1.SessionStatus.REJECTED,
                notes: `Auto-rejected: Conflicts with existing scheduled session "${conflict.title}" at ${conflictStart.toLocaleString()}`,
            },
        }, { new: true }).populate('studentId', 'firstName lastName email');
        // Notify student about auto-rejection
        if (rejectedSession && (0, populatedTypes_1.isPopulatedUser)(rejectedSession.studentId)) {
            const io = (0, socket_1.getIO)();
            const studentId = rejectedSession.studentId._id.toString();
            if (io) {
                await (0, socket_1.sendNotificationToUser)(io, studentId, {
                    type: 'session_rejected',
                    title: 'Session Request Auto-Rejected',
                    message: `Your session request "${rejectedSession.title}" was automatically rejected because it conflicts with an existing scheduled session at ${conflictStart.toLocaleString()}.`,
                    data: {
                        sessionId: id,
                        reason: `Conflicts with existing session "${conflict.title}"`,
                    },
                });
                logger_1.logger.debug('Notification sent to student about auto-rejection', { studentId, sessionId: id });
            }
        }
        throw new errorHandler_1.AppError(`This session request conflicts with an existing scheduled session "${conflict.title}" at ${conflictStart.toLocaleString()}. The request has been automatically rejected.`, 409);
    }
    logger_1.logger.debug('No conflicts found, proceeding with approval', { sessionId: id });
    // Use findOneAndUpdate with atomic operation to prevent duplicate approvals
    // This ensures the status is still PENDING when we update it
    const updatedSession = await models_1.Session.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(id),
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        status: types_1.SessionStatus.PENDING, // Only update if still pending (prevents duplicate approvals)
    }, {
        $set: {
            status: types_1.SessionStatus.SCHEDULED,
        },
    }, {
        new: true, // Return updated document
        runValidators: true,
    }).populate('studentId', 'firstName lastName email');
    if (!updatedSession) {
        logger_1.logger.warn('Session not found or already processed', { sessionId: id, tutorId });
        // Re-check the session status to provide better error message
        const currentSession = await models_1.Session.findById(id);
        if (!currentSession) {
            throw new errorHandler_1.AppError('Session request not found', 404);
        }
        const currentStatus = currentSession.status;
        if (currentStatus === types_1.SessionStatus.SCHEDULED) {
            throw new errorHandler_1.AppError('This session has already been approved', 400);
        }
        throw new errorHandler_1.AppError(`Session is no longer pending (current status: ${currentStatus})`, 400);
    }
    logger_1.logger.debug('[TutorSessionController] Session approved successfully, new status:', updatedSession.status);
    // Notify student
    const io = (0, socket_1.getIO)();
    // studentId is populated, so access _id
    const studentId = updatedSession.studentId._id.toString();
    if (io) {
        await (0, socket_1.sendNotificationToUser)(io, studentId, {
            type: 'session_approved',
            title: 'Session Approved',
            message: `Your session request "${updatedSession.title}" has been approved!`,
            data: { sessionId: id },
        });
    }
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + updatedSession.duration);
    res.json({
        success: true,
        message: 'Session request approved',
        session: {
            id: updatedSession._id.toString(),
            status: types_1.SessionStatus.SCHEDULED,
            scheduledAt: scheduledAt.toISOString(),
            endTime: endTime.toISOString(),
        },
    });
});
// Tutor rejects a pending session request
TutorSessionController.rejectRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can reject requests', 403);
    }
    const session = await models_1.Session.findById(id).populate('studentId');
    if (!session) {
        throw new errorHandler_1.AppError('Session request not found', 404);
    }
    if (session.tutorId.toString() !== tutorId) {
        throw new errorHandler_1.AppError('You can only reject your own session requests', 403);
    }
    if (session.status !== types_1.SessionStatus.PENDING) {
        throw new errorHandler_1.AppError('Session is not pending approval', 400);
    }
    // Reject the session
    session.status = types_1.SessionStatus.REJECTED;
    if (reason) {
        session.notes = `Rejected: ${reason}`;
    }
    await session.save();
    // Notify student
    const io = (0, socket_1.getIO)();
    const studentId = session.studentId._id.toString();
    if (io) {
        await (0, socket_1.sendNotificationToUser)(io, studentId, {
            type: 'session_rejected',
            title: 'Session Request Rejected',
            message: reason
                ? `Your session request was not approved. Reason: ${reason}`
                : `Your session request "${session.title}" was not approved.`,
            data: { sessionId: id },
        });
    }
    res.json({
        success: true,
        message: 'Session request rejected',
        session: {
            id: session._id.toString(),
            status: types_1.SessionStatus.REJECTED,
        },
    });
});
// Tutor creates a session for a student (tutor-initiated)
TutorSessionController.createSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { studentId, title, subject, scheduledAt, duration, description } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can create sessions', 403);
    }
    if (!studentId || !title || !subject || !scheduledAt || !duration) {
        throw new errorHandler_1.AppError('Missing required fields', 400);
    }
    // Verify student exists
    const student = await models_1.User.findById(studentId);
    if (!student || student.role !== types_1.UserRole.STUDENT) {
        throw new errorHandler_1.AppError('Student not found', 404);
    }
    // Check for conflicts
    const sessionStart = new Date(scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
    const conflict = await models_1.Session.findOne({
        tutorId,
        status: { $in: [types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS] },
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
        throw new errorHandler_1.AppError('You already have a session scheduled at this time', 409);
    }
    // Get tutor for hourly rate
    const tutor = await models_1.User.findById(tutorId);
    const price = (tutor?.hourlyRate || 0) * (duration / 60);
    // Create session (directly scheduled, no approval needed)
    const session = await models_1.Session.create({
        studentId: new mongoose_1.Types.ObjectId(studentId),
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        title,
        subject,
        type: 'tutoring',
        scheduledAt: sessionStart,
        duration,
        description,
        price,
        status: types_1.SessionStatus.SCHEDULED, // Tutor-initiated = directly scheduled
        reminderEnabled: true,
        reminderTime: 15,
        isRecurring: false,
    });
    await session.populate('studentId', 'firstName lastName profileImage');
    await session.populate('tutorId', 'firstName lastName profileImage');
    // Notify student
    const io = (0, socket_1.getIO)();
    if (io) {
        await (0, socket_1.sendNotificationToUser)(io, studentId, {
            type: 'session_scheduled',
            title: 'New Session Scheduled',
            message: `Your tutor has scheduled a session: "${title}"`,
            data: { sessionId: session._id.toString() },
        });
    }
    const endTime = new Date(sessionStart);
    endTime.setMinutes(endTime.getMinutes() + duration);
    const transformedSession = {
        id: session._id.toString(),
        studentId: session.studentId.toString(),
        student: {
            id: session.studentId._id.toString(),
            name: `${session.studentId.firstName} ${session.studentId.lastName}`,
            avatar: session.studentId.profileImage || null,
        },
        title: session.title,
        subject: session.subject,
        type: session.type,
        startTime: sessionStart.toISOString(),
        endTime: endTime.toISOString(),
        duration: session.duration,
        status: session.status,
        price: session.price,
        description: session.description,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
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
TutorSessionController.rescheduleSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { id } = req.params;
    const { scheduledAt, duration } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can reschedule sessions', 403);
    }
    const session = await models_1.Session.findById(id).populate('studentId');
    if (!session) {
        throw new errorHandler_1.AppError('Session not found', 404);
    }
    if (session.tutorId.toString() !== tutorId) {
        throw new errorHandler_1.AppError('You can only reschedule your own sessions', 403);
    }
    if (![types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.PENDING].includes(session.status)) {
        throw new errorHandler_1.AppError('Only scheduled or pending sessions can be rescheduled', 400);
    }
    const newStartTime = scheduledAt ? new Date(scheduledAt) : session.scheduledAt;
    const newDuration = duration || session.duration;
    const newEndTime = new Date(newStartTime.getTime() + newDuration * 60000);
    // Check for conflicts (excluding current session)
    const conflict = await models_1.Session.findOne({
        tutorId,
        _id: { $ne: id },
        status: { $in: [types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS] },
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
        throw new errorHandler_1.AppError('You already have a session scheduled at this time', 409);
    }
    // Update session
    session.scheduledAt = newStartTime;
    session.duration = newDuration;
    if (session.status === types_1.SessionStatus.PENDING) {
        session.status = types_1.SessionStatus.SCHEDULED; // Auto-approve when rescheduled
    }
    await session.save();
    // Notify student
    const io = (0, socket_1.getIO)();
    const studentId = session.studentId._id.toString();
    if (io) {
        await (0, socket_1.sendNotificationToUser)(io, studentId, {
            type: 'session_rescheduled',
            title: 'Session Rescheduled',
            message: `Your session "${session.title}" has been rescheduled to ${newStartTime.toLocaleString()}`,
            data: { sessionId: id },
        });
    }
    res.json({
        success: true,
        message: 'Session rescheduled successfully',
        session: {
            id: session._id.toString(),
            scheduledAt: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
            duration: newDuration,
        },
    });
});
// Tutor cancels a session
TutorSessionController.cancelSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body; // Optional cancellation reason
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can cancel sessions', 403);
    }
    const session = await models_1.Session.findById(id).populate('studentId');
    if (!session) {
        throw new errorHandler_1.AppError('Session not found', 404);
    }
    if (session.tutorId.toString() !== tutorId) {
        throw new errorHandler_1.AppError('You can only cancel your own sessions', 403);
    }
    if (![types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.PENDING].includes(session.status)) {
        throw new errorHandler_1.AppError('Only scheduled or pending sessions can be cancelled', 400);
    }
    // Cancel the session
    session.status = types_1.SessionStatus.CANCELLED;
    if (reason) {
        session.notes = `Cancelled by tutor: ${reason}`;
    }
    await session.save();
    // Notify student
    const io = (0, socket_1.getIO)();
    const studentId = session.studentId._id.toString();
    if (io) {
        await (0, socket_1.sendNotificationToUser)(io, studentId, {
            type: 'session_cancelled',
            title: 'Session Cancelled',
            message: reason
                ? `Your session "${session.title}" has been cancelled. Reason: ${reason}`
                : `Your session "${session.title}" has been cancelled.`,
            data: { sessionId: id },
        });
    }
    res.json({
        success: true,
        message: 'Session cancelled successfully',
        session: {
            id: session._id.toString(),
            status: types_1.SessionStatus.CANCELLED,
        },
    });
});
//# sourceMappingURL=tutorSessionController.js.map