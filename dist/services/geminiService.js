"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// System prompt for reflection prompts (post-session)
const REFLECTION_PROMPT_SYSTEM_INSTRUCTION = `You are a supportive educational coach helping students reflect on their learning sessions with a growth mindset.
Generate thoughtful, encouraging reflection prompts that help students think about their effort, what they learned, and how challenges helped them grow.

Keep prompts:
- Short and engaging (1-2 sentences max)
- Focused on effort, process, and learning from mistakes
- Emphasize growth and development (use "yet" language when appropriate)
- Frame challenges as learning opportunities
- Specific to the session context when provided

Examples of good prompts:
- "What mistake taught you something new today?"
- "How did you grow from a challenge you faced?"
- "What effort did you put in that you're proud of?"
- "What will you work toward next time?"

Return ONLY a JSON array of 2-3 reflection prompts, each as a simple string.`;
// System prompt for motivational nudges
const NUDGE_SYSTEM_INSTRUCTION = `You are a friendly learning coach providing gentle motivational nudges to encourage study habits.
Generate short, encouraging messages (1 sentence) that motivate students to engage with their studies.

Examples:
- "Try setting a goal for tomorrow!"
- "You're doing great! Keep up the momentum."
- "Every small step counts. You've got this!"

Return ONLY a JSON array of 2-3 motivational nudges, each as a simple string.`;
class GeminiService {
    /**
     * Extract JSON array from text, handling markdown code blocks and extra text
     */
    static extractJsonFromText(text) {
        try {
            let jsonText = text.trim();
            // Remove markdown code blocks
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
            }
            else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
            }
            jsonText = jsonText.trim();
            // Find the first valid JSON array in the text
            // Look for opening bracket
            const startIndex = jsonText.indexOf('[');
            if (startIndex === -1) {
                throw new Error('No JSON array found');
            }
            // Find the matching closing bracket
            let bracketCount = 0;
            let inString = false;
            let escapeNext = false;
            for (let i = startIndex; i < jsonText.length; i++) {
                const char = jsonText[i];
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                if (char === '"' && !escapeNext) {
                    inString = !inString;
                    continue;
                }
                if (!inString) {
                    if (char === '[') {
                        bracketCount++;
                    }
                    else if (char === ']') {
                        bracketCount--;
                        if (bracketCount === 0) {
                            // Found the end of the JSON array
                            const jsonArray = jsonText.substring(startIndex, i + 1);
                            const parsed = JSON.parse(jsonArray);
                            if (Array.isArray(parsed)) {
                                return parsed;
                            }
                        }
                    }
                }
            }
            // If we didn't find a complete array, try parsing from startIndex to end
            // But first, try to find where valid JSON ends by attempting to parse incrementally
            for (let endIndex = jsonText.length; endIndex > startIndex; endIndex--) {
                try {
                    const jsonSlice = jsonText.substring(startIndex, endIndex).trim();
                    if (jsonSlice.endsWith(']')) {
                        const parsed = JSON.parse(jsonSlice);
                        if (Array.isArray(parsed)) {
                            return parsed;
                        }
                    }
                }
                catch {
                    // Continue trying shorter slices
                    continue;
                }
            }
            throw new Error('No valid JSON array found');
        }
        catch (error) {
            logger_1.logger.error('JSON extraction error', error, { text: text.substring(0, 100) });
            throw error;
        }
    }
    static initialize() {
        if (!config_1.config.gemini?.apiKey) {
            return false; // Return false instead of throwing
        }
        if (!this.genAI) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.gemini.apiKey);
        }
        if (!this.reflectionModel) {
            // Use gemini-pro as default (stable model) or gemini-1.5-pro-latest for newer features
            const modelName = config_1.config.gemini.model || 'gemini-2.5-flash-lite';
            this.reflectionModel = this.genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: REFLECTION_PROMPT_SYSTEM_INSTRUCTION,
            });
        }
        if (!this.nudgeModel) {
            // Use gemini-pro as default (stable model) or gemini-1.5-pro-latest for newer features
            const modelName = config_1.config.gemini.model || 'gemini-pro';
            this.nudgeModel = this.genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: NUDGE_SYSTEM_INSTRUCTION,
            });
        }
        return true;
    }
    /**
     * Generate reflection prompts for post-session reflection
     * @param sessionContext Optional context about the session (subject, duration, performance)
     */
    static async generateReflectionPrompts(sessionContext) {
        try {
            if (!this.initialize()) {
                return this.getDefaultReflectionPrompts();
            }
            const contextText = sessionContext
                ? `Session context: ${sessionContext.subject ? `Subject: ${sessionContext.subject}. ` : ''}${sessionContext.duration ? `Duration: ${sessionContext.duration} minutes. ` : ''}${sessionContext.quizCompleted ? `Completed a quiz${sessionContext.score ? ` with ${sessionContext.score}% score.` : '.'}` : ''}`
                : 'General learning session.';
            const prompt = `Generate 2-3 reflection prompts for a student who just completed a learning session.

${contextText}

Return ONLY a JSON array of strings, like: ["prompt 1", "prompt 2", "prompt 3"]`;
            const result = await this.reflectionModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Extract JSON from response
            try {
                const prompts = this.extractJsonFromText(text);
                if (Array.isArray(prompts) && prompts.length > 0) {
                    return prompts.slice(0, 3); // Max 3 prompts
                }
            }
            catch (parseError) {
                logger_1.logger.error('Failed to parse reflection prompts JSON', parseError);
            }
            return this.getDefaultReflectionPrompts();
        }
        catch (error) {
            console.error('[GeminiService] Reflection prompt generation error:', error);
            return this.getDefaultReflectionPrompts();
        }
    }
    /**
     * Generate motivational nudges
     * @param userContext Optional context about the user (streak, recent activity)
     */
    static async generateMotivationalNudges(userContext) {
        try {
            if (!this.initialize()) {
                return this.getDefaultNudges();
            }
            const contextText = userContext
                ? `${userContext.currentStreak ? `Current streak: ${userContext.currentStreak} days. ` : ''}${userContext.lastLoginDaysAgo !== undefined ? `Last login: ${userContext.lastLoginDaysAgo} days ago. ` : ''}${userContext.quizzesCompletedThisWeek !== undefined ? `Quizzes completed this week: ${userContext.quizzesCompletedThisWeek}.` : ''}`
                : 'General encouragement needed.';
            const prompt = `Generate 2-3 short motivational nudges to encourage study habits.

${contextText}

Return ONLY a JSON array of strings, like: ["nudge 1", "nudge 2", "nudge 3"]`;
            const result = await this.nudgeModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Extract JSON from response
            try {
                const nudges = this.extractJsonFromText(text);
                if (Array.isArray(nudges) && nudges.length > 0) {
                    return nudges.slice(0, 3); // Max 3 nudges
                }
            }
            catch (parseError) {
                logger_1.logger.error('Failed to parse nudges JSON', parseError);
            }
            return this.getDefaultNudges();
        }
        catch (error) {
            logger_1.logger.error('Nudge generation error', error);
            return this.getDefaultNudges();
        }
    }
    /**
     * Default reflection prompts (fallback when AI is unavailable) - Growth mindset focused
     */
    static getDefaultReflectionPrompts() {
        return [
            "What effort did you put in today that you're proud of?",
            'What mistake or challenge helped you learn something new?',
            "What skill are you working toward mastering? What's your next step?",
        ];
    }
    /**
     * Default motivational nudges (fallback when AI is unavailable) - Growth mindset focused
     */
    static getDefaultNudges() {
        return [
            'Your effort matters! Try setting a goal for tomorrow!',
            "You're making progress - every step counts!",
            'Every study session makes your brain stronger. Keep going!',
        ];
    }
    /**
     * Check if Gemini is configured and available
     */
    static isAvailable() {
        return !!config_1.config.gemini?.apiKey;
    }
}
exports.GeminiService = GeminiService;
GeminiService.genAI = null;
GeminiService.reflectionModel = null;
GeminiService.nudgeModel = null;
exports.default = GeminiService;
//# sourceMappingURL=geminiService.js.map