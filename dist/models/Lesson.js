"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = exports.LessonType = void 0;
const mongoose_1 = require("mongoose");
var LessonType;
(function (LessonType) {
    LessonType["VIDEO"] = "video";
    LessonType["TEXT"] = "text";
})(LessonType || (exports.LessonType = LessonType = {}));
const lessonSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        index: true
    },
    subject: {
        type: String,
        required: true,
        index: true
    },
    topic: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(LessonType),
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    content: {
        videoUrl: {
            type: String,
            validate: {
                validator: function (v) {
                    if (this.type === LessonType.VIDEO) {
                        return v && (v.includes('youtube.com') || v.includes('youtu.be') || v.includes('vimeo.com'));
                    }
                    return true;
                },
                message: 'Video URL must be from YouTube or Vimeo'
            }
        },
        videoPlatform: {
            type: String,
            enum: ['youtube', 'vimeo']
        },
        textContent: {
            type: String,
            maxlength: 10000
        }
    },
    estimatedDuration: {
        type: Number,
        required: true,
        min: 1,
        max: 300
    },
    order: {
        type: Number,
        required: true,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});
// Indexes for efficient queries
lessonSchema.index({ subject: 1, topic: 1, isActive: 1 });
lessonSchema.index({ subject: 1, isActive: 1 });
lessonSchema.index({ isActive: 1, createdAt: -1 });
// Validation: Ensure content matches type
lessonSchema.pre('validate', function (next) {
    if (this.type === LessonType.VIDEO) {
        if (!this.content.videoUrl) {
            this.invalidate('content.videoUrl', 'Video URL is required for video lessons');
        }
        if (!this.content.videoPlatform) {
            this.invalidate('content.videoPlatform', 'Video platform is required for video lessons');
        }
    }
    else if (this.type === LessonType.TEXT) {
        if (!this.content.textContent) {
            this.invalidate('content.textContent', 'Text content is required for text lessons');
        }
    }
    next();
});
exports.Lesson = (0, mongoose_1.model)('Lesson', lessonSchema);
//# sourceMappingURL=Lesson.js.map