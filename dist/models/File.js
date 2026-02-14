"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const mongoose_1 = require("mongoose");
const fileSchema = new mongoose_1.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true,
        min: 0
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// Indexes for efficient queries
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ mimeType: 1 });
fileSchema.index({ createdAt: -1 });
// Virtual to populate uploader details
fileSchema.virtual('uploader', {
    ref: 'User',
    localField: 'uploadedBy',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email role'
});
// Virtual for file size in human readable format
fileSchema.virtual('humanSize').get(function () {
    const bytes = this.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});
// Instance method to check if file is an image
fileSchema.methods.isImage = function () {
    return this.mimeType.startsWith('image/');
};
// Instance method to check if file is a document
fileSchema.methods.isDocument = function () {
    const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    return documentTypes.includes(this.mimeType);
};
// Static method to get user's files
fileSchema.statics.getUserFiles = function (userId, page = 1, limit = 20, mimeType) {
    const query = { uploadedBy: userId };
    if (mimeType) {
        query.mimeType = new RegExp(mimeType, 'i');
    }
    const skip = (page - 1) * limit;
    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};
// Static method to get file statistics
fileSchema.statics.getFileStats = function (userId) {
    const matchQuery = userId ? { uploadedBy: new mongoose_1.Schema.Types.ObjectId(userId) } : {};
    return this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalFiles: { $sum: 1 },
                totalSize: { $sum: '$size' },
                imageCount: {
                    $sum: {
                        $cond: [{ $regexMatch: { input: '$mimeType', regex: /^image\// } }, 1, 0]
                    }
                },
                documentCount: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$mimeType',
                                    [
                                        'application/pdf',
                                        'application/msword',
                                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                        'text/plain'
                                    ]
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
};
// Static method to cleanup old files (for maintenance)
fileSchema.statics.cleanupOldFiles = function (daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.find({
        createdAt: { $lt: cutoffDate }
    });
};
exports.File = (0, mongoose_1.model)('File', fileSchema);
//# sourceMappingURL=File.js.map