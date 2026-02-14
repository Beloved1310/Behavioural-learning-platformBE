"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goalsController_1 = require("../controllers/goalsController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const goals_1 = require("../validation/goals");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Goals routes
router.get('/progress', goalsController_1.GoalsController.getGoals);
router.post('/', (0, middleware_1.validate)(goals_1.createGoalSchema), goalsController_1.GoalsController.createGoal);
router.get('/:goalId/milestones', (0, middleware_1.validate)(goals_1.getGoalMilestonesSchema), goalsController_1.GoalsController.getMilestones);
router.post('/:goalId/progress', (0, middleware_1.validate)(goals_1.updateGoalProgressSchema), goalsController_1.GoalsController.updateProgress);
router.delete('/:goalId', (0, middleware_1.validate)(goals_1.deleteGoalSchema), goalsController_1.GoalsController.deleteGoal);
exports.default = router;
//# sourceMappingURL=goals.js.map