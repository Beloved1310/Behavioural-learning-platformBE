"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFutureDate = exports.generateExpiredDate = exports.generateValidToken = exports.createMockUser = exports.invalidUserData = exports.validParentData = exports.validTutorData = exports.validUserData = void 0;
const types_1 = require("../../types");
exports.validUserData = {
    email: 'test@example.com',
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Doe',
    role: types_1.UserRole.STUDENT,
    dateOfBirth: '2009-01-15', // 15-16 years old
    parentEmail: 'parent@example.com',
};
exports.validTutorData = {
    email: 'tutor@example.com',
    password: 'TutorPass123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: types_1.UserRole.TUTOR,
};
exports.validParentData = {
    email: 'parent@example.com',
    password: 'ParentPass123!',
    firstName: 'Bob',
    lastName: 'Johnson',
    role: types_1.UserRole.PARENT,
};
exports.invalidUserData = {
    email: 'invalid-email',
    password: 'short',
    firstName: '',
    lastName: '',
    role: 'INVALID',
};
const createMockUser = (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: types_1.UserRole.STUDENT,
    isVerified: false,
    subscriptionTier: 'BASIC',
    academicGoals: [],
    streakCount: 0,
    totalPoints: 0,
    subjects: [],
    qualifications: [],
    rating: 0,
    totalSessions: 0,
    isBackgroundChecked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createMockUser = createMockUser;
const generateValidToken = () => {
    return 'a'.repeat(64); // 64 character hex string
};
exports.generateValidToken = generateValidToken;
const generateExpiredDate = () => {
    return new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
};
exports.generateExpiredDate = generateExpiredDate;
const generateFutureDate = () => {
    return new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
};
exports.generateFutureDate = generateFutureDate;
//# sourceMappingURL=testData.js.map