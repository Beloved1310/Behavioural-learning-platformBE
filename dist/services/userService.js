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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
const UserPreferencesRepository_1 = require("../repositories/UserPreferencesRepository");
const errorHandler_1 = require("../middleware/errorHandler");
const cloudinary_1 = require("../utils/cloudinary");
const mongoose_1 = require("mongoose");
const logger_1 = require("../utils/logger");
function normalizeStringList(input) {
    if (input === undefined)
        return undefined;
    if (Array.isArray(input)) {
        return input.filter((item) => item && item.trim()).map((item) => item.trim());
    }
    if (typeof input === 'string') {
        return input
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return undefined;
}
class UserService {
    static async getProfile(userId) {
        const user = await UserRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        let preferences = await UserPreferencesRepository_1.userPreferencesRepository.findByUserId(userId);
        if (!preferences) {
            preferences = await UserPreferencesRepository_1.userPreferencesRepository.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                studyReminders: true,
                darkMode: false,
                language: 'en',
                timezone: 'UTC',
                emailNotifications: true,
                pushNotifications: true,
                smsNotifications: false,
                sessionReminders: true,
                progressReports: true,
                weeklyReport: true,
            });
        }
        const safeUser = await UserRepository_1.userRepository.findByIdWithFields(userId, '-password');
        return { user: safeUser, preferences };
    }
    static async updateProfile(userId, payload) {
        const user = await UserRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const { firstName, lastName, phoneNumber, dateOfBirth, profileImage, gradeLevel, learningStyle, academicGoals, subjects, bio, qualifications, } = payload;
        if (firstName !== undefined)
            user.firstName = firstName;
        if (lastName !== undefined)
            user.lastName = lastName;
        if (phoneNumber !== undefined)
            user.phoneNumber = phoneNumber;
        if (dateOfBirth !== undefined)
            user.dateOfBirth = dateOfBirth;
        if (profileImage !== undefined)
            user.profileImage = profileImage;
        if (user.role === 'STUDENT') {
            if (gradeLevel !== undefined)
                user.gradeLevel = gradeLevel;
            if (learningStyle !== undefined)
                user.learningStyle = learningStyle;
            const normalizedGoals = normalizeStringList(academicGoals);
            if (normalizedGoals !== undefined)
                user.academicGoals = normalizedGoals;
        }
        if (user.role === 'TUTOR') {
            const normalizedSubjects = normalizeStringList(subjects);
            if (normalizedSubjects !== undefined)
                user.subjects = normalizedSubjects;
            if (bio !== undefined)
                user.bio = bio;
            const normalizedQualifications = normalizeStringList(qualifications);
            if (normalizedQualifications !== undefined)
                user.qualifications = normalizedQualifications;
        }
        await user.save();
        const updatedUser = await UserRepository_1.userRepository.findByIdWithFields(userId, '-password');
        return updatedUser;
    }
    static async updatePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new errorHandler_1.AppError('Current password and new password are required', 400);
        }
        if (newPassword.length < 8) {
            throw new errorHandler_1.AppError('New password must be at least 8 characters long', 400);
        }
        const user = await UserRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError('Current password is incorrect', 401);
        }
        user.password = newPassword;
        await user.save();
        return { message: 'Password updated successfully' };
    }
    static async deleteAccount(userId, password) {
        if (!password) {
            throw new errorHandler_1.AppError('Password is required to delete account', 400);
        }
        const user = await UserRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError('Incorrect password', 401);
        }
        await UserRepository_1.userRepository.deleteById(userId);
        return { message: 'Account deleted successfully' };
    }
    static async uploadProfileImage(userId, file) {
        if (!file) {
            throw new errorHandler_1.AppError('No image file provided', 400);
        }
        if (file.size > 2 * 1024 * 1024) {
            throw new errorHandler_1.AppError('Image size must be less than 2MB', 400);
        }
        const user = await UserRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (user.profileImage) {
            const publicId = (0, cloudinary_1.extractPublicId)(user.profileImage);
            if (publicId) {
                await (0, cloudinary_1.deleteFromCloudinary)(publicId);
            }
        }
        const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, 'profile-images', `user-${userId}`);
        user.profileImage = uploadResult.secure_url;
        await user.save();
        return {
            imageUrl: uploadResult.secure_url,
            user,
        };
    }
    static async deleteProfileImage(userId) {
        const user = await UserRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (!user.profileImage) {
            throw new errorHandler_1.AppError('No profile image to delete', 400);
        }
        const publicId = (0, cloudinary_1.extractPublicId)(user.profileImage);
        if (publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(publicId);
        }
        user.profileImage = undefined;
        await user.save();
        return { message: 'Profile image deleted successfully' };
    }
    static async exportUserData(userId) {
        try {
            const user = await UserRepository_1.userRepository.findByIdWithFields(userId, '-password');
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            // Get user preferences
            const preferences = await UserPreferencesRepository_1.userPreferencesRepository.findByUserId(userId);
            // Get related data based on user role
            const exportData = {
                exportDate: new Date().toISOString(),
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    phoneNumber: user.phoneNumber || null,
                    dateOfBirth: user.dateOfBirth || null,
                    profileImage: user.profileImage || null,
                    subscriptionTier: user.subscriptionTier || null,
                    subscriptionStatus: user.subscriptionStatus || null,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastLoginAt: user.lastLoginAt || null,
                },
                preferences: preferences
                    ? {
                        emailNotifications: preferences.emailNotifications,
                        pushNotifications: preferences.pushNotifications,
                        sessionReminders: preferences.sessionReminders,
                        weeklyReport: preferences.weeklyReport,
                        studyReminders: preferences.studyReminders,
                        language: preferences.language,
                        timezone: preferences.timezone,
                    }
                    : null,
            };
            // Add role-specific data
            if (user.role === 'STUDENT') {
                exportData.studentData = {
                    gradeLevel: user.gradeLevel || null,
                    learningStyle: user.learningStyle || null,
                    academicGoals: user.academicGoals || [],
                    streakCount: user.streakCount || 0,
                    totalPoints: user.totalPoints || 0,
                };
                // Get quiz attempts
                try {
                    const { QuizAttempt } = await Promise.resolve().then(() => __importStar(require('../models/QuizAttempt')));
                    const quizAttempts = await QuizAttempt.find({ userId: new mongoose_1.Types.ObjectId(userId) })
                        .populate('quizId', 'title subject difficulty')
                        .limit(100)
                        .sort({ createdAt: -1 })
                        .lean();
                    exportData.quizAttempts = quizAttempts.map((attempt) => ({
                        quizTitle: attempt.quizId?.title || 'Unknown',
                        subject: attempt.quizId?.subject || null,
                        difficulty: attempt.quizId?.difficulty || null,
                        score: attempt.score,
                        totalQuestions: attempt.totalQuestions,
                        completedAt: attempt.completedAt,
                    }));
                }
                catch (error) {
                    logger_1.logger.error('[UserService] Error fetching quiz attempts', error);
                    exportData.quizAttempts = [];
                }
            }
            if (user.role === 'TUTOR') {
                exportData.tutorData = {
                    subjects: user.subjects || [],
                    bio: user.bio || null,
                    qualifications: user.qualifications || [],
                    hourlyRate: user.hourlyRate || null,
                    rating: user.rating || 0,
                    totalSessions: user.totalSessions || 0,
                    isBackgroundChecked: user.isBackgroundChecked || false,
                };
                // Get sessions
                try {
                    const { Session } = await Promise.resolve().then(() => __importStar(require('../models/Session')));
                    const sessions = await Session.find({
                        $or: [
                            { studentId: new mongoose_1.Types.ObjectId(userId) },
                            { tutorId: new mongoose_1.Types.ObjectId(userId) },
                        ],
                    })
                        .populate('studentId', 'firstName lastName email')
                        .populate('tutorId', 'firstName lastName email')
                        .limit(100)
                        .sort({ createdAt: -1 })
                        .lean();
                    exportData.sessions = sessions.map((session) => ({
                        title: session.title,
                        status: session.status,
                        scheduledAt: session.scheduledAt,
                        duration: session.duration,
                        student: session.studentId
                            ? {
                                name: `${session.studentId.firstName} ${session.studentId.lastName}`,
                                email: session.studentId.email,
                            }
                            : null,
                        tutor: session.tutorId
                            ? {
                                name: `${session.tutorId.firstName} ${session.tutorId.lastName}`,
                                email: session.tutorId.email,
                            }
                            : null,
                        createdAt: session.createdAt,
                    }));
                }
                catch (error) {
                    logger_1.logger.error('[UserService] Error fetching sessions', error);
                    exportData.sessions = [];
                }
            }
            // Generate export ID
            const exportId = `export-${userId}-${Date.now()}`;
            return {
                exportId,
                data: exportData,
                message: 'Data export generated successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('[UserService] Error in exportUserData', error);
            throw new errorHandler_1.AppError(error?.message || 'Failed to export user data', 500);
        }
    }
}
exports.UserService = UserService;
exports.default = UserService;
//# sourceMappingURL=userService.js.map