"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const Goal_1 = require("../models/Goal");
const WeeklyCommitment_1 = require("../models/WeeklyCommitment");
const ReflectionEntry_1 = require("../models/ReflectionEntry");
const WeeklyAssessment_1 = require("../models/WeeklyAssessment");
const User_1 = require("../models/User");
const CustomEvent_1 = require("../models/CustomEvent");
/**
 * Seed script for dashboard data
 * Run with: npx ts-node backend/src/scripts/seedDashboardData.ts
 */
const getWeekStart = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};
const getWeekEnd = (date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
};
async function seedDashboardData() {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(config_1.default.database.url);
        console.log('✅ Connected to MongoDB');
        // Find a student user
        const student = await User_1.User.findOne({ role: 'STUDENT' });
        if (!student) {
            console.log('❌ No student found. Please create a student user first.');
            process.exit(1);
        }
        console.log(`📚 Seeding data for student: ${student.email}`);
        // 1. Seed Goals
        const existingGoals = await Goal_1.Goal.find({ userId: student._id });
        if (existingGoals.length === 0) {
            const goals = await Goal_1.Goal.insertMany([
                {
                    userId: student._id,
                    title: 'Complete 50 Quizzes',
                    description: 'Aim to complete 50 quizzes this semester',
                    target: 50,
                    current: 12,
                    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                    milestones: [25, 50, 75, 100],
                    achievedMilestones: [25],
                    isActive: true,
                },
                {
                    userId: student._id,
                    title: 'Study 30 Hours',
                    description: 'Accumulate 30 hours of study time',
                    target: 30,
                    current: 8,
                    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                    milestones: [25, 50, 75, 100],
                    achievedMilestones: [],
                    isActive: true,
                },
                {
                    userId: student._id,
                    title: 'Maintain 7-Day Streak',
                    description: 'Log in and study for 7 consecutive days',
                    target: 7,
                    current: 3,
                    milestones: [50, 100],
                    achievedMilestones: [],
                    isActive: true,
                },
            ]);
            console.log(`✅ Created ${goals.length} goals`);
        }
        else {
            console.log(`ℹ️  ${existingGoals.length} goals already exist`);
        }
        // 2. Seed Weekly Commitments
        const now = new Date();
        const weekStart = getWeekStart(now);
        const weekEnd = getWeekEnd(now);
        const existingCommitment = await WeeklyCommitment_1.WeeklyCommitment.findOne({
            userId: student._id,
            weekStart: { $gte: weekStart, $lte: weekEnd },
        });
        if (!existingCommitment) {
            const commitment = await WeeklyCommitment_1.WeeklyCommitment.create({
                userId: student._id,
                weekStart,
                weekEnd,
                commitments: [
                    {
                        text: 'Study 30 minutes daily',
                        type: 'time',
                        target: 30,
                        completed: false,
                    },
                    {
                        text: 'Complete 3 quizzes',
                        type: 'quizzes',
                        target: 3,
                        completed: true,
                        completedAt: new Date(),
                    },
                    {
                        text: 'Attend 2 tutoring sessions',
                        type: 'sessions',
                        target: 2,
                        completed: false,
                    },
                ],
            });
            console.log(`✅ Created weekly commitment for week of ${weekStart.toLocaleDateString()}`);
        }
        else {
            console.log(`ℹ️  Weekly commitment already exists for this week`);
        }
        // 3. Seed Reflection Entries
        const existingReflections = await ReflectionEntry_1.ReflectionEntry.find({ userId: student._id });
        if (existingReflections.length === 0) {
            const prompts = [
                'What went well today?',
                'What challenged you today?',
                'What did you learn today?',
                'How do you feel about your progress?',
                'What will you focus on tomorrow?',
            ];
            const reflections = [];
            for (let i = 0; i < 5; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                reflections.push({
                    userId: student._id,
                    date,
                    prompt: prompts[i % prompts.length],
                    response: `This is a sample reflection entry for day ${i + 1}. I'm making good progress and feeling motivated!`,
                    type: 'daily',
                    mood: ['happy', 'motivated', 'tired', 'excited', 'focused'][i],
                });
            }
            await ReflectionEntry_1.ReflectionEntry.insertMany(reflections);
            console.log(`✅ Created ${reflections.length} reflection entries`);
        }
        else {
            console.log(`ℹ️  ${existingReflections.length} reflection entries already exist`);
        }
        // 4. Seed Weekly Assessment
        const existingAssessment = await WeeklyAssessment_1.WeeklyAssessment.findOne({
            userId: student._id,
            weekStart: weekStart,
        });
        if (!existingAssessment) {
            await WeeklyAssessment_1.WeeklyAssessment.create({
                userId: student._id,
                weekStart,
                weekRating: 4,
                whatWentWell: 'I completed all my quizzes and maintained my study streak!',
                challenges: 'I found some math problems difficult, but I kept trying.',
                nextWeekFocus: 'I want to improve my math skills and complete more quizzes.',
                commitmentLevel: 5,
                completedAt: new Date(),
            });
            console.log(`✅ Created weekly assessment for week of ${weekStart.toLocaleDateString()}`);
        }
        else {
            console.log(`ℹ️  Weekly assessment already exists for this week`);
        }
        // 5. Seed Custom Events for Heatmap
        const existingEvents = await CustomEvent_1.CustomEvent.find({ userId: student._id });
        if (existingEvents.length < 30) {
            const events = [];
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                // Create 1-3 events per day
                const eventCount = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < eventCount; j++) {
                    const eventTypes = ['session_start', 'quiz_complete', 'login'];
                    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                    const timestamp = new Date(date);
                    timestamp.setHours(Math.floor(Math.random() * 12) + 8); // Between 8 AM and 8 PM
                    timestamp.setMinutes(Math.floor(Math.random() * 60));
                    events.push({
                        userId: student._id,
                        eventType,
                        timestamp,
                        metadata: {
                            page: '/dashboard',
                            sessionType: eventType === 'session_start' ? 'study' : undefined,
                        },
                    });
                }
            }
            await CustomEvent_1.CustomEvent.insertMany(events);
            console.log(`✅ Created ${events.length} custom events for heatmap`);
        }
        else {
            console.log(`ℹ️  ${existingEvents.length} custom events already exist`);
        }
        console.log('\n✅ Dashboard data seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding dashboard data:', error);
        process.exit(1);
    }
}
// Run the seed function
seedDashboardData();
//# sourceMappingURL=seedDashboardData.js.map