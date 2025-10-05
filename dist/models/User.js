"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    role: {
        type: String,
        enum: Object.values(types_1.UserRole),
        required: true,
        index: true
    },
    dateOfBirth: {
        type: Date
    },
    profileImage: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    subscriptionTier: {
        type: String,
        enum: Object.values(types_1.SubscriptionTier),
        default: types_1.SubscriptionTier.BASIC,
        index: true
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Student specific fields
    academicGoals: {
        type: [String],
        default: []
    },
    streakCount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    lastLoginAt: {
        type: Date
    },
    // Tutor specific fields
    subjects: {
        type: [String],
        default: []
    },
    hourlyRate: {
        type: Number,
        min: 0
    },
    bio: {
        type: String,
        maxlength: 1000
    },
    qualifications: {
        type: [String],
        default: []
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalSessions: {
        type: Number,
        default: 0,
        min: 0
    },
    isBackgroundChecked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            const { password, ...rest } = ret;
            return rest;
        }
    }
});
// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ subjects: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ createdAt: -1 });
// Virtual for children (for parents)
userSchema.virtual('children', {
    ref: 'User',
    localField: '_id',
    foreignField: 'parentId'
});
// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
// Instance method to check if user is a minor
userSchema.methods.isMinor = function () {
    if (!this.dateOfBirth)
        return false;
    const age = Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age < 18;
};
// Static method to find tutors by subject
userSchema.statics.findTutorsBySubject = function (subject) {
    return this.find({
        role: types_1.UserRole.TUTOR,
        subjects: subject,
        isVerified: true,
        isBackgroundChecked: true
    }).sort({ rating: -1 });
};
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map