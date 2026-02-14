"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorGoalsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const pagination_1 = require("../utils/pagination");
const notificationService_1 = __importDefault(require("../services/notificationService"));
class TutorGoalsController {
}
exports.TutorGoalsController = TutorGoalsController;
_a = TutorGoalsController;
// Get all goals assigned by this tutor
TutorGoalsController.getAssignedGoals = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    const allGoals = await GoalRepository_1.default.findByTutor(tutorId);
    const total = allGoals.length;
    const paginatedGoals = allGoals.slice(skip, skip + limit);
    // Get student names for each goal
    const goalsWithStudents = await Promise.all(paginatedGoals.map(async (goal) => {
        const student = await UserRepository_1.default.findById(goal.userId.toString());
        const studentName = student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown Student';
        const progressPercent = Math.round((goal.current / goal.target) * 100);
        return {
            id: goal._id.toString(),
            studentId: goal.userId.toString(),
            studentName,
            title: goal.title,
            description: goal.description,
            target: goal.target,
            current: goal.current,
            progressPercent,
            deadline: goal.deadline,
            milestones: goal.milestones || [],
            achievedMilestones: goal.achievedMilestones || [],
            assignedAt: goal.assignedAt,
            createdAt: goal.createdAt,
        };
    }));
    const paginationResult = (0, pagination_1.createPaginationResult)(goalsWithStudents, total, page, limit);
    res.json({
        success: true,
        goals: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Assign goal to student
TutorGoalsController.assignGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { studentId } = req.params;
    const { title, description, target, deadline, milestones } = req.body;
    if (!title || !target) {
        throw new errorHandler_1.AppError('Title and target are required', 400);
    }
    // Verify student exists
    const student = await UserRepository_1.default.findById(studentId);
    if (!student) {
        throw new errorHandler_1.AppError('Student not found', 404);
    }
    if (student.role !== types_1.UserRole.STUDENT) {
        throw new errorHandler_1.AppError('User is not a student', 400);
    }
    // Create goal with tutor assignment (tutor-assigned goals are automatically active)
    const goal = await GoalRepository_1.default.create({
        userId: new mongoose_1.Types.ObjectId(studentId),
        title,
        description,
        target: parseInt(target),
        current: 0,
        deadline: deadline ? new Date(deadline) : undefined,
        milestones: milestones || [25, 50, 75, 100],
        achievedMilestones: [],
        assignedBy: new mongoose_1.Types.ObjectId(tutorId),
        assignedAt: new Date(),
        status: 'active', // Tutor-assigned goals are immediately active
        isActive: true,
    });
    // Notify student
    const tutor = await UserRepository_1.default.findById(tutorId);
    const tutorName = tutor
        ? `${tutor.firstName} ${tutor.lastName}`
        : 'Your tutor';
    await notificationService_1.default.notifyGoalAssigned(studentId, title, tutorName).catch(console.error);
    res.status(201).json({
        success: true,
        goal: {
            id: goal._id.toString(),
            studentId,
            title: goal.title,
            description: goal.description,
            target: goal.target,
            current: goal.current,
            deadline: goal.deadline,
            milestones: goal.milestones,
            assignedBy: tutorId,
            assignedAt: goal.assignedAt,
            status: goal.status || 'active',
        },
    });
});
// Get pending goals (student-initiated goals awaiting approval)
TutorGoalsController.getPendingGoals = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can view pending goals', 403);
    }
    // Get all students assigned to this tutor (you may need to implement this relationship)
    // For now, get all goals with status 'pending_approval' where assignedBy is null
    // In a full implementation, you'd filter by tutor's students
    const allPendingGoals = await GoalRepository_1.default.find({
        status: 'pending_approval',
        assignedBy: { $exists: false }, // Student-initiated goals don't have assignedBy
    });
    const total = allPendingGoals.length;
    const paginatedGoals = allPendingGoals.slice(skip, skip + limit);
    // Get student names for each goal
    const goalsWithStudents = await Promise.all(paginatedGoals.map(async (goal) => {
        const student = await UserRepository_1.default.findById(goal.userId.toString());
        const studentName = student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown Student';
        return {
            id: goal._id.toString(),
            studentId: goal.userId.toString(),
            studentName,
            title: goal.title,
            description: goal.description,
            target: goal.target,
            current: goal.current,
            deadline: goal.deadline,
            createdAt: goal.createdAt,
        };
    }));
    const paginationResult = (0, pagination_1.createPaginationResult)(goalsWithStudents, total, page, limit);
    res.json({
        success: true,
        goals: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Approve a pending goal
TutorGoalsController.approveGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { goalId } = req.params;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can approve goals', 403);
    }
    const goal = await GoalRepository_1.default.findById(goalId);
    if (!goal) {
        throw new errorHandler_1.AppError('Goal not found', 404);
    }
    if (goal.status !== 'pending_approval') {
        throw new errorHandler_1.AppError('Goal is not pending approval', 400);
    }
    // Approve the goal
    goal.status = 'active';
    await goal.save();
    // Notify student
    await notificationService_1.default
        .notifyGoalApproved(goal.userId.toString(), goal.title)
        .catch(console.error);
    res.json({
        success: true,
        goal: {
            id: goal._id.toString(),
            status: 'active',
            message: 'Goal approved successfully',
        },
    });
});
// Reject a pending goal with feedback
TutorGoalsController.rejectGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { goalId } = req.params;
    const { feedback } = req.body;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can reject goals', 403);
    }
    const goal = await GoalRepository_1.default.findById(goalId);
    if (!goal) {
        throw new errorHandler_1.AppError('Goal not found', 404);
    }
    if (goal.status !== 'pending_approval') {
        throw new errorHandler_1.AppError('Goal is not pending approval', 400);
    }
    // Reject the goal with feedback
    goal.status = 'rejected';
    goal.tutorFeedback = feedback || 'Goal needs adjustment. Please revise and resubmit.';
    await goal.save();
    // Notify student
    await notificationService_1.default
        .notifyGoalRejected(goal.userId.toString(), goal.title, feedback)
        .catch(console.error);
    res.json({
        success: true,
        goal: {
            id: goal._id.toString(),
            status: 'rejected',
            tutorFeedback: goal.tutorFeedback,
            message: 'Goal rejected with feedback',
        },
    });
});
//# sourceMappingURL=tutorGoalsController.js.map