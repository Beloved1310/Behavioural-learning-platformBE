# Repository Pattern - Usage Guide

## Overview
The repository pattern provides a clean, reusable abstraction over database operations following DRY principles.

## Architecture

```
BaseRepository (Generic CRUD operations)
    ↓
UserRepository (User-specific queries)
UserPreferencesRepository (Preferences-specific queries)
```

## BaseRepository Methods

All repositories inherit these generic methods:

### Create Operations
```typescript
// Create single document
await repository.create({ email: 'test@example.com', ... });

// Create multiple documents
await repository.createMany([{ ... }, { ... }]);
```

### Read Operations
```typescript
// Find by filter
await repository.findOne({ email: 'test@example.com' });

// Find by ID
await repository.findById('userId123');

// Find multiple
await repository.find({ role: 'STUDENT' });

// Find with pagination
await repository.findPaginated(
  { role: 'TUTOR' },
  { page: 1, limit: 10, sort: { rating: -1 } }
);

// Check existence
await repository.exists({ email: 'test@example.com' });

// Count documents
await repository.count({ role: 'STUDENT' });

// Get distinct values
await repository.distinct('role');
```

### Update Operations
```typescript
// Update by filter
await repository.updateOne(
  { email: 'test@example.com' },
  { firstName: 'John' }
);

// Update by ID
await repository.updateById('userId123', { firstName: 'John' });

// Update multiple
await repository.updateMany(
  { role: 'STUDENT' },
  { subscriptionTier: 'PREMIUM' }
);

// Increment field
await repository.increment({ _id: userId }, 'streakCount', 1);

// Decrement field
await repository.decrement({ _id: userId }, 'totalPoints', 10);
```

### Delete Operations
```typescript
// Delete by filter
await repository.deleteOne({ email: 'test@example.com' });

// Delete by ID
await repository.deleteById('userId123');

// Delete multiple
await repository.deleteMany({ isVerified: false });
```

### Advanced Operations
```typescript
// Aggregation pipeline
await repository.aggregate([
  { $match: { role: 'TUTOR' } },
  { $group: { _id: '$subjects', count: { $sum: 1 } } }
]);
```

## Repository Usage Examples

### UserRepository

```typescript
import { userRepository } from '../repositories';

// Find by email
const user = await userRepository.findByEmail('test@example.com');

// Find by email with password (for auth)
const userWithPassword = await userRepository.findByEmailWithPassword('test@example.com');

// Find by ID with specific fields
const userFields = await userRepository.findByIdWithFields(userId, 'email firstName');

// Update last login
await userRepository.updateLastLogin(userId);

// Find users by role with filters
const tutors = await userRepository.findByRole('TUTOR', {
  isVerified: true,
  rating: { $gte: 4.5 }
});

// Check if email exists
const exists = await userRepository.emailExists('test@example.com');

// Increment streak (from BaseRepository)
await userRepository.increment({ _id: userId }, 'streakCount');

// Add points (from BaseRepository)
await userRepository.increment({ _id: userId }, 'totalPoints', 50);

// Update subscription tier (from BaseRepository)
await userRepository.updateById(userId, { subscriptionTier: 'PREMIUM' });
```

### UserPreferencesRepository

```typescript
import { userPreferencesRepository } from '../repositories';

// Create preferences for new user
await userPreferencesRepository.create({
  userId: user._id,
  darkMode: true,
  language: 'en'
});

// Find by user ID
const prefs = await userPreferencesRepository.findByUserId(userId);

// Update preferences
await userPreferencesRepository.updateByUserId(userId, {
  darkMode: true,
  emailNotifications: false
});

// Toggle a single preference (using BaseRepository updateById)
await userPreferencesRepository.updateOne(
  { userId },
  { studyReminders: true }
);

// Delete preferences
await userPreferencesRepository.deleteByUserId(userId);
```

## Usage in Services

### Before (Direct Model Access - NOT DRY)
```typescript
import { User, UserPreferences } from '../models';

// Repetitive, tightly coupled to Mongoose
const user = await User.findOne({ email });
const prefs = await UserPreferences.create({ userId: user._id });
await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
```

### After (Repository Pattern - DRY & Reusable)
```typescript
import { userRepository, userPreferencesRepository } from '../repositories';

// Clean, reusable, abstracted
const user = await userRepository.findByEmail(email);
const prefs = await userPreferencesRepository.create({ userId: user._id });
await userRepository.updateLastLogin(userId);
```

## Advanced Patterns

### Complex Queries
```typescript
// Find tutors with specific criteria
const tutors = await userRepository.findPaginated(
  {
    role: 'TUTOR',
    isVerified: true,
    isBackgroundChecked: true,
    rating: { $gte: 4.0 },
    hourlyRate: { $lte: 50 }
  },
  { page: 1, limit: 20, sort: { rating: -1 } }
);
```

### Batch Operations
```typescript
// Update multiple users
const result = await userRepository.updateMany(
  { subscriptionTier: 'BASIC', isVerified: true },
  { $set: { notificationPreference: 'email' } }
);

console.log(`Updated ${result.modifiedCount} users`);
```

### Aggregations
```typescript
// Get user statistics
const stats = await userRepository.aggregate([
  { $match: { role: 'STUDENT' } },
  {
    $group: {
      _id: '$subscriptionTier',
      count: { $sum: 1 },
      avgPoints: { $avg: '$totalPoints' }
    }
  }
]);
```

## Benefits

1. **DRY**: Common operations defined once in BaseRepository
2. **Reusable**: Any repository can use any base method
3. **Testable**: Easy to mock repositories
4. **Maintainable**: Database logic separated from business logic
5. **Type-Safe**: Full TypeScript support
6. **Scalable**: Easy to add new repositories

## Creating New Repositories

```typescript
import { BaseRepository } from './BaseRepository';
import { MyModel } from '../models/MyModel';
import { IMyModel } from '../types';

class MyRepository extends BaseRepository<IMyModel> {
  constructor() {
    super(MyModel);
  }

  // Add model-specific methods only
  async findByCustomField(value: string): Promise<IMyModel | null> {
    return await this.findOne({ customField: value });
  }
}

export const myRepository = new MyRepository();
export default myRepository;
```

## Best Practices

1. **Keep repositories thin** - Only add methods that are truly specific to the model
2. **Use base methods** - Don't reimplement what BaseRepository already provides
3. **Use generics** - Leverage the power of TypeScript generics for type safety
4. **Export singletons** - One instance per repository
5. **Document custom methods** - Add JSDoc comments for clarity
