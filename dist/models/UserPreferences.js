"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreferences = void 0;
const mongoose_1 = require("mongoose");
const userPreferencesSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    studyReminders: {
        type: Boolean,
        default: true
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de'] // Can extend this list
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    pushNotifications: {
        type: Boolean,
        default: true
    },
    smsNotifications: {
        type: Boolean,
        default: false
    },
    sessionReminders: {
        type: Boolean,
        default: true
    },
    progressReports: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Note: userId already has unique index from schema definition
exports.UserPreferences = (0, mongoose_1.model)('UserPreferences', userPreferencesSchema);
//# sourceMappingURL=UserPreferences.js.map