/**
 * Upload image buffer to Cloudinary
 * @param buffer - Image buffer from multer
 * @param folder - Cloudinary folder to upload to
 * @param publicId - Optional public ID for the image
 * @returns Cloudinary upload result with secure_url
 */
export declare const uploadToCloudinary: (buffer: Buffer, folder?: string, publicId?: string) => Promise<{
    secure_url: string;
    public_id: string;
}>;
/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Deletion result
 */
export declare const deleteFromCloudinary: (publicId: string) => Promise<void>;
/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID or null
 */
export declare const extractPublicId: (url: string) => string | null;
//# sourceMappingURL=cloudinary.d.ts.map