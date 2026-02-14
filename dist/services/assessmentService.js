"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentService = void 0;
const mongoose_1 = require("mongoose");
const WeeklyAssessmentRepository_1 = __importDefault(require("../repositories/WeeklyAssessmentRepository"));
const errorHandler_1 = require("../middleware/errorHandler");
class AssessmentService {
    /**
     * Get current week's assessment for a user
     */
    async getCurrentAssessment(userId) {
        const assessment = await WeeklyAssessmentRepository_1.default.findCurrentWeek(userId);
        if (!assessment) {
            return null;
        }
        return {
            id: assessment._id.toString(),
            weekStart: assessment.weekStart,
            weekRating: assessment.weekRating,
            whatWentWell: assessment.whatWentWell,
            challenges: assessment.challenges,
            nextWeekFocus: assessment.nextWeekFocus,
            commitmentLevel: assessment.commitmentLevel,
            tutorFeedback: assessment.tutorFeedback,
            completedAt: assessment.completedAt,
        };
    }
    /**
     * Submit weekly assessment
     */
    async submitAssessment(userId, data) {
        // Validate input
        if (!data.weekRating ||
            !data.whatWentWell ||
            !data.challenges ||
            !data.nextWeekFocus ||
            !data.commitmentLevel) {
            throw new errorHandler_1.AppError('All fields are required', 400);
        }
        if (data.weekRating < 1 ||
            data.weekRating > 5 ||
            data.commitmentLevel < 1 ||
            data.commitmentLevel > 5) {
            throw new errorHandler_1.AppError('Ratings must be between 1 and 5', 400);
        }
        // Calculate week start (Monday)
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        // Check if assessment already exists for this week
        const existing = await WeeklyAssessmentRepository_1.default.findCurrentWeek(userId);
        if (existing) {
            throw new errorHandler_1.AppError('Assessment already submitted for this week', 400);
        }
        // Create assessment
        const assessment = await WeeklyAssessmentRepository_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            weekStart,
            weekRating: parseInt(data.weekRating.toString()),
            whatWentWell: data.whatWentWell,
            challenges: data.challenges,
            nextWeekFocus: data.nextWeekFocus,
            commitmentLevel: parseInt(data.commitmentLevel.toString()),
            completedAt: new Date(),
        });
        return {
            id: assessment._id.toString(),
            weekStart: assessment.weekStart,
            weekRating: assessment.weekRating,
            commitmentLevel: assessment.commitmentLevel,
        };
    }
    /**
     * Get assessment trends
     */
    async getTrends(userId, weeks = 8) {
        const trends = await WeeklyAssessmentRepository_1.default.getTrends(userId, weeks);
        return {
            weekRatings: trends.weekRatings.map((t) => ({
                week: t.week,
                rating: t.rating,
            })),
            commitmentLevels: trends.commitmentLevels.map((t) => ({
                week: t.week,
                level: t.level,
            })),
        };
    }
}
exports.AssessmentService = AssessmentService;
exports.default = new AssessmentService();
//# sourceMappingURL=assessmentService.js.map