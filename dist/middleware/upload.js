"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const errorHandler_1 = require("./errorHandler");
// Configure multer for memory storage (we'll upload to Cloudinary from memory)
const storage = multer_1.default.memoryStorage();
// File filter to only allow images
const fileFilter = (req, file, cb) => {
    // Allowed mime types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 400));
    }
};
// Create multer upload instance
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max file size
    }
});
// Middleware to handle single file upload
const uploadSingle = (fieldName) => {
    return exports.upload.single(fieldName);
};
exports.uploadSingle = uploadSingle;
// Middleware to handle multiple file uploads
const uploadMultiple = (fieldName, maxCount = 5) => {
    return exports.upload.array(fieldName, maxCount);
};
exports.uploadMultiple = uploadMultiple;
//# sourceMappingURL=upload.js.map