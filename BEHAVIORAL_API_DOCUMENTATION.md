# Behavioral Tracking API Documentation

Base URL: `/v1/api/behavioral`

All endpoints require authentication via Bearer token in the Authorization header.

## Table of Contents
1. [Mood Tracking](#mood-tracking)
2. [Event Tracking](#event-tracking)
3. [Behavioral Insights](#behavioral-insights)
4. [Recommendations](#recommendations)
5. [Progress Reports](#progress-reports)
6. [Motivational System](#motivational-system)

---

## Mood Tracking

### 1. Log Mood Entry

**POST** `/mood`

Log a user's mood at a specific time.

**Request Body:**
```json
{
  "mood": "happy",
  "intensity": 4,
  "context": "After completing quiz",
  "tags": ["study", "achievement"],
  "notes": "Felt confident about my performance"
}
```

**Validation:**
- `mood` (required): One of: `happy`, `sad`, `angry`, `anxious`, `excited`, `calm`, `frustrated`, `confused`, `confident`, `neutral`
- `intensity` (required): Integer between 1-5
- `context` (optional): String, max 200 characters
- `tags` (optional): Array of strings
- `notes` (optional): String, max 500 characters

**Response:** `201 Created`
```json
{
  "success": true,
  "moodLog": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "mood": "happy",
    "intensity": 4,
    "context": "After completing quiz",
    "tags": ["study", "achievement"],
    "notes": "Felt confident about my performance",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get Mood History

**GET** `/mood/history?days=30&limit=50`

Retrieve user's mood log history.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30, max: 365)
- `limit` (optional): Maximum number of records (default: 50, max: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "moodLogs": [
    {
      "id": "507f1f77bcf86cd799439011",
      "mood": "happy",
      "intensity": 4,
      "context": "After completing quiz",
      "tags": ["study", "achievement"],
      "notes": "Felt confident",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 25
}
```

---

### 3. Get Mood Distribution

**GET** `/mood/distribution?days=30`

Get aggregated mood distribution data.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:** `200 OK`
```json
{
  "success": true,
  "distribution": [
    {
      "_id": "happy",
      "count": 15,
      "averageIntensity": 4.2
    },
    {
      "_id": "confident",
      "count": 10,
      "averageIntensity": 4.5
    }
  ],
  "period": "30 days"
}
```

---

### 4. Get Mood Trends

**GET** `/mood/trends?days=30`

Get daily mood trends over time.

**Response:** `200 OK`
```json
{
  "success": true,
  "trends": [
    {
      "_id": "2024-01-15",
      "moods": [
        { "mood": "happy", "intensity": 4 },
        { "mood": "excited", "intensity": 5 }
      ],
      "averageIntensity": 4.5
    }
  ],
  "period": "30 days"
}
```

---

## Event Tracking

### 5. Track Custom Event

**POST** `/events`

Track a custom behavioral event.

**Request Body:**
```json
{
  "eventType": "page_view",
  "eventData": {
    "page": "behavioral_dashboard",
    "timeSpent": 120
  },
  "page": "behavioral_dashboard",
  "sessionId": "session-abc123"
}
```

**Validation:**
- `eventType` (required): String, max 100 characters
- `eventData` (optional): Object with any structure
- `page` (optional): String, max 200 characters
- `sessionId` (optional): String, max 100 characters

**Response:** `201 Created`
```json
{
  "success": true,
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "eventType": "page_view",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 6. Get Event History

**GET** `/events/history?eventType=page_view&limit=50`

Retrieve user's event history.

**Query Parameters:**
- `eventType` (optional): Filter by event type
- `limit` (optional): Max records (default: 50, max: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "events": [
    {
      "id": "507f1f77bcf86cd799439011",
      "eventType": "page_view",
      "eventData": {
        "page": "behavioral_dashboard"
      },
      "page": "behavioral_dashboard",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 42
}
```

---

### 7. Get Event Counts

**GET** `/events/counts?days=30`

Get aggregated event counts by type.

**Response:** `200 OK`
```json
{
  "success": true,
  "eventCounts": [
    {
      "_id": "page_view",
      "count": 150,
      "lastOccurrence": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "quiz_started",
      "count": 25,
      "lastOccurrence": "2024-01-14T15:20:00.000Z"
    }
  ],
  "period": "30 days"
}
```

---

### 8. Get Page Views

**GET** `/events/page-views?days=30`

Get page view statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "pageViews": [
    {
      "_id": "behavioral_dashboard",
      "views": 45,
      "lastVisit": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "quiz_page",
      "views": 30,
      "lastVisit": "2024-01-14T14:20:00.000Z"
    }
  ],
  "period": "30 days"
}
```

---

## Behavioral Insights

### 9. Get Comprehensive Behavioral Insights

**GET** `/insights?days=30`

Get AI-generated insights based on user behavior.

**Response:** `200 OK`
```json
{
  "success": true,
  "insights": [
    {
      "type": "mood",
      "title": "Mood Pattern",
      "description": "Your most frequent mood in the past 30 days has been \"happy\"",
      "data": {
        "mood": "happy",
        "count": 15
      }
    },
    {
      "type": "consistency",
      "title": "Study Consistency",
      "description": "You've completed 8 out of 10 sessions (80%)",
      "data": {
        "totalSessions": 10,
        "completedSessions": 8,
        "totalDuration": 480
      }
    },
    {
      "type": "performance",
      "title": "Quiz Performance",
      "description": "Average quiz score: 85% across 12 quizzes",
      "data": {
        "totalQuizzes": 12,
        "averageScore": 85,
        "totalTimeSpent": 3600
      }
    },
    {
      "type": "engagement",
      "title": "Engagement Level",
      "description": "Your average engagement score is 78%",
      "data": {
        "averageEngagement": 78,
        "dataPoints": 45
      }
    }
  ],
  "period": "30 days"
}
```

---

### 10. Get Study Consistency Analysis

**GET** `/insights/consistency?days=30`

Get detailed study consistency patterns.

**Response:** `200 OK`
```json
{
  "success": true,
  "consistency": {
    "dailyPattern": [
      {
        "_id": "2024-01-15",
        "sessionCount": 2,
        "totalMinutes": 90
      },
      {
        "_id": "2024-01-14",
        "sessionCount": 1,
        "totalMinutes": 45
      }
    ],
    "weeklyPattern": [
      {
        "_id": 2,
        "sessionCount": 5,
        "avgDuration": 50
      },
      {
        "_id": 3,
        "sessionCount": 8,
        "avgDuration": 55
      }
    ],
    "currentStreak": 5,
    "lastActive": "2024-01-15T10:30:00.000Z"
  },
  "period": "30 days"
}
```

---

### 11. Get Sentiment Analysis

**GET** `/insights/sentiment?days=30`

Get overall sentiment analysis from mood and engagement.

**Response:** `200 OK`
```json
{
  "success": true,
  "sentiment": {
    "overall": "positive",
    "moodScore": 78,
    "engagementScore": 75,
    "dataPoints": {
      "moodLogs": 45,
      "engagementRecords": 38
    }
  },
  "period": "30 days"
}
```

**Sentiment Values:**
- `very_positive`: High mood score (≥80) and high engagement (≥70)
- `positive`: Good mood score (≥70) and decent engagement (≥60)
- `neutral`: Average scores
- `negative`: Low mood score (<50) or low engagement (<40)

---

## Recommendations

### 12. Get Personalized Recommendations

**GET** `/recommendations?type=content&limit=10`

Get personalized recommendations based on behavior.

**Query Parameters:**
- `type` (optional): Filter by type (`content`, `study_time`, `break`, `technique`, `goal`)
- `limit` (optional): Max records (default: 10, max: 50)

**Response:** `200 OK`
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "break",
      "title": "Consider Taking Breaks",
      "description": "We noticed you've been feeling stressed. Try taking short breaks during study sessions.",
      "priority": 4,
      "metadata": {
        "reason": "high_negative_mood_frequency"
      },
      "isRead": false,
      "isActioned": false,
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 5
}
```

---

### 13. Generate New Recommendations

**POST** `/recommendations/generate`

Generate new recommendations based on recent behavior.

**Response:** `201 Created`
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "technique",
      "title": "Try Active Recall",
      "description": "Your quiz scores suggest you might benefit from active recall techniques.",
      "priority": 5,
      "metadata": {
        "current_avg": 65,
        "target": 80
      },
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 3
}
```

---

### 14. Mark Recommendation as Read

**PATCH** `/recommendations/:id/read`

Mark a recommendation as read.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Recommendation marked as read"
}
```

---

### 15. Mark Recommendation as Actioned

**PATCH** `/recommendations/:id/actioned`

Mark a recommendation as actioned (user took action).

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Recommendation marked as actioned"
}
```

---

## Progress Reports

### 16. Get Progress Reports

**GET** `/reports?period=weekly&limit=10`

Get user's progress reports.

**Query Parameters:**
- `period` (optional): Filter by period (`weekly` or `monthly`)
- `limit` (optional): Max records (default: 10, max: 50)

**Response:** `200 OK`
```json
{
  "success": true,
  "reports": [
    {
      "id": "507f1f77bcf86cd799439011",
      "period": "weekly",
      "startDate": "2024-01-08T00:00:00.000Z",
      "endDate": "2024-01-15T00:00:00.000Z",
      "totalStudyTime": 450,
      "sessionsCompleted": 8,
      "quizzesTaken": 5,
      "averageScore": 82,
      "streakDays": 5,
      "badgesEarned": 2,
      "pointsEarned": 450,
      "insights": [
        "You completed 8 study sessions this weekly",
        "You took 5 quizzes with an average score of 82%",
        "Total study time: 450 minutes"
      ],
      "recommendations": [
        "Try to increase your study frequency for better consistency"
      ],
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 4
}
```

---

### 17. Generate Progress Report

**POST** `/reports/generate`

Generate a new progress report for the specified period.

**Request Body:**
```json
{
  "period": "weekly"
}
```

**Validation:**
- `period` (required): Either `weekly` or `monthly`

**Response:** `201 Created`
```json
{
  "success": true,
  "report": {
    "id": "507f1f77bcf86cd799439011",
    "period": "weekly",
    "startDate": "2024-01-08T00:00:00.000Z",
    "endDate": "2024-01-15T00:00:00.000Z",
    "totalStudyTime": 450,
    "sessionsCompleted": 8,
    "quizzesTaken": 5,
    "averageScore": 82,
    "streakDays": 5,
    "badgesEarned": 2,
    "pointsEarned": 450,
    "insights": [
      "You completed 8 study sessions this weekly",
      "You took 5 quizzes with an average score of 82%"
    ],
    "recommendations": [
      "Consider reviewing material more thoroughly before taking quizzes"
    ],
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Motivational System

### 18. Get Motivational Prompts

**GET** `/motivational-prompts?max=3`

Get personalized motivational messages based on user progress.

**Query Parameters:**
- `max` (optional): Maximum number of prompts (default: 3, max: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "prompts": [
    {
      "message": "Amazing! You're on a 5-day streak! 🔥",
      "icon": "🔥"
    },
    {
      "message": "Only 15 points until you reach 500! 🎯",
      "icon": "🎯"
    },
    {
      "message": "You're making great progress! 🚀",
      "icon": "🚀"
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Mood is required",
    "Intensity must be at least 1"
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Recommendation not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to fetch behavioral insights"
}
```

---

## Frontend Integration Examples

### Tracking Page Views
```typescript
const trackPageView = async (page: string) => {
  await fetch('/v1/api/behavioral/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      eventType: 'page_view',
      eventData: { page, timestamp: new Date() },
      page
    })
  });
};
```

### Logging Mood
```typescript
const logMood = async (mood: string, intensity: number) => {
  const response = await fetch('/v1/api/behavioral/mood', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ mood, intensity })
  });
  return response.json();
};
```

### Fetching Insights
```typescript
const getInsights = async (days = 30) => {
  const response = await fetch(
    `/v1/api/behavioral/insights?days=${days}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

---

## Database Models

### MoodLog Schema
```typescript
{
  userId: ObjectId (ref: User),
  mood: String (enum),
  intensity: Number (1-5),
  context: String,
  tags: [String],
  notes: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### CustomEvent Schema
```typescript
{
  userId: ObjectId (ref: User),
  eventType: String,
  eventData: Mixed,
  page: String,
  sessionId: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Recommendation Schema
```typescript
{
  userId: ObjectId (ref: User),
  type: String (enum),
  title: String,
  description: String,
  priority: Number (1-5),
  metadata: Mixed,
  isRead: Boolean,
  isActioned: Boolean,
  expiresAt: Date,
  generatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds (24-character hex strings)
- Rate limiting applies to all endpoints
- Authentication is required for all endpoints
- Query parameters with default values will use the default if not provided
- The system automatically generates insights and recommendations based on behavioral patterns
