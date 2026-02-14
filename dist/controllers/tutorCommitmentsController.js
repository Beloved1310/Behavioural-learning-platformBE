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
exports.TutorCommitmentsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const WeeklyCommitmentRepository_1 = __importDefault(require("../repositories/WeeklyCommitmentRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const pagination_1 = require("../utils/pagination");
const notificationService_1 = __importDefault(require("../services/notificationService"));
class TutorCommitmentsController {
}
exports.TutorCommitmentsController = TutorCommitmentsController;
_a = TutorCommitmentsController;
// Assign commitment to student
TutorCommitmentsController.assignCommitment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { studentId } = req.params;
    const { commitments, weekStart } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can assign commitments', 403);
    }
    if (!commitments || !Array.isArray(commitments) || commitments.length === 0) {
        throw new errorHandler_1.AppError('Commitments array is required', 400);
    }
    if (commitments.length > 5) {
        throw new errorHandler_1.AppError('Maximum 5 commitments per week', 400);
    }
    // Verify student exists
    const student = await UserRepository_1.default.findById(studentId);
    if (!student) {
        throw new errorHandler_1.AppError('Student not found', 404);
    }
    if (student.role !== types_1.UserRole.STUDENT) {
        throw new errorHandler_1.AppError('User is not a student', 400);
    }
    // Calculate week start and end
    let weekStartDate;
    if (weekStart) {
        weekStartDate = new Date(weekStart);
        weekStartDate.setHours(0, 0, 0, 0);
        const day = weekStartDate.getDay();
        const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
        weekStartDate.setDate(diff);
    }
    else {
        const now = new Date();
        weekStartDate = new Date(now);
        weekStartDate.setHours(0, 0, 0, 0);
        const day = weekStartDate.getDay();
        const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
        weekStartDate.setDate(diff);
    }
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    // Create or update commitment with tutor assignment
    const WeeklyCommitment = (await Promise.resolve().then(() => __importStar(require('../models/WeeklyCommitment')))).WeeklyCommitment;
    const commitment = await WeeklyCommitment.findOne({
        userId: new mongoose_1.Types.ObjectId(studentId),
        weekStart: weekStartDate,
    });
    if (commitment) {
        // Update existing commitment
        commitment.commitments = commitments.map((c) => ({
            text: c.text,
            type: c.type || 'time',
            target: parseInt(c.target) || 0,
            completed: false,
        }));
        commitment.assignedBy = new mongoose_1.Types.ObjectId(tutorId);
        commitment.assignedAt = new Date();
        await commitment.save();
    }
    else {
        // Create new commitment
        const newCommitment = await WeeklyCommitmentRepository_1.default.create({
            userId: new mongoose_1.Types.ObjectId(studentId),
            weekStart: weekStartDate,
            weekEnd,
            commitments: commitments.map((c) => ({
                text: c.text,
                type: c.type || 'time',
                target: parseInt(c.target) || 0,
                completed: false,
            })),
            assignedBy: new mongoose_1.Types.ObjectId(tutorId),
            assignedAt: new Date(),
        });
        // Notify student
        const tutor = await UserRepository_1.default.findById(tutorId);
        const tutorName = tutor
            ? `${tutor.firstName} ${tutor.lastName}`
            : 'Your tutor';
        await notificationService_1.default.notifyCommitmentAssigned(studentId, tutorName).catch(console.error);
        res.status(201).json({
            success: true,
            commitment: {
                id: newCommitment._id.toString(),
                studentId,
                weekStart: newCommitment.weekStart,
                weekEnd: newCommitment.weekEnd,
                commitments: newCommitment.commitments,
                assignedBy: tutorId,
                assignedAt: newCommitment.assignedAt,
            },
        });
        return;
    }
    // Notify student (for updated commitment)
    const tutor = await UserRepository_1.default.findById(tutorId);
    const tutorName = tutor
        ? `${tutor.firstName} ${tutor.lastName}`
        : 'Your tutor';
    await notificationService_1.default.notifyCommitmentAssigned(studentId, tutorName).catch(console.error);
    res.json({
        success: true,
        commitment: {
            id: commitment._id.toString(),
            studentId,
            weekStart: commitment.weekStart,
            weekEnd: commitment.weekEnd,
            commitments: commitment.commitments,
            assignedBy: tutorId,
            assignedAt: commitment.assignedAt,
        },
    });
});
// Get all commitments assigned by this tutor
TutorCommitmentsController.getAssignedCommitments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can view assigned commitments', 403);
    }
    const allCommitments = await WeeklyCommitmentRepository_1.default.find({
        assignedBy: new mongoose_1.Types.ObjectId(tutorId),
    });
    const total = allCommitments.length;
    const paginatedCommitments = allCommitments.slice(skip, skip + limit);
    // Get student names for each commitment
    const commitmentsWithStudents = await Promise.all(paginatedCommitments.map(async (commitment) => {
        const student = await UserRepository_1.default.findById(commitment.userId.toString());
        const studentName = student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown Student';
        const commitments = commitment.commitments || [];
        const completed = commitments.filter((c) => c.completed).length;
        const completionRate = commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;
        return {
            id: commitment._id.toString(),
            studentId: commitment.userId.toString(),
            studentName,
            weekStart: commitment.weekStart,
            weekEnd: commitment.weekEnd,
            commitments: commitments.map((c) => ({
                text: c.text,
                type: c.type,
                target: c.target,
                completed: c.completed,
                completedAt: c.completedAt,
            })),
            completionRate,
            assignedAt: commitment.assignedAt,
        };
    }));
    const paginationResult = (0, pagination_1.createPaginationResult)(commitmentsWithStudents, total, page, limit);
    res.json({
        success: true,
        commitments: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
//# sourceMappingURL=tutorCommitmentsController.js.map