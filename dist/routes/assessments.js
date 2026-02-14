"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assessmentsController_1 = require("../controllers/assessmentsController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const assessments_1 = require("../validation/assessments");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Assessments routes
router.get('/current', assessmentsController_1.AssessmentsController.getCurrentAssessment);
router.post('/weekly', (0, middleware_1.validate)(assessments_1.submitAssessmentSchema), assessmentsController_1.AssessmentsController.submitAssessment);
router.get('/trends', (0, middleware_1.validate)(assessments_1.getAssessmentTrendsSchema), assessmentsController_1.AssessmentsController.getTrends);
exports.default = router;
//# sourceMappingURL=assessments.js.map