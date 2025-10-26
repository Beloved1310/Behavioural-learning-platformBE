import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Configure multer for memory storage (we'll upload to Cloudinary from memory)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed mime types
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 400));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  }
});

// Middleware to handle single file upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

// Middleware to handle multiple file uploads
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};
