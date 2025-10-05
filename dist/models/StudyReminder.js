"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyReminder = void 0;
const mongoose_1 = require("mongoose");
const studyReminderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    scheduledAt: {
        type: Date,
        required: true,
        index: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: function () {
            return this.isRecurring;
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// Compound indexes for efficient queries
studyReminderSchema.index({ userId: 1, isActive: 1, scheduledAt: 1 });
studyReminderSchema.index({ scheduledAt: 1, isActive: 1 });
// Virtual to populate user details
studyReminderSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email'
});
// Instance method to deactivate reminder
studyReminderSchema.methods.deactivate = function () {
    this.isActive = false;
    return this.save();
};
// Instance method to calculate next occurrence for recurring reminders
studyReminderSchema.methods.getNextOccurrence = function () {
    if (!this.isRecurring || !this.frequency) {
        return null;
    }
    const current = new Date(this.scheduledAt);
    const next = new Date(current);
    switch (this.frequency) {
        case 'daily':
            next.setDate(current.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(current.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(current.getMonth() + 1);
            break;
    }
    return next;
};
// Static method to get user's active reminders
studyReminderSchema.statics.getUserReminders = function (userId) {
    return this.find({ userId, isActive: true })
        .sort({ scheduledAt: 1 });
};
// Static method to get due reminders
studyReminderSchema.statics.getDueReminders = function (date = new Date()) {
    return this.find({
        scheduledAt: { $lte: date },
        isActive: true
    }).populate('user', 'firstName lastName email');
};
// Static method to get upcoming reminders
studyReminderSchema.statics.getUpcomingReminders = function (userId, hours = 24) {
    const now = new Date();
    const future = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    return this.find({
        userId,
        scheduledAt: { $gte: now, $lte: future },
        isActive: true
    }).sort({ scheduledAt: 1 });
};
// Static method to create recurring reminder instances
studyReminderSchema.statics.createRecurringInstances = function (reminderId, count = 10) {
    return this.findById(reminderId).then((reminder) => {
        if (!reminder || !reminder.isRecurring) {
            throw new Error('Reminder not found or not recurring');
        }
        const instances = [];
        let nextDate = new Date(reminder.scheduledAt);
        for (let i = 0; i < count; i++) {
            nextDate = reminder.getNextOccurrence();
            if (!nextDate)
                break;
            instances.push({
                userId: reminder.userId,
                title: reminder.title,
                description: reminder.description,
                scheduledAt: new Date(nextDate),
                isRecurring: false,
                isActive: true
            });
            reminder.scheduledAt = nextDate;
        }
        return this.insertMany(instances);
    });
};
exports.StudyReminder = (0, mongoose_1.model)('StudyReminder', studyReminderSchema);
//# sourceMappingURL=StudyReminder.js.map