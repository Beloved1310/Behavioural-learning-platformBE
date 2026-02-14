"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBehavioralInsightsReportSchema = exports.sendStudyHabitsReportSchema = exports.sendProgressReportSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Send progress report validation (matches ParentReportsController.sendProgressReport)
exports.sendProgressReportSchema = {
    body: joi_1.default.object({
        childId: common_1.commonFields.objectId.optional(), // If not provided, sends for all children
        period: joi_1.default.string().valid('week', 'month').default('week'),
    }),
};
// Send study habits report validation
exports.sendStudyHabitsReportSchema = {
    body: joi_1.default.object({
        childId: common_1.commonFields.objectId.optional(),
        period: joi_1.default.string().valid('week', 'month').default('week'),
    }),
};
// Send behavioral insights report validation
exports.sendBehavioralInsightsReportSchema = {
    body: joi_1.default.object({
        childId: common_1.commonFields.objectId.optional(),
        period: joi_1.default.string().valid('week', 'month').default('week'),
    }),
};
//# sourceMappingURL=parentReports.js.map