import { Schema, model } from 'mongoose';
import { IQuiz, IQuestion, QuizDifficulty } from '../types';

const questionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer'],
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    maxlength: 1000
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  order: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: true });

const quizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  difficulty: {
    type: String,
    enum: Object.values(QuizDifficulty),
    required: true,
    index: true
  },
  timeLimit: {
    type: Number, // in minutes
    min: 1,
    max: 180
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  questions: [questionSchema]
}, {
  timestamps: true
});

// Indexes for efficient queries
quizSchema.index({ subject: 1, isActive: 1 });
quizSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for total possible points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Instance method to calculate score percentage
quizSchema.methods.calculateScore = function(correctAnswers: number) {
  return Math.round((correctAnswers / this.questions.length) * 100);
};

// Static method to find active quizzes by subject
quizSchema.statics.findBySubject = function(subject: string) {
  return this.find({ 
    subject, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Static method to get random questions for practice
quizSchema.statics.getRandomQuestions = function(subject: string, count: number = 10) {
  return this.aggregate([
    { $match: { subject, isActive: true } },
    { $unwind: '$questions' },
    { $sample: { size: count } },
    { $replaceRoot: { newRoot: '$questions' } }
  ]);
};

export const Quiz = model<IQuiz>('Quiz', quizSchema);