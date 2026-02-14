"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const assessmentService_1 = __importDefault(require("../services/assessmentService"));
class AssessmentsController {
}
exports.AssessmentsController = AssessmentsController;
_a = AssessmentsController;
// Get current week's assessment
AssessmentsController.getCurrentAssessment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const assessment = await assessmentService_1.default.getCurrentAssessment(userId);
    res.json({ success: true, assessment });
});
// Submit weekly assessment
AssessmentsController.submitAssessment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { weekRating, whatWentWell, challenges, nextWeekFocus, commitmentLevel } = req.body;
    const assessment = await assessmentService_1.default.submitAssessment(userId, {
        weekRating,
        whatWentWell,
        challenges,
        nextWeekFocus,
        commitmentLevel,
    });
    res.status(201).json({
        success: true,
        assessment,
    });
});
// Get assessment trends
AssessmentsController.getTrends = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const weeks = parseInt(req.query.weeks) || 8;
    const trends = await assessmentService_1.default.getTrends(userId, weeks);
    res.json({
        success: true,
        trends,
    });
});
//# sourceMappingURL=assessmentsController.js.map