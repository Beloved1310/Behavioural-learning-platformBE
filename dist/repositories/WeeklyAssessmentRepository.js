"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRepository_1 = require("./BaseRepository");
const WeeklyAssessment_1 = require("../models/WeeklyAssessment");
const mongoose_1 = require("mongoose");
class WeeklyAssessmentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(WeeklyAssessment_1.WeeklyAssessment);
    }
    async findByUser(userId, limit) {
        const options = { sort: { weekStart: -1 } };
        if (limit) {
            options.limit = limit;
        }
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId) }, options);
    }
    async findCurrentWeek(userId) {
        const now = new Date();
        const weekStart = this.getWeekStart(now);
        return this.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            weekStart: weekStart,
        });
    }
    async getTrends(userId, weeks = 8) {
        const assessments = await this.findByUser(userId, weeks);
        return {
            weekRatings: assessments.map((a) => ({
                week: a.weekStart,
                rating: a.weekRating,
            })),
            commitmentLevels: assessments.map((a) => ({
                week: a.weekStart,
                level: a.commitmentLevel,
            })),
        };
    }
    async addTutorFeedback(assessmentId, tutorId, comment, encouragementLevel = 'medium') {
        const assessment = await this.findById(assessmentId);
        if (!assessment)
            return null;
        assessment.tutorFeedback = {
            tutorId: new mongoose_1.Types.ObjectId(tutorId),
            comment,
            encouragementLevel,
            feedbackAt: new Date(),
            isRead: false,
        };
        await assessment.save();
        return assessment;
    }
    getWeekStart(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
}
exports.default = new WeeklyAssessmentRepository();
//# sourceMappingURL=WeeklyAssessmentRepository.js.map