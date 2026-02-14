"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilestoneService = void 0;
const mongoose_1 = require("mongoose");
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const BadgeRepository_1 = __importDefault(require("../repositories/BadgeRepository"));
const UserBadgeRepository_1 = __importDefault(require("../repositories/UserBadgeRepository"));
const types_1 = require("../types");
const errorHandler_1 = require("../middleware/errorHandler");
const notificationService_1 = __importDefault(require("./notificationService"));
const logger_1 = require("../utils/logger");
class MilestoneService {
    /**
     * Get upcoming milestones for a user
     */
    async getUpcoming(userId) {
        const user = await UserRepository_1.default.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const streakCount = user.streakCount || 0;
        const goals = await GoalRepository_1.default.findByUser(userId, true);
        // Find next milestone for each goal
        const goalMilestones = goals
            .map((goal) => {
            const progressPercent = (goal.current / goal.target) * 100;
            const milestones = goal.milestones || [];
            const achievedMilestones = goal.achievedMilestones || [];
            const nextMilestone = milestones
                .filter((m) => progressPercent < m && !achievedMilestones.includes(m))
                .sort((a, b) => a - b)[0];
            if (nextMilestone) {
                const targetValue = Math.ceil((goal.target * nextMilestone) / 100);
                return {
                    type: 'goal',
                    goalId: goal._id.toString(),
                    goalTitle: goal.title,
                    current: goal.current,
                    target: targetValue,
                    milestonePercent: nextMilestone,
                };
            }
            return null;
        })
            .filter(Boolean);
        // Streak milestones
        const streakMilestones = [
            { days: 7, current: streakCount },
            { days: 30, current: streakCount },
            { days: 100, current: streakCount },
        ]
            .filter((m) => m.current < m.days)
            .sort((a, b) => a.days - b.days)[0];
        const upcoming = [];
        if (goalMilestones.length > 0) {
            upcoming.push(goalMilestones[0]);
        }
        if (streakMilestones) {
            upcoming.push({
                type: 'streak',
                current: streakMilestones.current,
                target: streakMilestones.days,
            });
        }
        return upcoming[0] || null;
    }
    /**
     * Check and award milestones
     */
    async checkMilestones(userId) {
        const user = await UserRepository_1.default.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const streakCount = user.streakCount || 0;
        const goals = await GoalRepository_1.default.findByUser(userId, true);
        const newMilestones = [];
        const notificationsToSend = [];
        // Check streak milestones
        const streakMilestones = [7, 30, 100];
        for (const milestone of streakMilestones) {
            if (streakCount >= milestone) {
                // Check if badge already exists
                const existingBadge = await BadgeRepository_1.default.findOne({
                    type: types_1.BadgeType.MILESTONE,
                    name: `${milestone}-Day Streak`,
                });
                if (existingBadge) {
                    const hasBadge = await UserBadgeRepository_1.default.findOne({
                        userId: new mongoose_1.Types.ObjectId(userId),
                        badgeId: existingBadge._id,
                    });
                    if (!hasBadge) {
                        const milestoneTitle = `${milestone}-Day Streak`;
                        newMilestones.push({
                            type: 'streak',
                            title: milestoneTitle,
                            description: `You've maintained a ${milestone}-day login streak!`,
                            icon: '🔥',
                            milestone,
                        });
                        notificationsToSend.push({
                            userId,
                            title: milestoneTitle,
                        });
                    }
                }
            }
        }
        // Check goal milestones
        for (const goal of goals) {
            const progressPercent = (goal.current / goal.target) * 100;
            const milestones = goal.milestones || [];
            const achievedMilestones = goal.achievedMilestones || [];
            const newlyAchieved = milestones.filter((m) => {
                return progressPercent >= m && !achievedMilestones.includes(m);
            });
            if (newlyAchieved.length > 0) {
                for (const milestone of newlyAchieved) {
                    const milestoneTitle = `${milestone}% Goal Progress - ${goal.title}`;
                    newMilestones.push({
                        type: 'goal',
                        goalId: goal._id.toString(),
                        goalTitle: goal.title,
                        title: milestoneTitle,
                        description: `You've reached ${milestone}% of your "${goal.title}" goal!`,
                        icon: '🎯',
                        milestone,
                    });
                    notificationsToSend.push({
                        userId,
                        title: milestoneTitle,
                    });
                }
            }
        }
        // Send notifications for new milestones
        for (const notif of notificationsToSend) {
            await notificationService_1.default
                .notifyMilestoneAchieved(notif.userId, notif.title)
                .catch((error) => {
                logger_1.logger.error('Failed to send milestone notification', error, { userId: notif.userId });
            });
        }
        return {
            newMilestones,
            hasNewMilestones: newMilestones.length > 0,
        };
    }
}
exports.MilestoneService = MilestoneService;
exports.default = new MilestoneService();
//# sourceMappingURL=milestoneService.js.map