"use strict";
/**
 * Common transformation utilities for converting database models to API responses
 * Reduces code duplication across controllers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSession = transformSession;
exports.transformTutor = transformTutor;
exports.transformGoal = transformGoal;
exports.transformUser = transformUser;
exports.toObjectIdString = toObjectIdString;
const mongoose_1 = require("mongoose");
function transformSession(session) {
    return {
        id: session._id.toString(),
        studentId: session.studentId ? (typeof session.studentId === 'string' ? session.studentId : session.studentId._id?.toString() || session.studentId.toString() || String(session.studentId)) : undefined,
        tutorId: session.tutorId ? (typeof session.tutorId === 'string' ? session.tutorId : session.tutorId._id?.toString() || session.tutorId.toString() || String(session.tutorId)) : undefined,
        tutor: session.tutorId && typeof session.tutorId === 'object' && 'firstName' in session.tutorId
            ? {
                id: session.tutorId._id?.toString() || session.tutorId.id,
                name: `${session.tutorId.firstName || ''} ${session.tutorId.lastName || ''}`.trim(),
                avatar: session.tutorId.profileImage || null,
            }
            : undefined,
        student: session.studentId && typeof session.studentId === 'object' && 'firstName' in session.studentId
            ? {
                id: session.studentId._id?.toString() || session.studentId.id,
                name: `${session.studentId.firstName || ''} ${session.studentId.lastName || ''}`.trim(),
            }
            : undefined,
        title: session.title,
        subject: session.subject,
        type: session.type,
        startTime: session.scheduledAt?.toISOString(),
        endTime: session.scheduledAt && session.duration
            ? new Date(session.scheduledAt.getTime() + session.duration * 60000).toISOString()
            : undefined,
        duration: session.duration,
        status: session.status,
        price: session.price,
        description: session.description,
        isRecurring: session.isRecurring,
        recurringPattern: session.recurringPattern,
        reminderEnabled: session.reminderEnabled,
        reminderTime: session.reminderTime,
        meetingUrl: session.meetingUrl,
        notes: session.notes,
        rating: session.rating,
        createdAt: session.createdAt?.toISOString(),
        updatedAt: session.updatedAt?.toISOString(),
    };
}
function transformTutor(tutor) {
    return {
        id: tutor._id.toString(),
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        name: `${tutor.firstName} ${tutor.lastName}`,
        avatar: tutor.profileImage || null,
        subjects: tutor.subjects || [],
        hourlyRate: tutor.hourlyRate || 25,
        rating: tutor.rating || 0,
        totalSessions: tutor.totalSessions || 0,
        bio: tutor.bio || '',
    };
}
/**
 * Transform goal document to API response format
 */
function transformGoal(goal) {
    return {
        id: goal._id.toString(),
        title: goal.title,
        description: goal.description,
        target: goal.target,
        current: goal.current,
        deadline: goal.deadline?.toISOString(),
        milestones: goal.milestones || [],
        achievedMilestones: goal.achievedMilestones || [],
        assignedBy: goal.assignedBy?.toString() || null,
        assignedAt: goal.assignedAt?.toISOString(),
        status: goal.status || 'active',
        tutorFeedback: goal.tutorFeedback,
        isActive: goal.isActive,
        createdAt: goal.createdAt?.toISOString(),
        updatedAt: goal.updatedAt?.toISOString(),
    };
}
/**
 * Transform user document to API response format
 */
function transformUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        profileImage: user.profileImage || null,
        isVerified: user.isVerified,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
    };
}
/**
 * Safely convert MongoDB ObjectId to string
 */
function toObjectIdString(id) {
    if (!id)
        return undefined;
    if (typeof id === 'string')
        return id;
    if (id instanceof mongoose_1.Types.ObjectId)
        return id.toString();
    return String(id);
}
//# sourceMappingURL=transformations.js.map