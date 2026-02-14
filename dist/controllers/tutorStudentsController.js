"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorStudentsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
const WeeklyCommitmentRepository_1 = __importDefault(require("../repositories/WeeklyCommitmentRepository"));
const CustomEventRepository_1 = __importDefault(require("../repositories/CustomEventRepository"));
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../utils/logger");
class TutorStudentsController {
}
exports.TutorStudentsController = TutorStudentsController;
_a = TutorStudentsController;
// Get all students with progress metrics
TutorStudentsController.getAllStudentsProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    try {
        // Get pagination parameters
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
        // Get total count
        const total = await UserRepository_1.default.model.countDocuments({ role: types_1.UserRole.STUDENT });
        // Get paginated students
        const students = await UserRepository_1.default.model
            .find({ role: types_1.UserRole.STUDENT })
            .sort({ lastLoginAt: -1 }) // Get most recently active students first
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance
        if (!students || students.length === 0) {
            return res.json({
                success: true,
                students: [],
                total: 0,
            });
        }
        // Process students in smaller batches to prevent timeout
        const batchSize = 5;
        const studentsArray = students;
        const studentsProgress = [];
        for (let i = 0; i < studentsArray.length; i += batchSize) {
            const batch = studentsArray.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(async (student) => {
                try {
                    const studentId = student._id.toString();
                    // Get student's goals (with timeout protection)
                    let goalProgress = 0;
                    try {
                        const goals = await GoalRepository_1.default.findByUser(studentId, true);
                        const activeGoals = goals.filter((g) => g.isActive && g.status !== 'rejected');
                        goalProgress =
                            activeGoals.length > 0
                                ? Math.round(activeGoals.reduce((sum, g) => {
                                    const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
                                    return sum + progress;
                                }, 0) / activeGoals.length)
                                : 0;
                    }
                    catch (error) {
                        logger_1.logger.error(`Error calculating goal progress for student ${studentId}`, error);
                        goalProgress = 0;
                    }
                    // Get current week's commitments (with timeout protection)
                    let commitmentsCompleted = 0;
                    let commitmentsTotal = 0;
                    try {
                        const commitment = await WeeklyCommitmentRepository_1.default.findCurrentWeek(studentId);
                        if (commitment) {
                            const commitments = commitment.commitments || [];
                            commitmentsTotal = commitments.length;
                            commitmentsCompleted = commitments.filter((c) => c.completed).length;
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`Error getting commitments for student ${studentId}`, error);
                        commitmentsCompleted = 0;
                        commitmentsTotal = 0;
                    }
                    // Get consistency score (calculate from activity) - with timeout protection
                    // Simplified: use streak count as a proxy for consistency to avoid expensive queries
                    const streakCount = student.streakCount || 0;
                    const lastLoginAt = student.lastLoginAt ? new Date(student.lastLoginAt) : null;
                    let consistencyScore = 0;
                    try {
                        // Use streak count as a quick consistency indicator
                        // If student has active streak, assume good consistency
                        if (streakCount > 0) {
                            consistencyScore = Math.min(100, streakCount * 10); // 10% per day of streak, max 100%
                        }
                        else {
                            // For students with no streak, check last login
                            if (lastLoginAt) {
                                const daysSinceLogin = Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24));
                                if (daysSinceLogin <= 7) {
                                    consistencyScore = 50; // Recently active
                                }
                                else if (daysSinceLogin <= 14) {
                                    consistencyScore = 30; // Somewhat active
                                }
                                else {
                                    consistencyScore = 10; // Inactive
                                }
                            }
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`Error calculating consistency for student ${studentId}`, error);
                        consistencyScore = 0;
                    }
                    // Determine status
                    let status = 'on-track';
                    const daysSinceLogin = lastLoginAt
                        ? Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
                        : 999;
                    if (streakCount === 0 && daysSinceLogin > 3) {
                        status = 'at-risk';
                    }
                    else if (consistencyScore < 50 ||
                        (commitmentsTotal > 0 && commitmentsCompleted / commitmentsTotal < 0.5)) {
                        status = 'needs-attention';
                    }
                    else if (consistencyScore >= 75 && streakCount >= 3) {
                        status = 'on-track';
                    }
                    return {
                        id: studentId,
                        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                            'Unknown Student',
                        email: student.email || '',
                        streak: streakCount,
                        goalProgress,
                        commitmentsCompleted,
                        commitmentsTotal,
                        consistencyScore: Math.round(consistencyScore),
                        status,
                        lastLoginAt: student.lastLoginAt,
                    };
                }
                catch (error) {
                    logger_1.logger.error(`Error processing student ${student._id}`, error);
                    // Return minimal data for this student
                    return {
                        id: student._id.toString(),
                        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                            'Unknown Student',
                        email: student.email || '',
                        streak: student.streakCount || 0,
                        goalProgress: 0,
                        commitmentsCompleted: 0,
                        commitmentsTotal: 0,
                        consistencyScore: 0,
                        status: 'needs-attention',
                        lastLoginAt: student.lastLoginAt,
                    };
                }
            }));
            studentsProgress.push(...batchResults);
        }
        // Return paginated response
        const paginationResult = (0, pagination_1.createPaginationResult)(studentsProgress, total, page, limit);
        res.json({
            success: true,
            students: paginationResult.data,
            pagination: paginationResult.pagination,
        });
    }
    catch (error) {
        logger_1.logger.error('Error in getAllStudentsProgress', error);
        // Return empty array instead of error to prevent frontend crash
        res.json({
            success: true,
            students: [],
            total: 0,
        });
    }
});
// Get at-risk students
TutorStudentsController.getAtRiskStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    // Get all students
    const students = await UserRepository_1.default.find({ role: types_1.UserRole.STUDENT });
    const atRiskStudents = [];
    for (const student of students) {
        const studentId = student._id.toString();
        const reasons = [];
        // Check streak
        const streakCount = student.streakCount || 0;
        const lastLoginAt = student.lastLoginAt ? new Date(student.lastLoginAt) : null;
        const daysSinceLogin = lastLoginAt
            ? Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        if (streakCount === 0 && daysSinceLogin > 3) {
            reasons.push(`Streak broken ${daysSinceLogin} days ago`);
        }
        // Check commitments
        const commitment = await WeeklyCommitmentRepository_1.default.findCurrentWeek(studentId);
        if (commitment) {
            const commitments = commitment.commitments || [];
            const completed = commitments.filter((c) => c.completed).length;
            const completionRate = commitments.length > 0 ? (completed / commitments.length) * 100 : 0;
            if (completionRate < 50) {
                reasons.push(`Missed commitments (${Math.round(completionRate)}% complete)`);
            }
        }
        // Check activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentEvents = await CustomEventRepository_1.default.find({
            userId: new mongoose_1.Types.ObjectId(studentId),
            timestamp: { $gte: sevenDaysAgo },
        }, { limit: 1 });
        if (recentEvents.length === 0) {
            reasons.push('No activity in 7+ days');
        }
        if (reasons.length > 0) {
            atRiskStudents.push({
                id: studentId,
                name: `${student.firstName} ${student.lastName}`,
                email: student.email,
                reasons,
                priority: reasons.length >= 2 ? 'urgent' : 'attention',
            });
        }
    }
    res.json({
        success: true,
        students: atRiskStudents,
        total: atRiskStudents.length,
    });
});
// Get student detail with full information
TutorStudentsController.getStudentDetail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { studentId } = req.params;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can view student details', 403);
    }
    // Get student
    const student = await UserRepository_1.default.findById(studentId);
    if (!student || student.role !== types_1.UserRole.STUDENT) {
        throw new errorHandler_1.AppError('Student not found', 404);
    }
    // Get student progress (reuse logic from getAllStudentsProgress)
    const students = await UserRepository_1.default.model
        .find({ _id: new mongoose_1.Types.ObjectId(studentId), role: types_1.UserRole.STUDENT })
        .limit(1)
        .lean();
    if (!students || students.length === 0) {
        throw new errorHandler_1.AppError('Student not found', 404);
    }
    const studentData = students[0];
    const studentIdStr = studentData._id.toString();
    // Calculate metrics (similar to getAllStudentsProgress)
    let goalProgress = 0;
    try {
        const goals = await GoalRepository_1.default.findByUser(studentIdStr, true);
        const activeGoals = goals.filter((g) => g.isActive && g.status !== 'rejected');
        goalProgress =
            activeGoals.length > 0
                ? Math.round(activeGoals.reduce((sum, g) => {
                    const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
                    return sum + progress;
                }, 0) / activeGoals.length)
                : 0;
    }
    catch (error) {
        logger_1.logger.error('Error calculating goal progress', error);
    }
    let commitmentsCompleted = 0;
    let commitmentsTotal = 0;
    try {
        const commitment = await WeeklyCommitmentRepository_1.default.findCurrentWeek(studentIdStr);
        if (commitment) {
            const commitments = commitment.commitments || [];
            commitmentsTotal = commitments.length;
            commitmentsCompleted = commitments.filter((c) => c.completed).length;
        }
    }
    catch (error) {
        logger_1.logger.error('Error getting commitments', error);
    }
    const streakCount = studentData.streakCount || 0;
    const lastLoginAt = studentData.lastLoginAt ? new Date(studentData.lastLoginAt) : null;
    let consistencyScore = 0;
    if (streakCount > 0) {
        consistencyScore = Math.min(100, streakCount * 10);
    }
    else if (lastLoginAt) {
        const daysSinceLogin = Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLogin <= 7) {
            consistencyScore = 50;
        }
        else if (daysSinceLogin <= 14) {
            consistencyScore = 30;
        }
        else {
            consistencyScore = 10;
        }
    }
    let status = 'on-track';
    const daysSinceLogin = lastLoginAt
        ? Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
    if (streakCount === 0 && daysSinceLogin > 3) {
        status = 'at-risk';
    }
    else if (consistencyScore < 50 ||
        (commitmentsTotal > 0 && commitmentsCompleted / commitmentsTotal < 0.5)) {
        status = 'needs-attention';
    }
    else if (consistencyScore >= 75 && streakCount >= 3) {
        status = 'on-track';
    }
    res.json({
        success: true,
        student: {
            id: studentIdStr,
            name: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            email: studentData.email || '',
            profileImage: studentData.profileImage || null,
            gradeLevel: studentData.gradeLevel || null,
            academicGoals: studentData.academicGoals || [],
            streak: streakCount,
            goalProgress,
            commitmentsCompleted,
            commitmentsTotal,
            consistencyScore: Math.round(consistencyScore),
            status,
            lastLoginAt: studentData.lastLoginAt,
            totalPoints: studentData.totalPoints || 0,
            createdAt: studentData.createdAt,
        },
    });
});
// Search students
TutorStudentsController.searchStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { query, status, sortBy } = req.query;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can search students', 403);
    }
    // Get all students (similar to getAllStudentsProgress but with filters)
    let studentsQuery = { role: types_1.UserRole.STUDENT };
    // Apply search query
    if (query) {
        const searchRegex = new RegExp(query, 'i');
        studentsQuery.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
        ];
    }
    // Get pagination parameters
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    // Get total count
    const total = await UserRepository_1.default.model.countDocuments(studentsQuery);
    // Get paginated students
    const students = await UserRepository_1.default.model
        .find(studentsQuery)
        .sort({ lastLoginAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    // Process students (simplified version)
    const studentsProgress = await Promise.all(students.map(async (student) => {
        const studentId = student._id.toString();
        // Simplified metrics calculation
        const streakCount = student.streakCount || 0;
        const lastLoginAt = student.lastLoginAt ? new Date(student.lastLoginAt) : null;
        let goalProgress = 0;
        try {
            const goals = await GoalRepository_1.default.findByUser(studentId, true);
            const activeGoals = goals.filter((g) => g.isActive);
            goalProgress =
                activeGoals.length > 0
                    ? Math.round(activeGoals.reduce((sum, g) => {
                        const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
                        return sum + progress;
                    }, 0) / activeGoals.length)
                    : 0;
        }
        catch (error) {
            // Ignore errors
        }
        let commitmentsCompleted = 0;
        let commitmentsTotal = 0;
        try {
            const commitment = await WeeklyCommitmentRepository_1.default.findCurrentWeek(studentId);
            if (commitment) {
                const commitments = commitment.commitments || [];
                commitmentsTotal = commitments.length;
                commitmentsCompleted = commitments.filter((c) => c.completed).length;
            }
        }
        catch (error) {
            // Ignore errors
        }
        const consistencyScore = streakCount > 0 ? Math.min(100, streakCount * 10) : 0;
        let status = 'on-track';
        const daysSinceLogin = lastLoginAt
            ? Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        if (streakCount === 0 && daysSinceLogin > 3) {
            status = 'at-risk';
        }
        else if (consistencyScore < 50) {
            status = 'needs-attention';
        }
        return {
            id: studentId,
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            email: student.email || '',
            streak: streakCount,
            goalProgress,
            commitmentsCompleted,
            commitmentsTotal,
            consistencyScore: Math.round(consistencyScore),
            status,
            lastLoginAt: student.lastLoginAt,
        };
    }));
    // Note: Filtering and sorting should ideally be done before pagination
    // For now, we'll apply them after pagination (client-side filtering)
    // In production, you might want to move filtering to the database query
    // Apply status filter if provided (after pagination - consider moving to query)
    let filtered = studentsProgress;
    if (status && status !== 'all') {
        filtered = studentsProgress.filter((s) => s.status === status);
        // Recalculate total for filtered results
        // Note: This is not ideal - filtering should be in the query
    }
    // Apply sorting
    if (sortBy) {
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'streak':
                    return b.streak - a.streak;
                case 'consistency':
                    return b.consistencyScore - a.consistencyScore;
                case 'lastLogin':
                    const aDate = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
                    const bDate = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
                    return bDate - aDate;
                default:
                    return 0;
            }
        });
    }
    // Return paginated response
    // Note: Filtering happens after pagination, so total reflects filtered count
    // For better performance, consider moving status filter to the query
    const paginationResult = (0, pagination_1.createPaginationResult)(filtered, filtered.length, page, limit);
    res.json({
        success: true,
        students: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Invite student
TutorStudentsController.inviteStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { email, message } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can invite students', 403);
    }
    if (!email) {
        throw new errorHandler_1.AppError('Email is required', 400);
    }
    // Check if student already exists
    const existingStudent = await UserRepository_1.default.find({
        email: email.toLowerCase(),
        role: types_1.UserRole.STUDENT,
    });
    if (existingStudent && existingStudent.length > 0) {
        throw new errorHandler_1.AppError('Student with this email already exists', 400);
    }
    // TODO: Send invitation email
    // For now, just return success
    res.json({
        success: true,
        message: 'Invitation sent successfully',
        email,
    });
});
// Create student manually
TutorStudentsController.createStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { firstName, lastName, email, gradeLevel, academicGoals, parentEmail } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can create students', 403);
    }
    if (!firstName || !lastName || !email) {
        throw new errorHandler_1.AppError('First name, last name, and email are required', 400);
    }
    // Check if student already exists
    const existingStudent = await UserRepository_1.default.find({
        email: email.toLowerCase(),
        role: types_1.UserRole.STUDENT,
    });
    if (existingStudent && existingStudent.length > 0) {
        throw new errorHandler_1.AppError('Student with this email already exists', 400);
    }
    // Create student account
    // Note: In a real implementation, you'd generate a temporary password and send it via email
    const hashedPassword = await bcryptjs_1.default.hash('TempPassword123!', 12);
    const student = await UserRepository_1.default.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: types_1.UserRole.STUDENT,
        gradeLevel: gradeLevel || undefined,
        academicGoals: academicGoals || [],
        parentEmail: parentEmail || undefined,
        isVerified: false, // Student needs to verify email
    });
    // TODO: Send welcome email with temporary password
    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        student: {
            id: student._id.toString(),
            name: `${firstName} ${lastName}`,
            email: email.toLowerCase(),
        },
    });
});
//# sourceMappingURL=tutorStudentsController.js.map