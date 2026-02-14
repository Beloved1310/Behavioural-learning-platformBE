"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsController = void 0;
const mongoose_1 = require("mongoose");
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../types");
const socket_1 = require("../socket");
const socket_2 = require("../socket");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../utils/logger");
const transformations_1 = require("../utils/transformations");
const populatedTypes_1 = require("../utils/populatedTypes");
const QuizAttemptRepository_1 = __importDefault(require("../repositories/QuizAttemptRepository"));
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
class SessionsController {
}
exports.SessionsController = SessionsController;
_a = SessionsController;
// Get all sessions for current user
SessionsController.getUserSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, startDate, endDate, type } = req.query;
    const query = {};
    // Filter by role
    if (userRole === types_1.UserRole.STUDENT) {
        query.studentId = userId;
    }
    else if (userRole === types_1.UserRole.TUTOR) {
        query.tutorId = userId;
    }
    else {
        // Parents can see their children's sessions
        const children = await models_1.User.find({ parentId: userId });
        const childrenIds = children.map((child) => child._id.toString());
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
            query.scheduledAt.$gte = new Date(startDate);
        }
        if (endDate) {
            query.scheduledAt.$lte = new Date(endDate);
        }
    }
    // Get pagination parameters
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 1000);
    // Get total count for pagination
    const total = await models_1.Session.countDocuments(query);
    // Get paginated sessions
    const sessions = await models_1.Session.find(query)
        .populate('studentId', 'firstName lastName profileImage')
        .populate('tutorId', 'firstName lastName profileImage')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit);
    const transformedSessions = sessions.map((session) => (0, transformations_1.transformSession)(session));
    // Return paginated response
    const paginationResult = (0, pagination_1.createPaginationResult)(transformedSessions, total, page, limit);
    res.json({
        success: true,
        data: {
            sessions: paginationResult.data,
            pagination: paginationResult.pagination,
        },
    });
});
// Get session by ID
SessionsController.getSessionById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const session = await models_1.Session.findById(id)
        .populate('studentId', 'firstName lastName profileImage email')
        .populate('tutorId', 'firstName lastName profileImage email');
    if (!session) {
        throw new errorHandler_1.AppError('Session not found', 404);
    }
    // Check if user has access to this session
    // Use ObjectId comparison for reliability
    const currentUserId = new mongoose_1.Types.ObjectId(userId);
    // Check if user is the student (studentId is populated, so it has _id)
    const studentIdObj = (0, populatedTypes_1.toObjectId)(session.studentId);
    const isStudent = studentIdObj?.equals(currentUserId) ?? false;
    // Check if user is the tutor (tutorId may be populated or null)
    let isTutor = false;
    if (session.tutorId) {
        const tutorIdObj = (0, populatedTypes_1.toObjectId)(session.tutorId);
        isTutor = tutorIdObj?.equals(currentUserId) ?? false;
    }
    if (!isStudent && !isTutor) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    const endTime = new Date(session.scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + session.duration);
    const transformedSession = (0, transformations_1.transformSession)(session);
    // Add student and tutor details if populated
    if ((0, populatedTypes_1.isPopulatedUser)(session.studentId)) {
        transformedSession.student = {
            id: session.studentId._id.toString(),
            name: `${session.studentId.firstName} ${session.studentId.lastName}`,
            avatar: session.studentId.profileImage || null,
            email: session.studentId.email || undefined,
        };
    }
    if (session.tutorId && (0, populatedTypes_1.isPopulatedUser)(session.tutorId)) {
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
SessionsController.createSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { title, subject, type, startTime, endTime, duration, tutorId, description, isRecurring, recurringPattern, reminderEnabled, reminderTime, } = req.body;
    // Calculate duration if not provided
    let sessionDuration = duration;
    const scheduledAt = new Date(startTime);
    if (!sessionDuration && endTime) {
        // Calculate duration from startTime and endTime
        const endDateTime = new Date(endTime);
        const durationMs = endDateTime.getTime() - scheduledAt.getTime();
        sessionDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        logger_1.logger.debug('Duration calculation', {
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
        throw new errorHandler_1.AppError(`Duration must be between 15 and 180 minutes. Calculated duration: ${sessionDuration} minutes. ` +
            `Please ensure endTime is on the same day as startTime and represents the session end time, not a future date.`, 400);
    }
    // Check if a session already exists for this student, tutor, and overlapping time slot
    // This prevents duplicate sessions when frontend calls multiple endpoints
    if (tutorId) {
        const sessionEnd = new Date(scheduledAt.getTime() + sessionDuration * 60000);
        // Find existing sessions with overlapping time slots
        const existingSessions = await models_1.Session.find({
            studentId: userId,
            tutorId: tutorId,
            status: {
                $in: [types_1.SessionStatus.PENDING, types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS],
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
            logger_1.logger.debug('Duplicate/overlapping session detected, returning existing session', {
                sessionId: existingSession._id.toString(),
            });
            await existingSession.populate('tutorId', 'firstName lastName profileImage');
            await existingSession.populate('studentId', 'firstName lastName');
            const transformedSession = (0, transformations_1.transformSession)(existingSession);
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
    const session = await models_1.Session.create({
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
    const transformedSession = (0, transformations_1.transformSession)(session);
    // Add tutor details if populated
    if (session.tutorId && (0, populatedTypes_1.isPopulatedUser)(session.tutorId)) {
        transformedSession.tutor = {
            id: session.tutorId._id.toString(),
            name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
            avatar: session.tutorId.profileImage || null,
        };
    }
    // Send notification to tutor if session has a tutor
    if (session.tutorId) {
        const student = await models_1.User.findById(session.studentId);
        const io = (0, socket_1.getIO)();
        if (io && student) {
            const tutorIdString = (0, populatedTypes_1.toObjectIdString)(session.tutorId);
            if (tutorIdString) {
                await (0, socket_2.sendNotificationToUser)(io, tutorIdString, {
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
SessionsController.updateSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    const session = await models_1.Session.findById(id);
    if (!session) {
        throw new errorHandler_1.AppError('Session not found', 404);
    }
    // Check if user can update this session
    if (session.studentId.toString() !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
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
                session[key] = updates[key];
            }
        }
    });
    await session.save();
    await session.populate('tutorId', 'firstName lastName profileImage');
    // Send notification to tutor if session was updated and has a tutor
    if (session.tutorId) {
        const student = await models_1.User.findById(session.studentId);
        const io = (0, socket_1.getIO)();
        if (io && student) {
            const tutorIdString = (0, populatedTypes_1.toObjectIdString)(session.tutorId);
            if (tutorIdString) {
                await (0, socket_2.sendNotificationToUser)(io, tutorIdString, {
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
    const transformedSession = (0, transformations_1.transformSession)(session);
    // Add tutor details if populated
    if (session.tutorId && (0, populatedTypes_1.isPopulatedUser)(session.tutorId)) {
        transformedSession.tutor = {
            id: session.tutorId._id.toString(),
            name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
            avatar: session.tutorId.profileImage || null,
        };
    }
    res.json({ session: transformedSession });
});
// Delete session
SessionsController.deleteSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const session = await models_1.Session.findById(id);
    if (!session) {
        throw new errorHandler_1.AppError('Session not found', 404);
    }
    // Check if user can delete this session
    if (session.studentId.toString() !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    // Send notification to tutor if session has a tutor
    if (session.tutorId) {
        const student = await models_1.User.findById(session.studentId);
        const io = (0, socket_1.getIO)();
        if (io && student) {
            const tutorIdString = (0, populatedTypes_1.toObjectIdString)(session.tutorId);
            if (tutorIdString) {
                await (0, socket_2.sendNotificationToUser)(io, tutorIdString, {
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
    await models_1.Session.findByIdAndDelete(id);
    res.json({ success: true, message: 'Session deleted successfully' });
});
// Update session status
SessionsController.updateSessionStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const session = await models_1.Session.findById(id);
    if (!session) {
        throw new errorHandler_1.AppError('Session not found', 404);
    }
    // Check if user has access
    // Use ObjectId comparison for reliability
    const currentUserId = new mongoose_1.Types.ObjectId(userId);
    const studentIdObj = new mongoose_1.Types.ObjectId(session.studentId);
    const isStudent = studentIdObj.equals(currentUserId);
    // Use ObjectId comparison for reliability (tutorId may be populated or not)
    let isTutor = false;
    if (session.tutorId) {
        const tutorIdObj = (0, populatedTypes_1.toObjectId)(session.tutorId);
        isTutor = tutorIdObj?.equals(currentUserId) ?? false;
    }
    if (!isStudent && !isTutor) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    const previousStatus = session.status;
    session.status = status;
    await session.save();
    await session.populate('tutorId', 'firstName lastName profileImage');
    await session.populate('studentId', 'firstName lastName');
    // Award points to student when session is completed
    if (status === types_1.SessionStatus.COMPLETED &&
        previousStatus !== types_1.SessionStatus.COMPLETED &&
        isStudent) {
        const student = await models_1.User.findById(session.studentId);
        if (student) {
            const pointsAwarded = 25; // Points for completing a tutoring session
            const currentPoints = student.totalPoints || 0;
            student.totalPoints = currentPoints + pointsAwarded;
            await student.save();
        }
    }
    // When a session moves to COMPLETED for the first time, auto-update all of the student's goals
    if (status === types_1.SessionStatus.COMPLETED && previousStatus !== types_1.SessionStatus.COMPLETED) {
        try {
            const studentId = session.studentId.toString();
            // Recalculate the unified "current" progress value based on all quizzes + completed sessions
            const [quizzes, completedSessions] = await Promise.all([
                QuizAttemptRepository_1.default.find({ studentId: new mongoose_1.Types.ObjectId(studentId) }),
                models_1.Session.find({ studentId: new mongoose_1.Types.ObjectId(studentId), status: types_1.SessionStatus.COMPLETED }),
            ]);
            const currentCount = quizzes.length + completedSessions.length;
            const goals = await GoalRepository_1.default.findByUser(studentId, true);
            await Promise.all(goals.map((goal) => GoalRepository_1.default.updateProgress(goal._id.toString(), currentCount)));
            logger_1.logger.debug('[SessionsController.updateSessionStatus] Goal progress auto-updated', {
                studentId,
                goalsUpdated: goals.length,
                currentCount,
            });
        }
        catch (error) {
            logger_1.logger.error('[SessionsController.updateSessionStatus] Failed to auto-update goal progress', error, {
                sessionId: session._id.toString(),
                studentId: session.studentId.toString(),
            });
        }
    }
    // Send notification to tutor if session status changed to cancelled
    if (status === types_1.SessionStatus.CANCELLED &&
        session.tutorId &&
        previousStatus !== types_1.SessionStatus.CANCELLED) {
        const student = await models_1.User.findById(session.studentId);
        const io = (0, socket_1.getIO)();
        if (io && student) {
            const tutorIdString = (0, populatedTypes_1.toObjectIdString)(session.tutorId);
            if (tutorIdString) {
                await (0, socket_2.sendNotificationToUser)(io, tutorIdString, {
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
        pointsAwarded: status === types_1.SessionStatus.COMPLETED &&
            previousStatus !== types_1.SessionStatus.COMPLETED &&
            isStudent
            ? 25
            : undefined,
    });
});
// Get session statistics
SessionsController.getSessionStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const query = {};
    if (userRole === types_1.UserRole.STUDENT) {
        query.studentId = userId;
    }
    else if (userRole === types_1.UserRole.TUTOR) {
        query.tutorId = userId;
    }
    // Get counts by status
    const totalSessions = await models_1.Session.countDocuments(query);
    const scheduledSessions = await models_1.Session.countDocuments({
        ...query,
        status: types_1.SessionStatus.SCHEDULED,
    });
    const completedSessions = await models_1.Session.countDocuments({
        ...query,
        status: types_1.SessionStatus.COMPLETED,
    });
    const missedSessions = await models_1.Session.countDocuments({ ...query, status: types_1.SessionStatus.MISSED });
    const cancelledSessions = await models_1.Session.countDocuments({
        ...query,
        status: types_1.SessionStatus.CANCELLED,
    });
    // Get upcoming sessions count
    const upcomingSessions = await models_1.Session.countDocuments({
        ...query,
        scheduledAt: { $gte: new Date() },
        status: types_1.SessionStatus.SCHEDULED,
    });
    // Get today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todaysSessions = await models_1.Session.countDocuments({
        ...query,
        scheduledAt: {
            $gte: today,
            $lt: tomorrow,
        },
        status: types_1.SessionStatus.SCHEDULED,
    });
    // Calculate average rating (for students viewing tutor sessions)
    const sessionsWithRatings = await models_1.Session.find({
        ...query,
        rating: { $exists: true, $ne: null },
    }).select('rating');
    const averageRating = sessionsWithRatings.length > 0
        ? sessionsWithRatings.reduce((sum, s) => sum + (s.rating || 0), 0) /
            sessionsWithRatings.length
        : 0;
    // Calculate total study hours from completed sessions
    const completedSessionsData = await models_1.Session.find({
        ...query,
        status: types_1.SessionStatus.COMPLETED,
    }).select('duration');
    const totalDurationMinutes = completedSessionsData.reduce((sum, s) => {
        return sum + (s.duration || 0);
    }, 0);
    const totalStudyHours = Math.round((totalDurationMinutes / 60) * 10) / 10; // Round to 1 decimal place
    // Calculate average session duration
    const averageSessionDuration = completedSessionsData.length > 0
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
SessionsController.searchTutors = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { subject, query, page = '1', limit = '7' } = req.query;
    logger_1.logger.debug('Tutor search request received', {
        subject,
        query,
        page,
        limit,
        userId: req.user?.id,
    });
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 7;
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = {
        role: types_1.UserRole.TUTOR,
    };
    // Subject filter logic:
    // - If 'all' or not provided: Return ALL tutors (no subject filter)
    // - If specific subject: Return tutors with that subject OR tutors with no subjects (empty array)
    //   This ensures tutors who haven't updated their subjects are still shown
    const subjectFilter = {};
    if (subject && subject !== 'all') {
        // Match tutors who have the subject OR tutors with no subjects (empty/null array)
        subjectFilter.$or = [
            { subjects: { $regex: new RegExp(`^${subject}$`, 'i') } }, // Has the subject
            { subjects: { $size: 0 } }, // Empty subjects array
            { subjects: { $exists: false } }, // Subjects field doesn't exist
            { subjects: null }, // Subjects is null
        ];
        logger_1.logger.debug('Subject filter applied', { subject, note: 'Including tutors with no subjects' });
    }
    else {
        // "All Subjects" - no subject filter, return all tutors
        logger_1.logger.debug('All subjects selected - returning all tutors');
    }
    // Optimized search query - search in name, bio, and subjects
    const searchFilter = {};
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
        logger_1.logger.debug('Search query applied', { searchTerm, regexPattern: searchRegex.toString() });
    }
    // Combine filters using $and if both exist
    const combinedFilters = [];
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
        }
        else {
            // Multiple filters, use $and
            searchQuery.$and = combinedFilters;
        }
    }
    // Get total count for pagination
    const totalTutors = await models_1.User.countDocuments(searchQuery);
    logger_1.logger.debug('Tutor search query executed', {
        totalTutors,
        query: JSON.stringify(searchQuery),
    });
    // Get tutors with pagination
    const tutors = await models_1.User.find(searchQuery)
        .select('firstName lastName profileImage subjects hourlyRate rating totalSessions bio')
        .sort({ rating: -1, totalSessions: -1 })
        .skip(skip)
        .limit(limitNum);
    logger_1.logger.debug('Tutors returned from search', {
        count: tutors.length,
        page: pageNum,
        limit: limitNum,
    });
    if (tutors.length === 0) {
        logger_1.logger.debug('No tutors found, checking if query is too restrictive');
        // Try a simpler query to see if there are any tutors at all
        const simpleQuery = { role: types_1.UserRole.TUTOR };
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
        const simpleCount = await models_1.User.countDocuments(simpleQuery);
        logger_1.logger.debug('Tutors found without verification filters', { count: simpleCount });
    }
    const transformedTutors = tutors.map(transformations_1.transformTutor);
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
    logger_1.logger.debug('Tutor search response sent', {
        tutorsCount: transformedTutors.length,
        pagination: response.pagination,
    });
    res.json(response);
});
// Get tutor availability (for students to see available slots)
SessionsController.getTutorAvailability = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tutorId } = req.params;
    const { date, duration = 60 } = req.query; // duration in minutes, default 60
    // Verify tutor exists
    const tutor = await models_1.User.findOne({
        _id: tutorId,
        role: types_1.UserRole.TUTOR,
    });
    if (!tutor) {
        throw new errorHandler_1.AppError('Tutor not found', 404);
    }
    // Parse date string properly to avoid timezone issues
    // If date is in YYYY-MM-DD format, parse it as local date
    let queryDate;
    if (date) {
        const dateStr = date;
        // Check if it's in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Parse as local date to avoid UTC timezone issues
            const [year, month, day] = dateStr.split('-').map(Number);
            queryDate = new Date(year, month - 1, day); // month is 0-indexed
        }
        else {
            queryDate = new Date(dateStr);
        }
    }
    else {
        queryDate = new Date();
    }
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    // Import TutorAvailability model
    const { TutorAvailability } = await Promise.resolve().then(() => __importStar(require('../models/TutorAvailability')));
    // Get tutor's availability for this day
    // getDay() returns 0 (Sunday) to 6 (Saturday)
    const dayOfWeek = queryDate.getDay();
    logger_1.logger.debug('Querying tutor availability', {
        tutorId,
        date: queryDate.toISOString(),
        dayOfWeek,
    });
    // Query for recurring availability (matches day of week)
    // and specific date availability (matches exact date)
    const availabilities = await TutorAvailability.find({
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
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
    logger_1.logger.debug('Found availability entries', {
        count: availabilities.length,
        dayOfWeek,
    });
    // Find tutor's booked sessions for the date
    const bookedSessions = await models_1.Session.find({
        tutorId,
        scheduledAt: {
            $gte: queryDate,
            $lt: nextDay,
        },
        status: { $in: [types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS] },
    }).select('scheduledAt duration');
    // Generate available time slots
    const availableSlots = [];
    const durationMinutes = parseInt(duration, 10);
    availabilities.forEach((avail) => {
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
            const hasConflict = bookedSessions.some((session) => {
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
        bookedSlots: bookedSessions.map((session) => ({
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
SessionsController.bookTutorSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { tutorId, title, subject, startTime, duration, description } = req.body;
    // Verify tutor exists and is available
    const tutor = await models_1.User.findOne({
        _id: tutorId,
        role: types_1.UserRole.TUTOR,
        isVerified: true,
    });
    if (!tutor) {
        throw new errorHandler_1.AppError('Tutor not found or not available', 404);
    }
    // Check for conflicts with scheduled/in-progress sessions
    const scheduledAt = new Date(startTime);
    const sessionEnd = new Date(scheduledAt.getTime() + duration * 60000);
    logger_1.logger.debug('Checking for conflicts before creating session', {
        requestedStart: scheduledAt.toISOString(),
        requestedEnd: sessionEnd.toISOString(),
    });
    // Check conflicts with scheduled/in-progress sessions
    const conflictWithScheduled = await models_1.Session.findOne({
        tutorId,
        status: { $in: [types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS] },
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
        logger_1.logger.warn('Conflict found with scheduled session', {
            conflictingSessionId: conflictWithScheduled._id.toString(),
        });
        throw new errorHandler_1.AppError('Tutor is not available at this time', 409);
    }
    // Also check for conflicts with other PENDING sessions to prevent duplicate requests
    const conflictWithPending = await models_1.Session.findOne({
        tutorId,
        status: types_1.SessionStatus.PENDING,
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
        logger_1.logger.warn('Conflict found with pending session', {
            conflictingSessionId: conflictWithPending._id.toString(),
        });
        throw new errorHandler_1.AppError('You already have a pending session request for this time slot', 409);
    }
    logger_1.logger.debug('No conflicts found, creating session');
    // Calculate price
    const price = (tutor.hourlyRate || 0) * (duration / 60);
    // Check for conflicts BEFORE creating the session
    // This prevents creating sessions that will be immediately auto-rejected
    const conflictCheck = await models_1.Session.findOne({
        tutorId,
        status: { $in: [types_1.SessionStatus.SCHEDULED, types_1.SessionStatus.IN_PROGRESS] },
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
        throw new errorHandler_1.AppError('Tutor is not available at this time', 409);
    }
    // Create session with PENDING status (requires tutor approval)
    const session = await models_1.Session.create({
        studentId: userId,
        tutorId,
        title,
        subject,
        type: 'tutoring',
        scheduledAt,
        duration,
        description,
        price,
        status: types_1.SessionStatus.PENDING, // Teacher-centric: requires approval
        reminderEnabled: true,
        reminderTime: 15,
        isRecurring: false,
    });
    await session.populate('tutorId', 'firstName lastName profileImage');
    await session.populate('studentId', 'firstName lastName email');
    // Verify session was created as PENDING before sending notification
    const createdSession = await models_1.Session.findById(session._id);
    if (!createdSession || createdSession.status !== types_1.SessionStatus.PENDING) {
        logger_1.logger.error('Session was not created as PENDING', {
            sessionId: session._id.toString(),
            status: createdSession?.status,
        });
        throw new errorHandler_1.AppError('Failed to create session request', 500);
    }
    // Send notification to tutor ONLY if session was successfully created as PENDING
    const io = (0, socket_1.getIO)();
    if (io) {
        const student = session.studentId;
        logger_1.logger.debug('Sending notification to tutor', {
            tutorId: tutorId.toString(),
            sessionId: session._id.toString(),
        });
        await (0, socket_2.sendNotificationToUser)(io, tutorId.toString(), {
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
        logger_1.logger.debug('Notification sent to tutor for new session request', {
            sessionId: session._id.toString(),
        });
    }
    else {
        logger_1.logger.warn('Socket IO not available, notification not sent', {
            sessionId: session._id.toString(),
        });
    }
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + duration);
    const transformedSession = (0, transformations_1.transformSession)(session);
    // Add tutor details if populated
    if (session.tutorId && (0, populatedTypes_1.isPopulatedUser)(session.tutorId)) {
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
//# sourceMappingURL=sessionsController.js.map