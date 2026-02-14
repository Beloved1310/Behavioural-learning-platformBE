"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milestonesController_1 = require("../controllers/milestonesController");
const auth_1 = require("../middleware/auth");
// Note: checkMilestones doesn't require validation (no body/params)
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Milestones routes
router.get('/upcoming', milestonesController_1.MilestonesController.getUpcoming);
router.post('/check', milestonesController_1.MilestonesController.checkMilestones);
exports.default = router;
//# sourceMappingURL=milestones.js.map