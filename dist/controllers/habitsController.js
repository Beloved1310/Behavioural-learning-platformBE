"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const habitsService_1 = __importDefault(require("../services/habitsService"));
class HabitsController {
}
exports.HabitsController = HabitsController;
_a = HabitsController;
// Get habit heatmap data
HabitsController.getHeatmap = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const heatmap = await habitsService_1.default.getHeatmap(userId, days);
    res.json({ success: true, heatmap });
});
// Get all active streaks
HabitsController.getStreaks = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const streaks = await habitsService_1.default.getStreaks(userId);
    res.json({
        success: true,
        streaks,
    });
});
//# sourceMappingURL=habitsController.js.map