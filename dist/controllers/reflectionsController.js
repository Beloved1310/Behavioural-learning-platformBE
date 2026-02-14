"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectionsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const ReflectionEntryRepository_1 = __importDefault(require("../repositories/ReflectionEntryRepository"));
const behavioralService_1 = require("../services/behavioralService");
const mongoose_1 = require("mongoose");
const pagination_1 = require("../utils/pagination");
class ReflectionsController {
}
exports.ReflectionsController = ReflectionsController;
_a = ReflectionsController;
// Get reflections
ReflectionsController.getReflections = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const period = req.query.period || 'week';
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 10, 50);
    let reflections;
    let total;
    if (period === 'week') {
        // For week view, get all and paginate
        const allReflections = await ReflectionEntryRepository_1.default.findByWeek(userId);
        total = allReflections.length;
        reflections = allReflections.slice(skip, skip + limit);
    }
    else {
        // For all view, use repository method with pagination
        const allReflections = await ReflectionEntryRepository_1.default.findByUser(userId, 1000); // Get large number, then paginate
        total = allReflections.length;
        reflections = allReflections.slice(skip, skip + limit);
    }
    const transformed = reflections.map((reflection) => ({
        id: reflection._id.toString(),
        date: reflection.date,
        prompt: reflection.prompt,
        response: reflection.response,
        type: reflection.type,
        mood: reflection.mood,
        tutorFeedback: reflection.tutorFeedback
            ? {
                tutorId: reflection.tutorFeedback.tutorId.toString(),
                comment: reflection.tutorFeedback.comment,
                feedbackAt: reflection.tutorFeedback.feedbackAt,
                isRead: reflection.tutorFeedback.isRead,
            }
            : null,
        createdAt: reflection.createdAt,
    }));
    const paginationResult = (0, pagination_1.createPaginationResult)(transformed, total, page, limit);
    res.json({
        success: true,
        reflections: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
// Create reflection entry
ReflectionsController.createReflection = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { prompt, response, type, mood } = req.body;
    if (!prompt || !response) {
        throw new errorHandler_1.AppError('Prompt and response are required', 400);
    }
    // Check if today's reflection already exists
    if (type === 'daily') {
        const today = await ReflectionEntryRepository_1.default.findToday(userId);
        if (today) {
            throw new errorHandler_1.AppError('Daily reflection already completed today', 400);
        }
    }
    const reflection = await ReflectionEntryRepository_1.default.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        date: new Date(),
        prompt,
        response,
        type: type || 'daily',
        mood,
    });
    res.status(201).json({
        success: true,
        reflection: {
            id: reflection._id.toString(),
            date: reflection.date,
            prompt: reflection.prompt,
            response: reflection.response,
            type: reflection.type,
            mood: reflection.mood,
        },
    });
});
// Get reflection insights
ReflectionsController.getInsights = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const reflections = await ReflectionEntryRepository_1.default.findByWeek(userId);
    const streak = await ReflectionEntryRepository_1.default.getReflectionStreak(userId);
    // Simple pattern detection
    const responses = reflections.map((r) => r.response.toLowerCase());
    const patterns = [];
    if (responses.some((r) => r.includes('struggl'))) {
        patterns.push("You mentioned 'struggling' this week");
    }
    if (responses.some((r) => r.includes('great') || r.includes('good') || r.includes('amazing'))) {
        patterns.push('You had positive reflections this week!');
    }
    if (streak >= 5) {
        patterns.push(`You've been consistent with reflections for ${streak} days!`);
    }
    res.json({
        success: true,
        insights: {
            streak,
            totalReflections: reflections.length,
            patterns: patterns.length > 0 ? patterns : ['Keep reflecting to see insights!'],
        },
    });
});
// Get today's reflection prompt
ReflectionsController.getTodayPrompt = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const prompts = await behavioralService_1.BehavioralService.getReflectionPrompts();
    res.json({ success: true, prompts });
});
//# sourceMappingURL=reflectionsController.js.map