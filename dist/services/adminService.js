"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../types");
const notificationService_1 = __importDefault(require("./notificationService"));
const logger_1 = require("../utils/logger");
class AdminService {
    // Get pending tutors (not verified or not background checked)
    static async getPendingTutors(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {
            role: types_1.UserRole.TUTOR,
            $or: [{ isVerified: false }, { isBackgroundChecked: false }],
        };
        const total = await UserRepository_1.default.model.countDocuments(query);
        const tutors = await UserRepository_1.default.model
            .find(query)
            .select('firstName lastName email profileImage subjects qualifications bio hourlyRate isVerified isBackgroundChecked createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        return {
            tutors: tutors.map((tutor) => ({
                id: tutor._id.toString(),
                firstName: tutor.firstName,
                lastName: tutor.lastName,
                email: tutor.email,
                profileImage: tutor.profileImage,
                subjects: tutor.subjects || [],
                qualifications: tutor.qualifications || [],
                bio: tutor.bio,
                hourlyRate: tutor.hourlyRate,
                isVerified: tutor.isVerified || false,
                isBackgroundChecked: tutor.isBackgroundChecked || false,
                createdAt: tutor.createdAt,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Get tutor by ID for review
    static async getTutorById(tutorId) {
        const tutor = await UserRepository_1.default.findById(tutorId);
        if (!tutor) {
            throw new errorHandler_1.AppError('Tutor not found', 404);
        }
        if (tutor.role !== types_1.UserRole.TUTOR) {
            throw new errorHandler_1.AppError('User is not a tutor', 400);
        }
        return {
            id: tutor._id.toString(),
            firstName: tutor.firstName,
            lastName: tutor.lastName,
            email: tutor.email,
            profileImage: tutor.profileImage,
            subjects: tutor.subjects || [],
            qualifications: tutor.qualifications || [],
            bio: tutor.bio,
            hourlyRate: tutor.hourlyRate,
            rating: tutor.rating || 0,
            totalSessions: tutor.totalSessions || 0,
            isVerified: tutor.isVerified || false,
            isBackgroundChecked: tutor.isBackgroundChecked || false,
            createdAt: tutor.createdAt,
            updatedAt: tutor.updatedAt,
        };
    }
    // Approve tutor
    static async approveTutor(tutorId, adminNotes) {
        const tutor = await UserRepository_1.default.findById(tutorId);
        if (!tutor) {
            throw new errorHandler_1.AppError('Tutor not found', 404);
        }
        if (tutor.role !== types_1.UserRole.TUTOR) {
            throw new errorHandler_1.AppError('User is not a tutor', 400);
        }
        // Update tutor status
        const updatedTutor = await UserRepository_1.default.updateById(tutorId, {
            isVerified: true,
            isBackgroundChecked: true,
        });
        if (!updatedTutor) {
            throw new errorHandler_1.AppError('Failed to approve tutor', 500);
        }
        // Send notification to tutor
        try {
            await notificationService_1.default.createNotification({
                userId: tutorId,
                type: 'system_announcement',
                title: '✅ Tutor Account Approved',
                message: 'Your tutor account has been approved! You can now start accepting students.',
                data: { adminNotes },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send approval notification', error);
        }
        return {
            id: updatedTutor._id.toString(),
            firstName: updatedTutor.firstName,
            lastName: updatedTutor.lastName,
            email: updatedTutor.email,
            isVerified: updatedTutor.isVerified,
            isBackgroundChecked: updatedTutor.isBackgroundChecked,
        };
    }
    // Reject tutor
    static async rejectTutor(tutorId, reason) {
        const tutor = await UserRepository_1.default.findById(tutorId);
        if (!tutor) {
            throw new errorHandler_1.AppError('Tutor not found', 404);
        }
        if (tutor.role !== types_1.UserRole.TUTOR) {
            throw new errorHandler_1.AppError('User is not a tutor', 400);
        }
        // Send notification to tutor
        try {
            await notificationService_1.default.createNotification({
                userId: tutorId,
                type: 'system_announcement',
                title: '❌ Tutor Application Rejected',
                message: `Your tutor application has been rejected. Reason: ${reason}`,
                data: { reason },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send rejection notification', error);
        }
        return {
            id: tutor._id.toString(),
            message: 'Tutor application rejected',
        };
    }
    // Set background check status
    static async setBackgroundCheckStatus(tutorId, isBackgroundChecked) {
        const tutor = await UserRepository_1.default.findById(tutorId);
        if (!tutor) {
            throw new errorHandler_1.AppError('Tutor not found', 404);
        }
        if (tutor.role !== types_1.UserRole.TUTOR) {
            throw new errorHandler_1.AppError('User is not a tutor', 400);
        }
        const updatedTutor = await UserRepository_1.default.updateById(tutorId, {
            isBackgroundChecked,
        });
        if (!updatedTutor) {
            throw new errorHandler_1.AppError('Failed to update background check status', 500);
        }
        return {
            id: updatedTutor._id.toString(),
            isBackgroundChecked: updatedTutor.isBackgroundChecked,
        };
    }
    // Get all users with filters
    static async getAllUsers(filters) {
        const { role, search, isVerified, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const query = {};
        if (role) {
            query.role = role;
        }
        if (isVerified !== undefined) {
            query.isVerified = isVerified;
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
        }
        const total = await UserRepository_1.default.model.countDocuments(query);
        const users = await UserRepository_1.default.model
            .find(query)
            .select('firstName lastName email role profileImage isVerified isBackgroundChecked lastLoginAt createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        return {
            users: users.map((user) => ({
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                isVerified: user.isVerified || false,
                isBackgroundChecked: user.isBackgroundChecked || false,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Get user by ID
    static async getUserById(userId) {
        const user = await UserRepository_1.default.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const userData = {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isVerified: user.isVerified || false,
            isBackgroundChecked: user.isBackgroundChecked || false,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        // Add role-specific fields
        if (user.role === types_1.UserRole.STUDENT) {
            userData.gradeLevel = user.gradeLevel;
            userData.academicGoals = user.academicGoals || [];
            userData.streakCount = user.streakCount || 0;
            userData.totalPoints = user.totalPoints || 0;
        }
        else if (user.role === types_1.UserRole.TUTOR) {
            userData.subjects = user.subjects || [];
            userData.qualifications = user.qualifications || [];
            userData.bio = user.bio;
            userData.hourlyRate = user.hourlyRate;
            userData.rating = user.rating || 0;
            userData.totalSessions = user.totalSessions || 0;
        }
        return userData;
    }
    // Suspend/activate user account
    static async updateUserStatus(userId, isActive) {
        const user = await UserRepository_1.default.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        // For now, we'll use isVerified as a proxy for account status
        // In production, you might want a separate 'isActive' or 'isSuspended' field
        const updatedUser = await UserRepository_1.default.updateById(userId, {
            isVerified: isActive,
        });
        if (!updatedUser) {
            throw new errorHandler_1.AppError('Failed to update user status', 500);
        }
        // Send notification
        try {
            await notificationService_1.default.createNotification({
                userId,
                type: 'system_announcement',
                title: isActive ? '✅ Account Activated' : '⚠️ Account Suspended',
                message: isActive
                    ? 'Your account has been activated. You can now use the platform.'
                    : 'Your account has been suspended. Please contact support for more information.',
                data: { isActive },
            });
        }
        catch (error) {
            console.error('Failed to send status notification:', error);
        }
        return {
            id: updatedUser._id.toString(),
            isVerified: updatedUser.isVerified,
            message: isActive ? 'Account activated' : 'Account suspended',
        };
    }
    // Get admin dashboard stats
    static async getDashboardStats() {
        const [totalUsers, totalStudents, totalTutors, totalParents, pendingTutors, verifiedTutors, activeUsers,] = await Promise.all([
            UserRepository_1.default.model.countDocuments({}),
            UserRepository_1.default.model.countDocuments({ role: types_1.UserRole.STUDENT }),
            UserRepository_1.default.model.countDocuments({ role: types_1.UserRole.TUTOR }),
            UserRepository_1.default.model.countDocuments({ role: types_1.UserRole.PARENT }),
            UserRepository_1.default.model.countDocuments({
                role: types_1.UserRole.TUTOR,
                $or: [{ isVerified: false }, { isBackgroundChecked: false }],
            }),
            UserRepository_1.default.model.countDocuments({
                role: types_1.UserRole.TUTOR,
                isVerified: true,
                isBackgroundChecked: true,
            }),
            UserRepository_1.default.model.countDocuments({
                isVerified: true,
                lastLoginAt: {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
            }),
        ]);
        return {
            totalUsers,
            totalStudents,
            totalTutors,
            totalParents,
            pendingTutors,
            verifiedTutors,
            activeUsers,
        };
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=adminService.js.map