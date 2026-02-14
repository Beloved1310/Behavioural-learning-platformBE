"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reflectionsController_1 = require("../controllers/reflectionsController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const reflections_1 = require("../validation/reflections");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Reflections routes
router.get('/', (0, middleware_1.validate)(reflections_1.getReflectionsSchema), reflectionsController_1.ReflectionsController.getReflections);
router.post('/', (0, middleware_1.validate)(reflections_1.createReflectionSchema), reflectionsController_1.ReflectionsController.createReflection);
router.get('/insights', reflectionsController_1.ReflectionsController.getInsights);
router.get('/prompts/today', reflectionsController_1.ReflectionsController.getTodayPrompt);
exports.default = router;
//# sourceMappingURL=reflections.js.map