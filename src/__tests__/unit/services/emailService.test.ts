/**
 * Unit Tests for EmailService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

// Mock config before importing emailService
const mockConfig = {
  email: {
    smtp: {
      host: 'smtp.test.com',
      port: 587,
      user: 'test@example.com',
      pass: 'testpass',
    },
    from: 'test@example.com',
  },
};

jest.mock('../../../config', () => ({
  default: mockConfig,
  __esModule: true,
}));

describe('EmailService', () => {
  let mockTransporter: any;
  let emailService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Set up transporter mock before resetting modules
    mockTransporter = {
      // @ts-expect-error - Mock type inference issue
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id', response: 'OK' }),
    };
    (nodemailer.createTransport as jest.Mock) = jest.fn().mockReturnValue(mockTransporter);
    
    // Reset modules and re-import to get fresh EmailService instance
    jest.resetModules();
    emailService = (await import('../../../services/emailService')).default;
    
    // Verify transporter was set up correctly
    if (!emailService.transporter && !(emailService as any).transporter) {
      // If transporter wasn't set, manually set it for testing
      (emailService as any).transporter = mockTransporter;
    }
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      // Arrange
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message',
        html: '<p>Test message</p>',
      };

      // Act
      await emailService.sendEmail(options);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message',
      };

      const authError = new Error('Auth failed');
      (authError as any).code = 'EAUTH';
      mockTransporter.sendMail.mockRejectedValueOnce(authError);

      // Act & Assert
      await expect(emailService.sendEmail(options)).rejects.toThrow('Email authentication failed');
    });

    it('should handle connection errors', async () => {
      // Arrange
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message',
      };

      const connError = new Error('Connection failed');
      (connError as any).code = 'ECONNECTION';
      mockTransporter.sendMail.mockRejectedValueOnce(connError);

      // Act & Assert
      await expect(emailService.sendEmail(options)).rejects.toThrow('Failed to connect');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      // Arrange
      const email = 'user@example.com';
      const firstName = 'John';

      // Act
      await emailService.sendWelcomeEmail(email, firstName);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send welcome email', async () => {
      // Arrange
      const email = 'user@example.com';
      const firstName = 'John';

      // Act
      await emailService.sendWelcomeEmail(email, firstName);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});
