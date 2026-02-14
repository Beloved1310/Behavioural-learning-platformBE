"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const habitsController_1 = require("../controllers/habitsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Habits routes
router.get('/heatmap', habitsController_1.HabitsController.getHeatmap);
router.get('/streaks', habitsController_1.HabitsController.getStreaks);
exports.default = router;
//# sourceMappingURL=habits.js.map