"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const types_1 = require("../types");
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
const seedData = async () => {
    try {
        console.log('🌱 Starting database seed...');
        // Connect to database
        await database_1.default.connect();
        // Clear existing data
        await models_1.User.deleteMany({});
        await models_1.UserPreferences.deleteMany({});
        await models_1.Badge.deleteMany({});
        await models_1.Quiz.deleteMany({});
        console.log('🗑️ Cleared existing data');
        // Create sample users
        const hashedPassword = await bcryptjs_1.default.hash('Password123!', 12);
        // Admin user
        const admin = await models_1.User.create({
            email: 'admin@behaviorallearning.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: types_1.UserRole.ADMIN,
            isVerified: true,
            subscriptionTier: types_1.SubscriptionTier.PREMIUM
        });
        // Student user
        const student = await models_1.User.create({
            email: 'student@example.com',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Student',
            role: types_1.UserRole.STUDENT,
            dateOfBirth: new Date('2008-05-15'),
            academicGoals: ['Mathematics', 'Science'],
            isVerified: true,
            subscriptionTier: types_1.SubscriptionTier.BASIC,
            streakCount: 5,
            totalPoints: 150
        });
        // Tutor user
        const tutor = await models_1.User.create({
            email: 'tutor@example.com',
            password: hashedPassword,
            firstName: 'Jane',
            lastName: 'Tutor',
            role: types_1.UserRole.TUTOR,
            subjects: ['Mathematics', 'Physics', 'Chemistry'],
            hourlyRate: 25.00,
            bio: 'Experienced mathematics and science tutor with 5+ years of experience.',
            qualifications: ['MSc Mathematics', 'PGCE', 'DBS Checked'],
            rating: 4.8,
            totalSessions: 150,
            isVerified: true,
            isBackgroundChecked: true,
            subscriptionTier: types_1.SubscriptionTier.PREMIUM
        });
        // Parent user
        const parent = await models_1.User.create({
            email: 'parent@example.com',
            password: hashedPassword,
            firstName: 'Mary',
            lastName: 'Parent',
            role: types_1.UserRole.PARENT,
            isVerified: true,
            subscriptionTier: types_1.SubscriptionTier.BASIC
        });
        console.log('👥 Created sample users');
        // Create user preferences for all users
        const users = [admin, student, tutor, parent];
        for (const user of users) {
            await models_1.UserPreferences.create({
                userId: user._id,
                studyReminders: true,
                darkMode: false,
                language: 'en',
                timezone: 'Europe/London',
                emailNotifications: true,
                pushNotifications: true,
                sessionReminders: true,
                progressReports: true
            });
        }
        console.log('⚙️ Created user preferences');
        // Create sample badges
        const badges = [
            {
                type: types_1.BadgeType.STREAK,
                name: 'First Steps',
                description: 'Complete your first login',
                icon: '🌟',
                requirement: 1,
                points: 10
            },
            {
                type: types_1.BadgeType.STREAK,
                name: 'Week Warrior',
                description: 'Maintain a 7-day learning streak',
                icon: '🔥',
                requirement: 7,
                points: 50
            },
            {
                type: types_1.BadgeType.STREAK,
                name: 'Month Master',
                description: 'Maintain a 30-day learning streak',
                icon: '💪',
                requirement: 30,
                points: 200
            },
            {
                type: types_1.BadgeType.COMPLETION,
                name: 'Quiz Novice',
                description: 'Complete your first quiz',
                icon: '📝',
                requirement: 1,
                points: 15
            },
            {
                type: types_1.BadgeType.COMPLETION,
                name: 'Quiz Master',
                description: 'Complete 10 quizzes',
                icon: '🎓',
                requirement: 10,
                points: 100
            },
            {
                type: types_1.BadgeType.ACHIEVEMENT,
                name: 'Perfect Score',
                description: 'Get 100% on any quiz',
                icon: '⭐',
                requirement: 1,
                points: 75
            },
            {
                type: types_1.BadgeType.MILESTONE,
                name: 'Study Warrior',
                description: 'Complete 50 study sessions',
                icon: '⚔️',
                requirement: 50,
                points: 150
            },
            {
                type: types_1.BadgeType.MILESTONE,
                name: 'Social Learner',
                description: 'Chat with 5 different tutors',
                icon: '💬',
                requirement: 5,
                points: 80
            }
        ];
        await models_1.Badge.insertMany(badges);
        console.log('🏆 Created sample badges');
        // Create sample quizzes
        const quizzes = [
            {
                title: 'Basic Algebra',
                subject: 'Mathematics',
                description: 'Test your understanding of basic algebraic concepts',
                timeLimit: 30,
                passingScore: 70,
                points: 25,
                questions: [
                    {
                        type: 'multiple_choice',
                        question: 'What is the value of x in the equation: 2x + 5 = 15?',
                        options: ['3', '5', '7', '10'],
                        correctAnswer: '5',
                        explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5',
                        points: 5,
                        order: 1
                    },
                    {
                        type: 'multiple_choice',
                        question: 'Simplify: 3x + 2x',
                        options: ['5x', '6x', '5x²', '6x²'],
                        correctAnswer: '5x',
                        explanation: 'Combine like terms: 3x + 2x = 5x',
                        points: 3,
                        order: 2
                    },
                    {
                        type: 'true_false',
                        question: 'The equation y = 2x + 3 represents a linear function.',
                        options: ['True', 'False'],
                        correctAnswer: 'True',
                        explanation: 'Linear functions have the form y = mx + b, where m and b are constants',
                        points: 2,
                        order: 3
                    }
                ]
            },
            {
                title: 'Introduction to Physics',
                subject: 'Physics',
                description: 'Basic concepts in physics including motion and forces',
                timeLimit: 45,
                passingScore: 65,
                points: 30,
                questions: [
                    {
                        type: 'multiple_choice',
                        question: 'What is the unit of force in the SI system?',
                        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
                        correctAnswer: 'Newton',
                        explanation: 'The Newton (N) is the SI unit of force, defined as kg⋅m/s²',
                        points: 4,
                        order: 1
                    },
                    {
                        type: 'multiple_choice',
                        question: 'What is the acceleration due to gravity on Earth?',
                        options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'],
                        correctAnswer: '9.8 m/s²',
                        explanation: 'The standard acceleration due to gravity is approximately 9.8 m/s²',
                        points: 3,
                        order: 2
                    }
                ]
            },
            {
                title: 'English Grammar Basics',
                subject: 'English',
                description: 'Test your knowledge of basic English grammar rules',
                timeLimit: 25,
                passingScore: 75,
                points: 20,
                questions: [
                    {
                        type: 'multiple_choice',
                        question: 'Which sentence is grammatically correct?',
                        options: [
                            'Me and John went to the store',
                            'John and I went to the store',
                            'John and me went to the store',
                            'I and John went to the store'
                        ],
                        correctAnswer: 'John and I went to the store',
                        explanation: 'Use "I" as the subject of the sentence, and put the other person first',
                        points: 5,
                        order: 1
                    }
                ]
            }
        ];
        await models_1.Quiz.insertMany(quizzes);
        console.log('📚 Created sample quizzes');
        console.log('✅ Database seeded successfully!');
        console.log('\n📧 Sample user credentials:');
        console.log('Admin: admin@behaviorallearning.com / Password123!');
        console.log('Student: student@example.com / Password123!');
        console.log('Tutor: tutor@example.com / Password123!');
        console.log('Parent: parent@example.com / Password123!');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('📴 Database connection closed');
    }
};
// Run the seed function
seedData();
//# sourceMappingURL=seed.js.map