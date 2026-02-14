"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRepository_1 = require("./BaseRepository");
const WeeklyCommitment_1 = require("../models/WeeklyCommitment");
const mongoose_1 = require("mongoose");
class WeeklyCommitmentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(WeeklyCommitment_1.WeeklyCommitment);
    }
    async findByUser(userId) {
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId) }, { sort: { weekStart: -1 } });
    }
    async findCurrentWeek(userId) {
        const now = new Date();
        const weekStart = this.getWeekStart(now);
        const weekStartDate = new Date(weekStart);
        weekStartDate.setHours(0, 0, 0, 0);
        return this.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            weekStart: {
                $gte: new Date(weekStartDate.getTime()),
                $lt: new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
            },
        });
    }
    getWeekStart(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }
    getWeekEnd(date) {
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd;
    }
    async toggleCommitment(commitmentId, itemIndex) {
        const commitment = await this.findById(commitmentId);
        if (!commitment)
            return null;
        const items = commitment.commitments;
        if (itemIndex >= 0 && itemIndex < items.length) {
            items[itemIndex].completed = !items[itemIndex].completed;
            if (items[itemIndex].completed) {
                items[itemIndex].completedAt = new Date();
            }
            else {
                items[itemIndex].completedAt = undefined;
            }
            await commitment.save();
        }
        return commitment;
    }
    async findByTutor(tutorId) {
        return this.find({ assignedBy: new mongoose_1.Types.ObjectId(tutorId) }, { sort: { weekStart: -1 } });
    }
}
exports.default = new WeeklyCommitmentRepository();
//# sourceMappingURL=WeeklyCommitmentRepository.js.map