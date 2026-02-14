"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilestonesController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const milestoneService_1 = __importDefault(require("../services/milestoneService"));
class MilestonesController {
}
exports.MilestonesController = MilestonesController;
_a = MilestonesController;
// Get upcoming milestones
MilestonesController.getUpcoming = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const upcoming = await milestoneService_1.default.getUpcoming(userId);
    res.json({
        success: true,
        upcoming,
    });
});
// Check and award milestones
MilestonesController.checkMilestones = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const result = await milestoneService_1.default.checkMilestones(userId);
    res.json({
        success: true,
        ...result,
    });
});
//# sourceMappingURL=milestonesController.js.map