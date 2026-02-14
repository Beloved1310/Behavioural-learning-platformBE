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
exports.TutorReflectionsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const ReflectionEntryRepository_1 = __importDefault(require("../repositories/ReflectionEntryRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const pagination_1 = require("../utils/pagination");
const notificationService_1 = __importDefault(require("../services/notificationService"));
class TutorReflectionsController {
}
exports.TutorReflectionsController = TutorReflectionsController;
_a = TutorReflectionsController;
// Get all reflections for a specific student
TutorReflectionsController.getStudentReflections = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { studentId } = req.params;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 20, 100);
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can view student reflections', 403);
    }
    // Verify student exists
    const student = await UserRepository_1.default.findById(studentId);
    if (!student) {
        throw new errorHandler_1.AppError('Student not found', 404);
    }
    // Get all reflections first, then paginate
    const allReflections = await ReflectionEntryRepository_1.default.findByUser(studentId, 1000);
    const total = allReflections.length;
    const paginatedReflections = allReflections.slice(skip, skip + limit);
    const transformed = paginatedReflections.map((reflection) => ({
        id: reflection._id.toString(),
        date: reflection.date,
        prompt: reflection.prompt,
        response: reflection.response,
        type: reflection.type,
        mood: reflection.mood,
        tutorFeedback: reflection.tutorFeedback
            ? {
                tutorId: reflection.tutorFeedback.tutorId.toString(),
                comment: reflection.tutorFeedback.comment,
                feedbackAt: reflection.tutorFeedback.feedbackAt,
                isRead: reflection.tutorFeedback.isRead,
            }
            : null,
        createdAt: reflection.createdAt,
    }));
    const paginationResult = (0, pagination_1.createPaginationResult)(transformed, total, page, limit);
    res.json({
        success: true,
        reflections: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Add feedback to a reflection
TutorReflectionsController.addFeedback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { reflectionId } = req.params;
    const { comment } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can add feedback', 403);
    }
    if (!comment || comment.trim().length === 0) {
        throw new errorHandler_1.AppError('Comment is required', 400);
    }
    if (comment.length > 500) {
        throw new errorHandler_1.AppError('Comment must be 500 characters or less', 400);
    }
    const reflection = await ReflectionEntryRepository_1.default.findById(reflectionId);
    if (!reflection) {
        throw new errorHandler_1.AppError('Reflection not found', 404);
    }
    // Add or update tutor feedback
    reflection.tutorFeedback = {
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        comment: comment.trim(),
        feedbackAt: new Date(),
        isRead: false,
    };
    await reflection.save();
    // Notify student
    const tutor = await UserRepository_1.default.findById(tutorId);
    const tutorName = tutor
        ? `${tutor.firstName} ${tutor.lastName}`
        : 'Your tutor';
    await notificationService_1.default
        .notifyReflectionFeedback(reflection.userId.toString(), tutorName)
        .catch(console.error);
    res.json({
        success: true,
        reflection: {
            id: reflection._id.toString(),
            tutorFeedback: {
                tutorId: tutorId,
                comment: reflection.tutorFeedback.comment,
                feedbackAt: reflection.tutorFeedback.feedbackAt,
                isRead: reflection.tutorFeedback.isRead,
            },
        },
    });
});
// Get all reflections with pending feedback (for tutor dashboard)
TutorReflectionsController.getPendingFeedback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 20, 100);
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can view pending feedback', 403);
    }
    // Get all reflections without tutor feedback (for MVP, we'll get recent reflections)
    // In a full implementation, you'd filter by tutor's students
    const ReflectionEntry = (await Promise.resolve().then(() => __importStar(require('../models/ReflectionEntry')))).ReflectionEntry;
    // Get total count
    const total = await ReflectionEntry.countDocuments({
        tutorFeedback: { $exists: false },
    });
    // Get paginated reflections
    const reflections = await ReflectionEntry.find({
        tutorFeedback: { $exists: false },
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName');
    const transformed = reflections.map((reflection) => {
        const student = reflection.userId;
        const studentName = student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown Student';
        return {
            id: reflection._id.toString(),
            studentId: reflection.userId._id.toString(),
            studentName,
            date: reflection.date,
            prompt: reflection.prompt,
            response: reflection.response,
            type: reflection.type,
            mood: reflection.mood,
            createdAt: reflection.createdAt,
        };
    });
    const paginationResult = (0, pagination_1.createPaginationResult)(transformed, total, page, limit);
    res.json({
        success: true,
        reflections: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
//# sourceMappingURL=tutorReflectionsController.js.map