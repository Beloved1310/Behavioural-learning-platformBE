"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const errorHandler_1 = require("../middleware/errorHandler");
const streamifier_1 = __importDefault(require("streamifier"));
/**
 * Upload image buffer to Cloudinary
 * @param buffer - Image buffer from multer
 * @param folder - Cloudinary folder to upload to
 * @param publicId - Optional public ID for the image
 * @returns Cloudinary upload result with secure_url
 */
const uploadToCloudinary = (buffer, folder = 'profile-images', publicId) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder,
            public_id: publicId,
            resource_type: 'image',
            transformation: [
                { width: 500, height: 500, crop: 'fill', gravity: 'face' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        }, (error, result) => {
            if (error) {
                reject(new errorHandler_1.AppError('Failed to upload image to cloud storage', 500));
            }
            else {
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id
                });
            }
        });
        streamifier_1.default.createReadStream(buffer).pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
        // Don't throw error - deletion failure shouldn't block operations
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID or null
 */
const extractPublicId = (url) => {
    try {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
        const regex = /\/(?:v\d+\/)?(.+)\.\w+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
    catch (error) {
        return null;
    }
};
exports.extractPublicId = extractPublicId;
//# sourceMappingURL=cloudinary.js.map