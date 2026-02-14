"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsService = void 0;
const mongoose_1 = require("mongoose");
const CustomEventRepository_1 = __importDefault(require("../repositories/CustomEventRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const errorHandler_1 = require("../middleware/errorHandler");
class HabitsService {
    /**
     * Get habit heatmap data
     */
    async getHeatmap(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        // Get all events in the period
        const events = await CustomEventRepository_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            timestamp: { $gte: startDate },
        }, { sort: { timestamp: -1 } });
        // Group by date
        const activityByDate = {};
        events.forEach((event) => {
            const date = new Date(event.timestamp);
            date.setHours(0, 0, 0, 0);
            const dateKey = date.toISOString().split('T')[0];
            activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
        });
        // Generate heatmap data
        const heatmapData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateKey = date.toISOString().split('T')[0];
            const activity = activityByDate[dateKey] || 0;
            // Categorize activity level (0-3)
            let level = 0;
            if (activity >= 5)
                level = 3;
            else if (activity >= 3)
                level = 2;
            else if (activity >= 1)
                level = 1;
            heatmapData.push({
                date: dateKey,
                activity: level,
                count: activity,
            });
        }
        return heatmapData;
    }
    /**
     * Get all active streaks
     */
    async getStreaks(userId) {
        const user = await UserRepository_1.default.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const loginStreak = user.streakCount || 0;
        // Calculate study streak (consecutive days with session_start events)
        const studyStreak = await this.calculateStreak(userId, 'session_start');
        // Calculate quiz streak (consecutive days with quiz_complete events)
        const quizStreak = await this.calculateStreak(userId, 'quiz_complete');
        return [
            { type: 'login', name: 'Login Streak', days: loginStreak, icon: '🔥' },
            { type: 'study', name: 'Study Streak', days: studyStreak, icon: '📚' },
            { type: 'quiz', name: 'Quiz Streak', days: quizStreak, icon: '🧠' },
        ];
    }
    /**
     * Calculate streak for a specific event type
     */
    async calculateStreak(userId, eventType) {
        const events = await CustomEventRepository_1.default.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            eventType,
        }, { sort: { timestamp: -1 } });
        if (events.length === 0)
            return 0;
        // Get unique dates
        const dates = new Set(events.map((e) => {
            const date = new Date(e.timestamp);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        }));
        // Calculate streak backwards from today
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        while (dates.has(checkDate.getTime())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return streak;
    }
}
exports.HabitsService = HabitsService;
exports.default = new HabitsService();
//# sourceMappingURL=habitsService.js.map