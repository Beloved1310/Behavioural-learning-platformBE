"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const lessonService_1 = require("../services/lessonService");
class LessonController {
}
exports.LessonController = LessonController;
_a = LessonController;
LessonController.getLessons = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { subject, topic, type } = req.query;
    const lessons = await lessonService_1.LessonService.getLessons({ subject, topic, type });
    res.json({ lessons });
});
LessonController.getLessonById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const lesson = await lessonService_1.LessonService.getLessonById(id);
    res.json({ lesson });
});
LessonController.getTopics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { subject } = req.query;
    if (!subject) {
        throw new errorHandler_1.AppError('Subject is required', 400);
    }
    const topics = await lessonService_1.LessonService.getTopicsBySubject(subject);
    res.json({ topics });
});
//# sourceMappingURL=lessonController.js.map