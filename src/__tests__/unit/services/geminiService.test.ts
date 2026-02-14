/**
 * Unit Tests for GeminiService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GeminiService } from '../../../services/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');
jest.mock('../../../config', () => ({
  config: {
    gemini: {
      apiKey: 'test-api-key',
      model: 'gemini-pro',
    },
  },
}));

describe('GeminiService', () => {
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModel = {
      // @ts-expect-error - Mock type inference issue
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(['Prompt 1', 'Prompt 2', 'Prompt 3']),
        },
      }),
    };

    (GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    }));
  });

  describe('generateReflectionPrompts', () => {
    it('should generate reflection prompts', async () => {
      // Act
      const result = await GeminiService.generateReflectionPrompts();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should generate reflection prompts with session context', async () => {
      // Arrange
      const sessionContext = {
        subject: 'Math',
        duration: 60,
        quizCompleted: true,
        score: 85,
      };

      // Act
      const result = await GeminiService.generateReflectionPrompts(sessionContext);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('generateMotivationalNudges', () => {
    it('should generate motivational nudges', async () => {
      // Act
      const result = await GeminiService.generateMotivationalNudges();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

