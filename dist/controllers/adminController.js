"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const adminService_1 = require("../services/adminService");
const types_1 = require("../types");
const pagination_1 = require("../utils/pagination");
class AdminController {
}
exports.AdminController = AdminController;
_a = AdminController;
// Get admin dashboard stats
AdminController.getDashboardStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const stats = await adminService_1.AdminService.getDashboardStats();
    res.json({ success: true, stats });
});
// Get pending tutors
AdminController.getPendingTutors = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { page, limit } = (0, pagination_1.getPaginationParams)(req, 20, 50);
    const result = await adminService_1.AdminService.getPendingTutors(page, limit);
    res.json({
        success: true,
        tutors: result.tutors,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
        },
    });
});
// Get tutor by ID for review
AdminController.getTutorById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { tutorId } = req.params;
    const tutor = await adminService_1.AdminService.getTutorById(tutorId);
    res.json({ success: true, tutor });
});
// Approve tutor
AdminController.approveTutor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { tutorId } = req.params;
    const { adminNotes } = req.body;
    const tutor = await adminService_1.AdminService.approveTutor(tutorId, adminNotes);
    res.json({
        success: true,
        message: 'Tutor approved successfully',
        tutor,
    });
});
// Reject tutor
AdminController.rejectTutor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { tutorId } = req.params;
    const { reason } = req.body;
    if (!reason) {
        throw new errorHandler_1.AppError('Rejection reason is required', 400);
    }
    const result = await adminService_1.AdminService.rejectTutor(tutorId, reason);
    res.json({
        success: true,
        message: 'Tutor application rejected',
        tutorId: result.id,
    });
});
// Set background check status
AdminController.setBackgroundCheckStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { tutorId } = req.params;
    const { isBackgroundChecked } = req.body;
    if (typeof isBackgroundChecked !== 'boolean') {
        throw new errorHandler_1.AppError('isBackgroundChecked must be a boolean', 400);
    }
    const result = await adminService_1.AdminService.setBackgroundCheckStatus(tutorId, isBackgroundChecked);
    res.json({
        success: true,
        message: 'Background check status updated',
        tutor: {
            id: result.id,
            isBackgroundChecked: result.isBackgroundChecked,
        },
    });
});
// Get all users
AdminController.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { role, search, isVerified } = req.query;
    const { page, limit } = (0, pagination_1.getPaginationParams)(req, 20, 100);
    const filters = { page, limit };
    if (role)
        filters.role = role;
    if (search)
        filters.search = search;
    if (isVerified !== undefined)
        filters.isVerified = isVerified === 'true';
    const result = await adminService_1.AdminService.getAllUsers(filters);
    res.json({
        success: true,
        users: result.users,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
        },
    });
});
// Get user by ID
AdminController.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { userId } = req.params;
    const user = await adminService_1.AdminService.getUserById(userId);
    res.json({ success: true, user });
});
// Update user status (suspend/activate)
AdminController.updateUserStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== types_1.UserRole.ADMIN) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    const { userId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
        throw new errorHandler_1.AppError('isActive must be a boolean', 400);
    }
    const result = await adminService_1.AdminService.updateUserStatus(userId, isActive);
    res.json({
        success: true,
        message: result.message,
        user: result,
    });
});
//# sourceMappingURL=adminController.js.map