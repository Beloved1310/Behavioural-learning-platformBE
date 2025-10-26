import { Schema, model } from 'mongoose';
import { IMoodLog } from '../types';

const moodLogSchema = new Schema<IMoodLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'frustrated', 'confused', 'confident', 'neutral'],
    required: true
  },
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  context: {
    type: String
  },
  tags: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
moodLogSchema.index({ userId: 1, timestamp: -1 });
moodLogSchema.index({ mood: 1 });
moodLogSchema.index({ timestamp: -1 });

// Static method to get mood distribution for a user
moodLogSchema.statics.getMoodDistribution = function(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$mood',
        count: { $sum: 1 },
        averageIntensity: { $avg: '$intensity' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get mood trends over time
moodLogSchema.statics.getMoodTrends = function(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        moods: {
          $push: {
            mood: '$mood',
            intensity: '$intensity'
          }
        },
        averageIntensity: { $avg: '$intensity' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

export const MoodLog = model<IMoodLog>('MoodLog', moodLogSchema);
