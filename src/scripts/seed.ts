import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, SubscriptionTier, BadgeType, BadgeCategory, BadgeRarity } from '../types';
import database from '../config/database';
import { User, UserPreferences, Badge, Quiz } from '../models';


const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to database
    await database.connect();


    // Create sample users
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    // Admin user
    const admin = await User.create({
      email: 'admin@behaviorallearning.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isVerified: true,
      subscriptionTier: SubscriptionTier.PREMIUM,
    });

    // Student user
    const student = await User.create({
      email: 'student@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Student',
      role: UserRole.STUDENT,
      dateOfBirth: new Date('2008-05-15'),
      academicGoals: ['Mathematics', 'Science'],
      isVerified: true,
      subscriptionTier: SubscriptionTier.BASIC,
      streakCount: 5,
      totalPoints: 150,
    });

    // Tutor user
    const tutor = await User.create({
      email: 'tutor@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Tutor',
      role: UserRole.TUTOR,
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      hourlyRate: 25.0,
      bio: 'Experienced mathematics and science tutor with 5+ years of experience.',
      qualifications: ['MSc Mathematics', 'PGCE', 'DBS Checked'],
      rating: 4.8,
      totalSessions: 150,
      isVerified: true,
      isBackgroundChecked: true,
      subscriptionTier: SubscriptionTier.PREMIUM,
    });

    // Parent user
    const parent = await User.create({
      email: 'parent@example.com',
      password: hashedPassword,
      firstName: 'Mary',
      lastName: 'Parent',
      role: UserRole.PARENT,
      isVerified: true,
      subscriptionTier: SubscriptionTier.BASIC,
    });

    console.log('👥 Created sample users');

    // Create user preferences for all users
    const users = [admin, student, tutor, parent];
    for (const user of users) {
      await UserPreferences.create({
        userId: user._id,
        studyReminders: true,
        language: 'en',
        timezone: 'Europe/London',
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        progressReports: true,
      });
    }

    console.log('⚙️ Created user preferences');

    // Create sample badges
    const badges = [
      {
        type: BadgeType.STREAK,
        name: 'First Steps',
        description: 'Complete your first login',
        icon: '🌟',
        category: BadgeCategory.STREAK,
        rarity: BadgeRarity.COMMON,
        criteria: {
          type: 'streak',
          threshold: 1,
        },
        requirement: 1,
        pointsReward: 10,
      },
      {
        type: BadgeType.STREAK,
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: BadgeCategory.STREAK,
        rarity: BadgeRarity.RARE,
        criteria: {
          type: 'streak',
          threshold: 7,
        },
        requirement: 7,
        pointsReward: 50,
      },
      {
        type: BadgeType.STREAK,
        name: 'Month Master',
        description: 'Maintain a 30-day learning streak',
        icon: '💪',
        category: BadgeCategory.STREAK,
        rarity: BadgeRarity.EPIC,
        criteria: {
          type: 'streak',
          threshold: 30,
        },
        requirement: 30,
        pointsReward: 200,
      },
      {
        type: BadgeType.COMPLETION,
        name: 'Quiz Novice',
        description: 'Complete your first quiz',
        icon: '📝',
        category: BadgeCategory.QUIZ,
        rarity: BadgeRarity.COMMON,
        criteria: {
          type: 'quiz_count',
          threshold: 1,
        },
        requirement: 1,
        pointsReward: 15,
      },
      {
        type: BadgeType.COMPLETION,
        name: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '🎓',
        category: BadgeCategory.QUIZ,
        rarity: BadgeRarity.RARE,
        criteria: {
          type: 'quiz_count',
          threshold: 10,
        },
        requirement: 10,
        pointsReward: 100,
      },
      {
        type: BadgeType.ACHIEVEMENT,
        name: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: '⭐',
        category: BadgeCategory.QUIZ,
        rarity: BadgeRarity.EPIC,
        criteria: {
          type: 'perfect_score',
          threshold: 100,
        },
        requirement: 1,
        pointsReward: 75,
      },
      {
        type: BadgeType.MILESTONE,
        name: 'Study Warrior',
        description: 'Complete 50 study sessions',
        icon: '⚔️',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: BadgeRarity.LEGENDARY,
        criteria: {
          type: 'points',
          threshold: 1000,
        },
        requirement: 50,
        pointsReward: 150,
      },
      {
        type: BadgeType.MILESTONE,
        name: 'Social Learner',
        description: 'Chat with 5 different tutors',
        icon: '💬',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: BadgeRarity.RARE,
        criteria: {
          type: 'points',
          threshold: 500,
        },
        requirement: 5,
        pointsReward: 80,
      },
    ];

    await Badge.insertMany(badges);
    console.log('🏆 Created sample badges');

    // Create Math quizzes (10-15 quizzes across 3-5 topics)
    const mathQuizzes = [
      // Algebra Quizzes (4 quizzes)
      {
        title: 'Basic Algebra: Solving Linear Equations',
        subject: 'Math',
        description: 'Test your understanding of solving simple linear equations',
        difficulty: 'easy',
        timeLimit: 20,
        passingScore: 70,
        points: 20,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the value of x in the equation: 2x + 5 = 15?',
            options: ['3', '5', '7', '10'],
            correctAnswer: '5',
            explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5',
            points: 5,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'Simplify: 3x + 2x',
            options: ['5x', '6x', '5x²', '6x²'],
            correctAnswer: '5x',
            explanation: 'Combine like terms: 3x + 2x = 5x',
            points: 3,
            order: 2,
          },
          {
            type: 'multiple_choice',
            question: 'Solve for x: 4x - 8 = 12',
            options: ['x = 1', 'x = 3', 'x = 5', 'x = 6'],
            correctAnswer: 'x = 5',
            explanation: 'Add 8 to both sides: 4x = 20, then divide by 4: x = 5',
            points: 4,
            order: 3,
          },
        ],
      },
      {
        title: 'Algebra: Factoring Polynomials',
        subject: 'Math',
        description: 'Practice factoring quadratic expressions',
        difficulty: 'medium',
        timeLimit: 25,
        passingScore: 65,
        points: 25,
        questions: [
          {
            type: 'multiple_choice',
            question: 'Factor: x² + 5x + 6',
            options: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x + 2)(x + 4)', '(x - 2)(x - 3)'],
            correctAnswer: '(x + 2)(x + 3)',
            explanation: 'Find two numbers that multiply to 6 and add to 5: 2 and 3',
            points: 5,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'Factor: x² - 9',
            options: ['(x - 3)(x - 3)', '(x + 3)(x - 3)', '(x + 9)(x - 1)', '(x - 9)(x + 1)'],
            correctAnswer: '(x + 3)(x - 3)',
            explanation: 'This is a difference of squares: x² - 9 = (x + 3)(x - 3)',
            points: 5,
            order: 2,
          },
        ],
      },
      {
        title: 'Algebra: Systems of Equations',
        subject: 'Math',
        description: 'Solve systems of linear equations',
        difficulty: 'medium',
        timeLimit: 30,
        passingScore: 70,
        points: 30,
        questions: [
          {
            type: 'multiple_choice',
            question: 'Solve the system: x + y = 5, x - y = 1',
            options: ['x = 3, y = 2', 'x = 2, y = 3', 'x = 4, y = 1', 'x = 1, y = 4'],
            correctAnswer: 'x = 3, y = 2',
            explanation: 'Add the equations: 2x = 6, so x = 3. Substitute: 3 + y = 5, so y = 2',
            points: 6,
            order: 1,
          },
        ],
      },
      {
        title: 'Algebra: Quadratic Equations',
        subject: 'Math',
        description: 'Solve quadratic equations using various methods',
        difficulty: 'hard',
        timeLimit: 35,
        passingScore: 60,
        points: 35,
        questions: [
          {
            type: 'multiple_choice',
            question: 'Solve: x² - 5x + 6 = 0',
            options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = -1, x = -6'],
            correctAnswer: 'x = 2, x = 3',
            explanation: 'Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3',
            points: 7,
            order: 1,
          },
        ],
      },
      // Geometry Quizzes (3 quizzes)
      {
        title: 'Geometry: Basic Shapes and Angles',
        subject: 'Math',
        description: 'Understand basic geometric shapes and angle relationships',
        difficulty: 'easy',
        timeLimit: 20,
        passingScore: 70,
        points: 20,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the sum of interior angles in a triangle?',
            options: ['90°', '180°', '270°', '360°'],
            correctAnswer: '180°',
            explanation: 'The sum of interior angles in any triangle is always 180°',
            points: 5,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'How many sides does a hexagon have?',
            options: ['4', '5', '6', '7'],
            correctAnswer: '6',
            explanation: 'A hexagon has 6 sides (hexa = six)',
            points: 3,
            order: 2,
          },
        ],
      },
      {
        title: 'Geometry: Area and Perimeter',
        subject: 'Math',
        description: 'Calculate area and perimeter of common shapes',
        difficulty: 'medium',
        timeLimit: 25,
        passingScore: 65,
        points: 25,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the area of a rectangle with length 8 and width 5?',
            options: ['13', '26', '40', '45'],
            correctAnswer: '40',
            explanation: 'Area = length × width = 8 × 5 = 40',
            points: 5,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'What is the area of a circle with radius 3? (Use π ≈ 3.14)',
            options: ['9.42', '18.84', '28.26', '37.68'],
            correctAnswer: '28.26',
            explanation: 'Area = πr² = 3.14 × 3² = 3.14 × 9 = 28.26',
            points: 6,
            order: 2,
          },
        ],
      },
      {
        title: 'Geometry: Pythagorean Theorem',
        subject: 'Math',
        description: 'Apply the Pythagorean theorem to solve problems',
        difficulty: 'medium',
        timeLimit: 25,
        passingScore: 70,
        points: 25,
        questions: [
          {
            type: 'multiple_choice',
            question:
              'In a right triangle with legs 3 and 4, what is the length of the hypotenuse?',
            options: ['5', '6', '7', '8'],
            correctAnswer: '5',
            explanation: 'Using a² + b² = c²: 3² + 4² = 9 + 16 = 25, so c = √25 = 5',
            points: 6,
            order: 1,
          },
        ],
      },
      // Calculus Quizzes (2 quizzes)
      {
        title: 'Calculus: Introduction to Derivatives',
        subject: 'Math',
        description: 'Basic concepts of derivatives and differentiation',
        difficulty: 'hard',
        timeLimit: 30,
        passingScore: 60,
        points: 30,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the derivative of f(x) = x²?',
            options: ['x', '2x', 'x²', '2x²'],
            correctAnswer: '2x',
            explanation: 'Using the power rule: d/dx(x²) = 2x',
            points: 6,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'What is the derivative of f(x) = 5x + 3?',
            options: ['5', '5x', '5x + 3', '8'],
            correctAnswer: '5',
            explanation: 'The derivative of a linear function is its slope: d/dx(5x + 3) = 5',
            points: 5,
            order: 2,
          },
        ],
      },
      {
        title: 'Calculus: Limits',
        subject: 'Math',
        description: 'Understand and calculate limits',
        difficulty: 'hard',
        timeLimit: 30,
        passingScore: 65,
        points: 30,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is lim(x→2) (x² - 4)/(x - 2)?',
            options: ['0', '2', '4', 'Undefined'],
            correctAnswer: '4',
            explanation: 'Factor: (x-2)(x+2)/(x-2) = x+2, so limit as x→2 is 2+2 = 4',
            points: 7,
            order: 1,
          },
        ],
      },
      // Statistics Quizzes (2 quizzes)
      {
        title: 'Statistics: Mean, Median, Mode',
        subject: 'Math',
        description: 'Calculate measures of central tendency',
        difficulty: 'easy',
        timeLimit: 20,
        passingScore: 70,
        points: 20,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the mean of: 2, 4, 6, 8, 10?',
            options: ['5', '6', '7', '8'],
            correctAnswer: '6',
            explanation: 'Mean = (2+4+6+8+10)/5 = 30/5 = 6',
            points: 5,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'What is the median of: 1, 3, 5, 7, 9?',
            options: ['3', '5', '7', '9'],
            correctAnswer: '5',
            explanation: 'The median is the middle value when numbers are in order: 5',
            points: 4,
            order: 2,
          },
        ],
      },
      {
        title: 'Statistics: Probability Basics',
        subject: 'Math',
        description: 'Basic probability concepts and calculations',
        difficulty: 'medium',
        timeLimit: 25,
        passingScore: 65,
        points: 25,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the probability of rolling a 6 on a standard die?',
            options: ['1/2', '1/3', '1/6', '1/12'],
            correctAnswer: '1/6',
            explanation: 'A standard die has 6 faces, so P(6) = 1/6',
            points: 5,
            order: 1,
          },
        ],
      },
      // Trigonometry Quizzes (2 quizzes)
      {
        title: 'Trigonometry: Basic Ratios',
        subject: 'Math',
        description: 'Understand sine, cosine, and tangent',
        difficulty: 'medium',
        timeLimit: 25,
        passingScore: 70,
        points: 25,
        questions: [
          {
            type: 'multiple_choice',
            question: 'In a right triangle, what is sin(30°)?',
            options: ['1/2', '√3/2', '1', '√2/2'],
            correctAnswer: '1/2',
            explanation: 'sin(30°) = 1/2 (from the 30-60-90 triangle)',
            points: 6,
            order: 1,
          },
          {
            type: 'multiple_choice',
            question: 'What is cos(60°)?',
            options: ['1/2', '√3/2', '1', '√2/2'],
            correctAnswer: '1/2',
            explanation: 'cos(60°) = 1/2',
            points: 5,
            order: 2,
          },
        ],
      },
      {
        title: 'Trigonometry: Unit Circle',
        subject: 'Math',
        description: 'Apply unit circle concepts',
        difficulty: 'hard',
        timeLimit: 30,
        passingScore: 65,
        points: 30,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is sin(90°)?',
            options: ['0', '1/2', '1', '√2/2'],
            correctAnswer: '1',
            explanation: 'On the unit circle, sin(90°) = 1',
            points: 6,
            order: 1,
          },
        ],
      },
    ];

    await Quiz.insertMany(mathQuizzes);
    console.log(`📚 Created ${mathQuizzes.length} Math quizzes`);

   

    console.log('✅ Database seeded successfully!');
    console.log('\n📧 Sample user credentials:');
    console.log('Admin: admin@behaviorallearning.com / Password123!');
    console.log('Student: student@example.com / Password123!');
    console.log('Tutor: tutor@example.com / Password123!');
    console.log('Parent: parent@example.com / Password123!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
};

// Run the seed function
seedData();
