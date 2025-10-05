import { Schema, model } from 'mongoose';
import { IUserPreferences } from '../types';

const userPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  studyReminders: {
    type: Boolean,
    default: true
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de'] // Can extend this list
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  sessionReminders: {
    type: Boolean,
    default: true
  },
  progressReports: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient lookups
userPreferencesSchema.index({ userId: 1 });

export const UserPreferences = model<IUserPreferences>('UserPreferences', userPreferencesSchema);