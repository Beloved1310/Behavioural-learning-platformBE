"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferencesSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Update preferences validation
exports.updatePreferencesSchema = {
    body: joi_1.default.object({
        studyReminders: common_1.commonFields.boolean,
        darkMode: common_1.commonFields.boolean,
        language: common_1.commonFields.language,
        timezone: common_1.commonFields.timezone,
        emailNotifications: common_1.commonFields.boolean,
        pushNotifications: common_1.commonFields.boolean,
        smsNotifications: common_1.commonFields.boolean,
        sessionReminders: common_1.commonFields.boolean,
        progressReports: common_1.commonFields.boolean,
        weeklyReport: common_1.commonFields.boolean
    }).min(1).messages({
        'object.min': 'At least one preference must be provided for update'
    })
};
//# sourceMappingURL=preferences.js.map