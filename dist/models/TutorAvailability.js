"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorAvailability = void 0;
const mongoose_1 = require("mongoose");
const tutorAvailabilitySchema = new mongoose_1.Schema({
    tutorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
        index: true,
    },
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                // Validate HH:mm format
                return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'startTime must be in HH:mm format (24-hour)',
        },
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'endTime must be in HH:mm format (24-hour)',
        },
    },
    isRecurring: {
        type: Boolean,
        default: true,
        index: true,
    },
    specificDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes for efficient queries
tutorAvailabilitySchema.index({ tutorId: 1, dayOfWeek: 1, isActive: 1 });
tutorAvailabilitySchema.index({ tutorId: 1, isRecurring: 1, isActive: 1 });
tutorAvailabilitySchema.index({ tutorId: 1, specificDate: 1, isActive: 1 });
// Ensure no duplicate recurring availability for same day/time
tutorAvailabilitySchema.index({ tutorId: 1, dayOfWeek: 1, startTime: 1, endTime: 1, isRecurring: 1 }, { unique: true, partialFilterExpression: { isRecurring: true } });
exports.TutorAvailability = (0, mongoose_1.model)('TutorAvailability', tutorAvailabilitySchema);
//# sourceMappingURL=TutorAvailability.js.map