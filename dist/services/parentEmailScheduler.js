"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentEmailScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = require("../models/User");
const types_1 = require("../types");
const mongoose_1 = require("mongoose");
const GoalRepository_1 = __importDefault(require("../repositories/GoalRepository"));
const WeeklyCommitmentRepository_1 = __importDefault(require("../repositories/WeeklyCommitmentRepository"));
const CustomEventRepository_1 = __importDefault(require("../repositories/CustomEventRepository"));
const emailService_1 = require("./emailService");
const logger_1 = require("../utils/logger");
/**
 * Parent Email Scheduler Service
 * Sends automated weekly progress reports to parents
 */
class ParentEmailScheduler {
    constructor() {
        this.isRunning = false;
    }
    /**
     * Start the weekly email scheduler
     * Runs every Monday at 9:00 AM
     */
    start() {
        if (this.isRunning) {
            logger_1.logger.info('Parent email scheduler already running');
            return;
        }
        // Schedule weekly emails every Monday at 9:00 AM
        node_cron_1.default.schedule('0 9 * * 1', async () => {
            logger_1.logger.info('Starting weekly parent email job');
            await this.sendWeeklyReports();
        }, {
            timezone: 'UTC',
        });
        this.isRunning = true;
        logger_1.logger.info('Weekly email scheduler started (Mondays at 9:00 AM UTC)');
    }
    /**
     * Send weekly progress reports to all parents
     */
    async sendWeeklyReports() {
        try {
            // Get all parents
            const parents = await User_1.User.find({ role: types_1.UserRole.PARENT });
            logger_1.logger.info('Found parents to send reports to', { count: parents.length });
            for (const parent of parents) {
                try {
                    // Get all children for this parent
                    const children = await User_1.User.find({
                        parentId: new mongoose_1.Types.ObjectId(parent._id),
                        role: types_1.UserRole.STUDENT,
                    });
                    if (children.length === 0) {
                        console.log(`[ParentEmailScheduler] No children found for parent ${parent.email}`);
                        continue;
                    }
                    // Calculate week start (last Monday)
                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Last Monday
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    // Get progress data for all children
                    const childrenProgress = await Promise.all(children.map(async (child) => {
                        const childId = child._id.toString();
                        // Get goals progress
                        const goals = await GoalRepository_1.default.findByUser(childId, true);
                        const activeGoals = goals.filter((g) => g.isActive && g.status !== 'rejected');
                        const goalProgress = activeGoals.length > 0
                            ? Math.round(activeGoals.reduce((sum, g) => {
                                const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
                                return sum + progress;
                            }, 0) / activeGoals.length)
                            : 0;
                        // Get commitments
                        const commitment = await WeeklyCommitmentRepository_1.default.findCurrentWeek(childId);
                        let commitmentsCompleted = 0;
                        let commitmentsTotal = 0;
                        if (commitment) {
                            const commitments = commitment.commitments || [];
                            commitmentsTotal = commitments.length;
                            commitmentsCompleted = commitments.filter((c) => c.completed).length;
                        }
                        // Calculate consistency (last 7 days)
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        const events = await CustomEventRepository_1.default.find({
                            userId: new mongoose_1.Types.ObjectId(childId),
                            timestamp: { $gte: sevenDaysAgo },
                        }, { limit: 1000 });
                        const activeDays = new Set();
                        events.forEach((event) => {
                            if (event.timestamp) {
                                const date = new Date(event.timestamp);
                                date.setHours(0, 0, 0, 0);
                                activeDays.add(date.getTime());
                            }
                        });
                        const consistencyScore = Math.round((activeDays.size / 7) * 100);
                        // Determine status
                        const streakCount = child.streakCount || 0;
                        const lastLoginAt = child.lastLoginAt ? new Date(child.lastLoginAt) : null;
                        const daysSinceLogin = lastLoginAt
                            ? Math.floor((Date.now() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
                            : 999;
                        let status = 'on-track';
                        if (streakCount === 0 && daysSinceLogin > 3) {
                            status = 'at-risk';
                        }
                        else if (consistencyScore < 50 ||
                            (commitmentsTotal > 0 && commitmentsCompleted / commitmentsTotal < 0.5)) {
                            status = 'needs-attention';
                        }
                        else if (consistencyScore >= 75 && streakCount >= 3) {
                            status = 'on-track';
                        }
                        return {
                            name: `${child.firstName || ''} ${child.lastName || ''}`.trim() || 'Student',
                            streak: streakCount,
                            goalProgress,
                            commitmentsCompleted,
                            commitmentsTotal,
                            consistencyScore,
                            status,
                            lastLoginAt: child.lastLoginAt,
                        };
                    }));
                    // Send email to parent
                    await (0, emailService_1.sendParentWeeklyProgressEmail)(parent.email, parent.firstName || 'Parent', {
                        weekStart: weekStart.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        }),
                        weekEnd: weekEnd.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        }),
                        children: childrenProgress,
                    });
                    console.log(`[ParentEmailScheduler] Weekly report sent to ${parent.email}`);
                }
                catch (error) {
                    console.error(`[ParentEmailScheduler] Error sending report to ${parent.email}:`, error);
                }
            }
            console.log('[ParentEmailScheduler] Weekly email job completed');
        }
        catch (error) {
            console.error('[ParentEmailScheduler] Error in weekly email job:', error);
        }
    }
    /**
     * Manually trigger weekly reports (for testing)
     */
    async triggerWeeklyReports() {
        console.log('[ParentEmailScheduler] Manually triggering weekly reports...');
        await this.sendWeeklyReports();
    }
}
exports.parentEmailScheduler = new ParentEmailScheduler();
exports.default = exports.parentEmailScheduler;
//# sourceMappingURL=parentEmailScheduler.js.map