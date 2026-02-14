"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentReportsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const User_1 = require("../models/User");
const types_1 = require("../types");
const emailService_1 = require("../services/emailService");
const mongoose_1 = require("mongoose");
const QuizAttemptRepository_1 = __importDefault(require("../repositories/QuizAttemptRepository"));
const UserProgressRepository_1 = __importDefault(require("../repositories/UserProgressRepository"));
class ParentReportsController {
}
exports.ParentReportsController = ParentReportsController;
_a = ParentReportsController;
// Send periodic progress report email to parent
ParentReportsController.sendProgressReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = 'weekly' } = req.body;
    if (userRole !== types_1.UserRole.PARENT) {
        throw new errorHandler_1.AppError('Only parents can request this report', 403);
    }
    const parent = await User_1.User.findById(userId);
    if (!parent) {
        throw new errorHandler_1.AppError('Parent not found', 404);
    }
    // Get all children
    const children = await User_1.User.find({ parentId: new mongoose_1.Types.ObjectId(userId) });
    if (children.length === 0) {
        return res.json({ message: 'No children found', sent: false });
    }
    const childrenIds = children.map((child) => child._id);
    const startDate = new Date();
    if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
    }
    else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
    }
    // Get quiz attempts for all children
    const attempts = await QuizAttemptRepository_1.default.model
        .find({
        studentId: { $in: childrenIds },
        completedAt: { $gte: startDate },
    })
        .populate('quizId', 'subject');
    // Get progress data for all children
    const progressData = await Promise.all(children.map(async (child) => {
        const childAttempts = attempts.filter((a) => a.studentId.toString() === child._id.toString());
        const progress = await UserProgressRepository_1.default.findByUser(child._id.toString());
        const totalStudyHours = progress
            ? progress.studyTime / 60 // Convert minutes to hours
            : 0;
        const averageScore = childAttempts.length > 0
            ? Math.round(childAttempts.reduce((sum, a) => sum + a.percentage, 0) /
                childAttempts.length)
            : 0;
        // Get strongest and weakest subjects
        const subjectScores = {};
        childAttempts.forEach((attempt) => {
            const subject = attempt.quizId?.subject || 'Unknown';
            if (!subjectScores[subject]) {
                subjectScores[subject] = [];
            }
            subjectScores[subject].push(attempt.percentage);
        });
        const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
            subject,
            average: scores.reduce((a, b) => a + b, 0) / scores.length,
        }));
        const strongestSubject = subjectAverages.length > 0
            ? subjectAverages.sort((a, b) => b.average - a.average)[0].subject
            : 'N/A';
        const weakestSubject = subjectAverages.length > 0
            ? subjectAverages.sort((a, b) => a.average - b.average)[0].subject
            : 'N/A';
        return {
            name: `${child.firstName} ${child.lastName}`.trim(),
            studyHours: totalStudyHours,
            quizzesCompleted: childAttempts.length,
            averageScore,
            progress: progress ? progress.averageScore || 0 : 0,
            strongestSubject,
            weakestSubject,
        };
    }));
    const familyTotalStudyHours = progressData.reduce((sum, child) => sum + child.studyHours, 0);
    const familyAverageProgress = progressData.length > 0
        ? Math.round(progressData.reduce((sum, child) => sum + child.progress, 0) / progressData.length)
        : 0;
    // Send email
    await (0, emailService_1.sendParentProgressReportEmail)(parent.email, parent.firstName, {
        period: period === 'weekly' ? 'Weekly' : 'Monthly',
        children: progressData,
        familyTotalStudyHours,
        familyAverageProgress,
    });
    res.json({
        message: 'Progress report email sent successfully',
        sent: true,
    });
});
// Send study habits report email to parent
ParentReportsController.sendStudyHabitsReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = 'weekly' } = req.body;
    if (userRole !== types_1.UserRole.PARENT) {
        throw new errorHandler_1.AppError('Only parents can request this report', 403);
    }
    const parent = await User_1.User.findById(userId);
    if (!parent) {
        throw new errorHandler_1.AppError('Parent not found', 404);
    }
    const children = await User_1.User.find({ parentId: new mongoose_1.Types.ObjectId(userId) });
    if (children.length === 0) {
        return res.json({ message: 'No children found', sent: false });
    }
    const startDate = new Date();
    if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
    }
    else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
    }
    const habitsData = await Promise.all(children.map(async (child) => {
        const progress = await UserProgressRepository_1.default.findByUser(child._id.toString());
        const streakCount = child.streakCount || 0;
        // Calculate average study time (simplified - in real app, would track daily)
        const totalStudyTime = progress ? progress.studyTime || 0 : 0;
        const days = period === 'weekly' ? 7 : 30;
        const averageStudyTime = totalStudyTime / days / 60; // Convert to hours
        return {
            name: `${child.firstName} ${child.lastName}`.trim(),
            averageStudyTime,
            studyStreak: streakCount,
            preferredStudyTime: 'Afternoon', // Would be calculated from actual data
            mostActiveDay: 'Monday', // Would be calculated from actual data
            consistencyScore: Math.min(100, Math.round((streakCount / 7) * 100)),
        };
    }));
    await (0, emailService_1.sendParentStudyHabitsEmail)(parent.email, parent.firstName, {
        period: period === 'weekly' ? 'Weekly' : 'Monthly',
        children: habitsData,
    });
    res.json({
        message: 'Study habits report email sent successfully',
        sent: true,
    });
});
// Send behavioral insights report email to parent
ParentReportsController.sendBehavioralInsightsReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = 'weekly' } = req.body;
    if (userRole !== types_1.UserRole.PARENT) {
        throw new errorHandler_1.AppError('Only parents can request this report', 403);
    }
    const parent = await User_1.User.findById(userId);
    if (!parent) {
        throw new errorHandler_1.AppError('Parent not found', 404);
    }
    const children = await User_1.User.find({ parentId: new mongoose_1.Types.ObjectId(userId) });
    if (children.length === 0) {
        return res.json({ message: 'No children found', sent: false });
    }
    const startDate = new Date();
    if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
    }
    else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
    }
    const childrenIds = children.map((child) => child._id);
    const attempts = await QuizAttemptRepository_1.default.model.find({
        studentId: { $in: childrenIds },
        completedAt: { $gte: startDate },
    });
    const insightsData = await Promise.all(children.map(async (child) => {
        const childAttempts = attempts.filter((a) => a.studentId.toString() === child._id.toString());
        const averageScore = childAttempts.length > 0
            ? childAttempts.reduce((sum, a) => sum + a.percentage, 0) /
                childAttempts.length
            : 0;
        const engagementLevel = averageScore >= 80 ? 'High' : averageScore >= 60 ? 'Medium' : 'Low';
        const motivationTrend = childAttempts.length > 3 ? 'Improving' : 'Stable';
        return {
            name: `${child.firstName} ${child.lastName}`.trim(),
            engagementLevel,
            motivationTrend,
            focusAreas: ['Mathematics', 'Reading'], // Would be calculated from actual data
            achievements: childAttempts.length > 0 ? [`Completed ${childAttempts.length} quizzes`] : [],
            recommendations: averageScore < 60
                ? ['Encourage more practice', 'Review difficult topics']
                : ['Keep up the great work!', 'Continue consistent study'],
        };
    }));
    await (0, emailService_1.sendParentBehavioralInsightsEmail)(parent.email, parent.firstName, {
        period: period === 'weekly' ? 'Weekly' : 'Monthly',
        children: insightsData,
    });
    res.json({
        message: 'Behavioral insights report email sent successfully',
        sent: true,
    });
});
//# sourceMappingURL=parentReportsController.js.map