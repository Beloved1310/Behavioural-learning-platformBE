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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const userService_1 = require("../services/userService");
const logger_1 = require("../utils/logger");
class UserController {
}
exports.UserController = UserController;
_a = UserController;
UserController.getProfile = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { user, preferences } = await userService_1.UserService.getProfile(userId);
    res.json({
        success: true,
        data: {
            user: {
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage || null,
                phoneNumber: user.phoneNumber || null,
                dateOfBirth: user.dateOfBirth || null,
                gradeLevel: user.gradeLevel || null,
                learningStyle: user.learningStyle || null,
                academicGoals: user.academicGoals || [],
                subjects: user.subjects || [],
                bio: user.bio || null,
                qualifications: user.qualifications || [],
                totalPoints: user.totalPoints || 0,
                streakCount: user.streakCount || 0,
                subscriptionTier: user.subscriptionTier || 'FREE',
                subscriptionStatus: user.subscriptionStatus || 'INACTIVE',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
            },
            preferences: {
                emailNotifications: preferences.emailNotifications,
                pushNotifications: preferences.pushNotifications,
                sessionReminders: preferences.sessionReminders,
                weeklyReport: preferences.weeklyReport,
                studyReminders: preferences.studyReminders,
                darkMode: preferences.darkMode ?? false,
                language: preferences.language,
                timezone: preferences.timezone,
            },
        },
    });
});
UserController.updateProfile = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const updatedUser = await userService_1.UserService.updateProfile(userId, req.body);
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            id: updatedUser._id.toString(),
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            profileImage: updatedUser.profileImage || null,
            phoneNumber: updatedUser.phoneNumber || null,
            dateOfBirth: updatedUser.dateOfBirth || null,
            gradeLevel: updatedUser.gradeLevel || null,
            learningStyle: updatedUser.learningStyle || null,
            academicGoals: updatedUser.academicGoals || [],
            subjects: updatedUser.subjects || [],
            bio: updatedUser.bio || null,
            qualifications: updatedUser.qualifications || [],
            totalPoints: updatedUser.totalPoints || 0,
            streakCount: updatedUser.streakCount || 0,
            subscriptionTier: updatedUser.subscriptionTier || 'FREE',
            subscriptionStatus: updatedUser.subscriptionStatus || 'INACTIVE',
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            lastLoginAt: updatedUser.lastLoginAt,
        },
    });
});
UserController.updatePassword = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const result = await userService_1.UserService.updatePassword(userId, currentPassword, newPassword);
    res.json({
        success: true,
        ...result,
    });
});
UserController.deleteAccount = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;
    const result = await userService_1.UserService.deleteAccount(userId, password);
    res.json({
        success: true,
        ...result,
    });
});
UserController.uploadProfileImage = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const file = req.file;
    const result = await userService_1.UserService.uploadProfileImage(userId, file);
    res.json({
        message: 'Profile image uploaded successfully',
        imageUrl: result.imageUrl,
        user: {
            id: result.user._id.toString(),
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            email: result.user.email,
            profileImage: result.user.profileImage,
        },
    });
});
UserController.deleteProfileImage = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const result = await userService_1.UserService.deleteProfileImage(userId);
    res.json(result);
});
UserController.getChildren = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'PARENT') {
        throw new errorHandler_1.AppError('Only parents can access this endpoint', 403);
    }
    const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
    const children = await User.find({ parentId: userId }).select('firstName lastName email _id');
    res.json(children.map((child) => ({
        id: child._id.toString(),
        name: `${child.firstName} ${child.lastName}`.trim(),
        email: child.email,
    })));
});
UserController.requestDataExport = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const result = await userService_1.UserService.exportUserData(userId);
        res.json({
            success: true,
            message: result.message,
            data: {
                exportId: result.exportId,
                data: result.data,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('[UserController] Error in requestDataExport', error);
        throw error;
    }
});
UserController.downloadDataExport = (0, errorHandler_2.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { exportId } = req.params;
    if (!userId) {
        throw new errorHandler_1.AppError('User not authenticated', 401);
    }
    // Generate export data for the authenticated user
    // We don't need strict validation since we're regenerating the data anyway
    const result = await userService_1.UserService.exportUserData(userId);
    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${exportId || Date.now()}.json"`);
    res.json(result.data);
});
//# sourceMappingURL=userController.js.map