"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRepository_1 = require("./BaseRepository");
const Goal_1 = require("../models/Goal");
const mongoose_1 = require("mongoose");
class GoalRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Goal_1.Goal);
    }
    async findByUser(userId, activeOnly = true) {
        const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
        if (activeOnly) {
            filter.isActive = true;
        }
        return this.find(filter, { sort: { createdAt: -1 } });
    }
    async updateProgress(goalId, current) {
        const goal = await this.findById(goalId);
        if (!goal)
            return null;
        const oldCurrent = goal.current;
        goal.current = current;
        // Check for milestone achievements
        const milestones = goal.milestones || [];
        const achievedMilestones = goal.achievedMilestones || [];
        const progressPercent = (current / goal.target) * 100;
        const newMilestones = milestones.filter((m) => {
            const milestonePercent = m;
            return progressPercent >= milestonePercent && !achievedMilestones.includes(m);
        });
        if (newMilestones.length > 0) {
            goal.achievedMilestones = [...achievedMilestones, ...newMilestones];
        }
        await goal.save();
        return goal;
    }
    async findByTutor(tutorId) {
        return this.find({ assignedBy: new mongoose_1.Types.ObjectId(tutorId) }, {
            sort: { createdAt: -1 },
        });
    }
}
exports.default = new GoalRepository();
//# sourceMappingURL=GoalRepository.js.map