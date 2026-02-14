"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorAssessmentsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const WeeklyAssessmentRepository_1 = __importDefault(require("../repositories/WeeklyAssessmentRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
class TutorAssessmentsController {
}
exports.TutorAssessmentsController = TutorAssessmentsController;
_a = TutorAssessmentsController;
// Get student's weekly assessments
TutorAssessmentsController.getStudentAssessments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    // Verify tutor has access to this student (you may want to add relationship check)
    const assessments = await WeeklyAssessmentRepository_1.default.findByUser(studentId, limit);
    res.json({
        success: true,
        assessments: assessments.map((assessment) => ({
            id: assessment._id.toString(),
            userId: assessment.userId.toString(),
            weekStart: assessment.weekStart,
            weekRating: assessment.weekRating,
            whatWentWell: assessment.whatWentWell,
            challenges: assessment.challenges,
            nextWeekFocus: assessment.nextWeekFocus,
            commitmentLevel: assessment.commitmentLevel,
            tutorFeedback: assessment.tutorFeedback,
            completedAt: assessment.completedAt,
            createdAt: assessment.createdAt,
        })),
    });
});
// Get assessments pending feedback
TutorAssessmentsController.getPendingFeedback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    // Get assessments without tutor feedback (you may want to filter by tutor's students)
    const assessments = await WeeklyAssessmentRepository_1.default.find({
        tutorFeedback: { $exists: false },
    }, { sort: { completedAt: -1 }, limit });
    res.json({
        success: true,
        assessments: assessments.map((assessment) => ({
            id: assessment._id.toString(),
            userId: assessment.userId.toString(),
            weekStart: assessment.weekStart,
            weekRating: assessment.weekRating,
            whatWentWell: assessment.whatWentWell,
            challenges: assessment.challenges,
            nextWeekFocus: assessment.nextWeekFocus,
            commitmentLevel: assessment.commitmentLevel,
            completedAt: assessment.completedAt,
        })),
    });
});
// Add feedback to assessment
TutorAssessmentsController.addFeedback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { assessmentId } = req.params;
    const { comment, encouragementLevel } = req.body;
    if (!comment || !comment.trim()) {
        throw new errorHandler_1.AppError('Comment is required', 400);
    }
    const validLevels = ['low', 'medium', 'high'];
    const level = encouragementLevel && validLevels.includes(encouragementLevel)
        ? encouragementLevel
        : 'medium';
    const assessment = await WeeklyAssessmentRepository_1.default.addTutorFeedback(assessmentId, tutorId, comment.trim(), level);
    if (!assessment) {
        throw new errorHandler_1.AppError('Assessment not found', 404);
    }
    // Notify student
    const tutor = await UserRepository_1.default.findById(tutorId);
    const tutorName = tutor
        ? `${tutor.firstName} ${tutor.lastName}`
        : 'Your tutor';
    await notificationService_1.default
        .notifyAssessmentFeedback(assessment.userId.toString(), tutorName)
        .catch(console.error);
    res.json({
        success: true,
        message: 'Feedback added successfully',
        assessment: {
            id: assessment._id.toString(),
            tutorFeedback: assessment.tutorFeedback,
        },
    });
});
//# sourceMappingURL=tutorAssessmentsController.js.map