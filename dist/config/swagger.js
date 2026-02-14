"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const index_1 = __importDefault(require("./index"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Behavioral Learning Platform API',
        version: '1.0.0',
        description: 'API documentation for the Behavioral Learning Platform - A comprehensive system for tracking student behavior, learning progress, and providing AI-powered educational support.',
        contact: {
            name: 'API Support',
            email: 'support@behaviorallearning.com',
        },
        license: {
            name: 'ISC',
        },
    },
    servers: [
        {
            url: `http://localhost:${index_1.default.port}`,
            description: 'Development server',
        },
        {
            url: 'https://api.behaviorallearning.com',
            description: 'Production server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT token obtained from login endpoint',
            },
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'refreshToken',
                description: 'Refresh token stored in HTTP-only cookie',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false,
                    },
                    message: {
                        type: 'string',
                        example: 'Error message description',
                    },
                    error: {
                        type: 'string',
                        example: 'Detailed error information',
                    },
                },
            },
            Success: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true,
                    },
                    message: {
                        type: 'string',
                        example: 'Operation successful',
                    },
                    data: {
                        type: 'object',
                        description: 'Response data',
                    },
                },
            },
            User: {
                type: 'object',
                properties: {
                    _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'user@example.com',
                    },
                    firstName: {
                        type: 'string',
                        example: 'John',
                    },
                    lastName: {
                        type: 'string',
                        example: 'Doe',
                    },
                    role: {
                        type: 'string',
                        enum: ['student', 'tutor', 'admin', 'parent'],
                        example: 'student',
                    },
                    isEmailVerified: {
                        type: 'boolean',
                        example: true,
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                    },
                },
            },
        },
    },
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and authorization endpoints',
        },
        {
            name: 'Users',
            description: 'User management endpoints',
        },
        {
            name: 'Sessions',
            description: 'Tutoring session management',
        },
        {
            name: 'Chat',
            description: 'Real-time chat functionality',
        },
        {
            name: 'Gamification',
            description: 'Quizzes, badges, and progress tracking',
        },
        {
            name: 'Behavioral',
            description: 'Behavioral data tracking and analysis',
        },
        {
            name: 'Goals',
            description: 'Student goal management',
        },
        {
            name: 'Commitments',
            description: 'Weekly commitment tracking',
        },
        {
            name: 'Reflections',
            description: 'Student reflection entries',
        },
        {
            name: 'Assessments',
            description: 'Weekly assessment management',
        },
        {
            name: 'Habits',
            description: 'Habit tracking',
        },
        {
            name: 'Milestones',
            description: 'Milestone management',
        },
        {
            name: 'Notifications',
            description: 'Notification management',
        },
        {
            name: 'Preferences',
            description: 'User preferences management',
        },
        {
            name: 'Tutor',
            description: 'Tutor-specific endpoints',
        },
        {
            name: 'Admin',
            description: 'Admin-specific endpoints',
        },
        {
            name: 'Parent Reports',
            description: 'Parent report generation and management',
        },
    ],
};
const options = {
    definition: swaggerDefinition,
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API files
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map