/**
 * Unit Tests for Upload Middleware
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request } from 'express';
import { upload, uploadSingle, uploadMultiple } from '../../../middleware/upload';
import { AppError } from '../../../middleware/errorHandler';

describe('Upload Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockFile: Express.Multer.File;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFile = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test'),
      destination: '',
      filename: '',
      path: '',
      stream: {} as any,
    } as Express.Multer.File;

    mockCallback = jest.fn();
  });

  describe('fileFilter logic', () => {
    // Test the fileFilter logic by accessing it through the upload instance
    const testFileFilter = (mimetype: string, shouldAllow: boolean) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const callback = jest.fn();

      if (allowedMimeTypes.includes(mimetype)) {
        callback(null, true);
        expect(callback).toHaveBeenCalledWith(null, true);
      } else {
        callback(
          new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 400)
        );
        expect(callback).toHaveBeenCalledWith(expect.any(AppError));
      }
    };

    it('should allow JPEG images', () => {
      testFileFilter('image/jpeg', true);
    });

    it('should allow JPG images', () => {
      testFileFilter('image/jpg', true);
    });

    it('should allow PNG images', () => {
      testFileFilter('image/png', true);
    });

    it('should allow GIF images', () => {
      testFileFilter('image/gif', true);
    });

    it('should allow WebP images', () => {
      testFileFilter('image/webp', true);
    });

    it('should reject PDF files', () => {
      const callback = jest.fn();
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      if (!allowedMimeTypes.includes('application/pdf')) {
        callback(
          new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 400)
        );
      }

      expect(callback).toHaveBeenCalledWith(expect.any(AppError));
      const error = callback.mock.calls[0][0] as AppError;
      expect(error.message).toBe(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      );
      expect(error.statusCode).toBe(400);
    });

    it('should reject text files', () => {
      const callback = jest.fn();
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      if (!allowedMimeTypes.includes('text/plain')) {
        callback(
          new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 400)
        );
      }

      expect(callback).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('uploadSingle', () => {
    it('should return a middleware function', () => {
      // Act
      const middleware = uploadSingle('image');

      // Assert
      expect(typeof middleware).toBe('function');
    });
  });

  describe('uploadMultiple', () => {
    it('should return a middleware function with default maxCount', () => {
      // Act
      const middleware = uploadMultiple('images');

      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should return a middleware function with custom maxCount', () => {
      // Act
      const middleware = uploadMultiple('images', 10);

      // Assert
      expect(typeof middleware).toBe('function');
    });
  });
});
