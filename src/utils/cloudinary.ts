import cloudinary from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import streamifier from 'streamifier';

/**
 * Upload image buffer to Cloudinary
 * @param buffer - Image buffer from multer
 * @param folder - Cloudinary folder to upload to
 * @param publicId - Optional public ID for the image
 * @returns Cloudinary upload result with secure_url
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = 'profile-images',
  publicId?: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(new AppError('Failed to upload image to cloud storage', 500));
        } else {
          resolve({
            secure_url: result!.secure_url,
            public_id: result!.public_id
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error);
    // Don't throw error - deletion failure shouldn't block operations
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID or null
 */
export const extractPublicId = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
    const regex = /\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};
