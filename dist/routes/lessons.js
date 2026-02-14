"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lessonController_1 = require("../controllers/lessonController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Lesson routes
router.get('/', lessonController_1.LessonController.getLessons);
router.get('/topics', lessonController_1.LessonController.getTopics);
router.get('/:id', lessonController_1.LessonController.getLessonById);
exports.default = router;
//# sourceMappingURL=lessons.js.map