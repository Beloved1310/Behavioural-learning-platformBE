# Gamification API Documentation

## Overview
This document describes the gamification endpoints created for the Behavioral Learning Platform backend. All endpoints require authentication unless otherwise specified.

## Base URL
```
/v1/api/gamification
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Get All Quizzes
**GET** `/quizzes`

Get a list of available quizzes with optional filtering.

**Query Parameters:**
- `subject` (optional): Filter by subject (e.g., "Mathematics", "Science")
- `difficulty` (optional): Filter by difficulty ("easy", "medium", "hard")

**Response:**
```json
{
  "quizzes": [
    {
      "id": "string",
      "title": "string",
      "subject": "string",
      "difficulty": "easy" | "medium" | "hard",
      "description": "string",
      "timeLimit": number,
      "questionCount": number,
      "totalPoints": number,
      "passingScore": number,
      "isActive": boolean,
      "createdAt": "ISO Date"
    }
  ]
}
```

**Frontend Usage:**
```typescript
const { quizzes } = await loadQuizzes(subject, difficulty);
```

---

### 2. Get Quiz by ID
**GET** `/quizzes/:id`

Get detailed quiz information for starting a quiz (without answers).

**Response:**
```json
{
  "quiz": {
    "id": "string",
    "title": "string",
    "subject": "string",
    "difficulty": "easy" | "medium" | "hard",
    "description": "string",
    "timeLimit": number,
    "passingScore": number,
    "questions": [
      {
        "id": "string",
        "type": "multiple_choice" | "true_false" | "short_answer",
        "question": "string",
        "options": ["string"],
        "points": number,
        "order": number
      }
    ]
  }
}
```

**Frontend Usage:**
```typescript
const quiz = await startQuiz(quizId);
```

---

### 3. Submit Quiz Attempt
**POST** `/quiz-attempts`

Submit a completed quiz attempt. Student role required.

**Request Body:**
```json
{
  "quizId": "string",
  "answers": {
    "questionId": "answer"
  },
  "timeSpent": number // in seconds
}
```

**Response:**
```json
{
  "attempt": {
    "id": "string",
    "quizId": "string",
    "score": number,
    "totalPoints": number,
    "percentage": number,
    "completedAt": "ISO Date",
    "timeSpent": number
  },
  "newBadges": [
    {
      "id": "string",
      "userId": "string",
      "badgeId": "string",
      "badge": {
        "id": "string",
        "name": "string",
        "description": "string",
        "icon": "string",
        "category": "quiz" | "streak" | "achievement" | "special",
        "rarity": "common" | "rare" | "epic" | "legendary",
        "criteria": {
          "type": "quiz_score" | "quiz_count" | "streak" | "points" | "perfect_score",
          "threshold": number,
          "subject": "string (optional)"
        },
        "pointsReward": number,
        "createdAt": "ISO Date",
        "isActive": boolean
      },
      "earnedAt": "ISO Date"
    }
  ],
  "pointsEarned": number
}
```

**Notes:**
- Automatically calculates score and percentage
- Updates user points and progress
- Checks for badge eligibility
- Updates subject-specific progress (level, XP, etc.)

---

### 4. Get Recent Attempts
**GET** `/quiz-attempts/recent`

Get the current user's recent quiz attempts. Student role required.

**Query Parameters:**
- `limit` (optional, default: 10): Number of attempts to return

**Response:**
```json
{
  "attempts": [
    {
      "id": "string",
      "quizId": "string",
      "score": number,
      "totalPoints": number,
      "percentage": number,
      "completedAt": "ISO Date",
      "timeSpent": number
    }
  ]
}
```

**Frontend Usage:**
```typescript
const { attempts } = await getRecentAttempts();
// Used in recentAttempts state
```

---

### 5. Get User Profile
**GET** `/profile`

Get the current user's gamification profile. Student role required.

**Response:**
```json
{
  "profile": {
    "userId": "string",
    "level": number,
    "currentXP": number,
    "nextLevelXP": number,
    "totalPoints": number,
    "streak": {
      "currentStreak": number,
      "longestStreak": number,
      "isActive": boolean
    },
    "badges": [
      {
        "id": "string",
        "userId": "string",
        "badgeId": "string",
        "badge": {
          "id": "string",
          "name": "string",
          "description": "string",
          "icon": "string",
          "category": "quiz" | "streak" | "achievement" | "special",
          "rarity": "common" | "rare" | "epic" | "legendary",
          "criteria": object,
          "pointsReward": number,
          "createdAt": "ISO Date",
          "isActive": boolean
        },
        "earnedAt": "ISO Date"
      }
    ],
    "rank": number
  }
}
```

**Frontend Usage:**
```typescript
const { profile } = await loadUserProfile();
// Used in userProfile state
```

---

### 6. Get User Progress
**GET** `/progress`

Get the current user's progress across all subjects. Student role required.

**Response:**
```json
{
  "progress": [
    {
      "id": "string",
      "userId": "string",
      "subject": "string",
      "level": number,
      "currentXP": number,
      "nextLevelXP": number,
      "completedQuizzes": number,
      "averageScore": number,
      "studyTime": number, // in minutes
      "lastActivity": "ISO Date"
    }
  ]
}
```

**Frontend Usage:**
```typescript
const { progress } = await loadUserProgress();
// Used in subjectProgress state
```

---

### 7. Get Available Badges
**GET** `/badges`

Get all available badges in the system.

**Response:**
```json
{
  "badges": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "category": "quiz" | "streak" | "achievement" | "special",
      "rarity": "common" | "rare" | "epic" | "legendary",
      "criteria": {
        "type": "quiz_score" | "quiz_count" | "streak" | "points" | "perfect_score",
        "threshold": number,
        "subject": "string (optional)"
      },
      "pointsReward": number,
      "createdAt": "ISO Date",
      "isActive": boolean
    }
  ]
}
```

**Frontend Usage:**
```typescript
const { badges } = await loadAvailableBadges();
```

---

### 8. Get Leaderboard
**GET** `/leaderboard`

Get the global leaderboard.

**Query Parameters:**
- `limit` (optional, default: 10): Number of top users to return

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": number,
      "userId": "string",
      "name": "string",
      "profileImage": "string | null",
      "totalPoints": number
    }
  ],
  "currentUser": {
    "rank": number,
    "userId": "string",
    "name": "string",
    "profileImage": "string | null",
    "totalPoints": number
  } | null
}
```

**Notes:**
- Returns top users based on total points
- If current user is not in top list, their rank is returned separately

---

## Database Models

### UserProgress Model
Tracks subject-specific progress for each user.

**Fields:**
- `userId`: Reference to User
- `subject`: Subject name (e.g., "Mathematics")
- `level`: Current level in this subject
- `currentXP`: Experience points in current level
- `nextLevelXP`: XP needed for next level
- `completedQuizzes`: Number of quizzes completed
- `averageScore`: Average percentage score
- `studyTime`: Total study time in minutes
- `lastActivity`: Last activity date

**Methods:**
- `addXP(xp)`: Add XP and handle level-ups automatically

---

### Updated Badge Model
Enhanced with category, rarity, and criteria fields.

**New Fields:**
- `category`: "quiz" | "streak" | "achievement" | "special"
- `rarity`: "common" | "rare" | "epic" | "legendary"
- `criteria`: Complex criteria object for eligibility
- `pointsReward`: Points awarded when badge is earned

---

### Updated Quiz Model
Added difficulty field.

**New Fields:**
- `difficulty`: "easy" | "medium" | "hard"

---

### Updated QuizAttempt Model
Added percentage and totalPoints fields.

**New Fields:**
- `totalPoints`: Total points possible
- `percentage`: Score as percentage (0-100)

---

## Badge System

### Automatic Badge Awarding
Badges are automatically checked and awarded after quiz completion based on:

1. **quiz_score**: Score percentage meets threshold
2. **quiz_count**: Total number of quizzes completed
3. **streak**: Login streak meets threshold
4. **points**: Total points meets threshold
5. **perfect_score**: Score is exactly 100%

### Badge Points
When a badge is earned:
- Badge points are automatically added to user's total points
- Badge is recorded in UserBadge collection
- Badge info is returned in quiz submission response

---

## Leveling System

### Global Level
- Based on total points: `level = floor(totalPoints / 100) + 1`
- XP within level: `currentXP = totalPoints % 100`

### Subject-Specific Level
- Stored in UserProgress model
- XP requirement increases by 20% per level
- Starting level: 1, Starting XP requirement: 100
- Automatically levels up when XP threshold is reached

---

## Integration with Frontend

The API endpoints map directly to your frontend store methods:

```typescript
// Frontend Store Methods → Backend Endpoints
loadQuizzes() → GET /quizzes
startQuiz() → GET /quizzes/:id
submitQuizAttempt() → POST /quiz-attempts
loadUserProfile() → GET /profile
loadUserProgress() → GET /progress
loadAvailableBadges() → GET /badges
getLeaderboard() → GET /leaderboard
```

---

## Error Handling

All endpoints use standard HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error

Error response format:
```json
{
  "error": "Error message description"
}
```

---

## Next Steps

To use these endpoints:

1. **Seed Database**: Create sample quizzes and badges
2. **Test Endpoints**: Use Postman or similar tool
3. **Frontend Integration**: Update API base URL in frontend
4. **Badge Configuration**: Create badge definitions in database

### Sample Badges to Create:
```javascript
{
  name: "First Steps",
  category: "achievement",
  rarity: "common",
  criteria: { type: "quiz_count", threshold: 1 },
  pointsReward: 50
},
{
  name: "Quiz Master",
  category: "quiz",
  rarity: "rare",
  criteria: { type: "quiz_score", threshold: 90 },
  pointsReward: 200
},
{
  name: "Perfect Score",
  category: "quiz",
  rarity: "epic",
  criteria: { type: "perfect_score", threshold: 100 },
  pointsReward: 500
}
```

---

## API Testing

Example cURL commands:

```bash
# Get quizzes
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/gamification/quizzes

# Get user profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/gamification/profile

# Submit quiz attempt
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "QUIZ_ID",
    "answers": {"QUESTION_ID": "answer"},
    "timeSpent": 300
  }' \
  http://localhost:3000/v1/api/gamification/quiz-attempts
```
