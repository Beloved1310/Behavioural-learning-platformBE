"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonService = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const LessonRepository_1 = __importDefault(require("../repositories/LessonRepository"));
class LessonService {
    static async getLessons(filters) {
        const filter = { isActive: true };
        if (filters.subject)
            filter.subject = filters.subject;
        if (filters.topic)
            filter.topic = filters.topic;
        if (filters.type)
            filter.type = filters.type;
        const lessons = await LessonRepository_1.default.findActive(filter);
        return lessons.map((lesson) => ({
            id: lesson._id.toString(),
            title: lesson.title,
            subject: lesson.subject,
            topic: lesson.topic,
            type: lesson.type,
            description: lesson.description,
            content: lesson.content,
            estimatedDuration: lesson.estimatedDuration,
            order: lesson.order,
            createdAt: lesson.createdAt,
        }));
    }
    static async getLessonById(id) {
        const lesson = await LessonRepository_1.default.findActiveById(id);
        if (!lesson)
            throw new errorHandler_1.AppError('Lesson not found', 404);
        return {
            id: lesson._id.toString(),
            title: lesson.title,
            subject: lesson.subject,
            topic: lesson.topic,
            type: lesson.type,
            description: lesson.description,
            content: lesson.content,
            estimatedDuration: lesson.estimatedDuration,
            order: lesson.order,
            createdAt: lesson.createdAt,
        };
    }
    static async getTopicsBySubject(subject) {
        const lessons = await LessonRepository_1.default.findBySubject(subject);
        const topics = [...new Set(lessons.map((lesson) => lesson.topic))];
        return topics.sort();
    }
}
exports.LessonService = LessonService;
exports.default = LessonService;
//# sourceMappingURL=lessonService.js.map