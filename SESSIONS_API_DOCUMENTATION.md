# Sessions & Scheduling API Documentation

## Overview
This document describes the sessions and scheduling endpoints for the Behavioral Learning Platform. The system supports self-study sessions, tutor bookings, recurring sessions, and session reminders.

## Base URL
```
/v1/api
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Session Management Endpoints

### 1. Get User Sessions
**GET** `/sessions`

Get all sessions for the current user with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status ("scheduled", "completed", "missed", "cancelled")
- `type` (optional): Filter by type ("study", "tutoring", "quiz", "reading")
- `startDate` (optional): Filter sessions starting from this date (ISO format)
- `endDate` (optional): Filter sessions up to this date (ISO format)

**Response:**
```json
{
  "sessions": [
    {
      "id": "string",
      "title": "string",
      "subject": "string",
      "type": "study" | "tutoring" | "quiz" | "reading",
      "startTime": "ISO Date",
      "endTime": "ISO Date",
      "tutor": {
        "id": "string",
        "name": "string",
        "avatar": "string | null"
      } | undefined,
      "status": "scheduled" | "completed" | "missed" | "cancelled",
      "isRecurring": boolean,
      "recurringPattern": "daily" | "weekly" | "monthly" | undefined,
      "reminderEnabled": boolean,
      "reminderTime": number,
      "description": "string",
      "notes": "string",
      "meetingUrl": "string",
      "price": number,
      "rating": number,
      "feedback": "string"
    }
  ]
}
```

**Frontend Usage:**
```typescript
const response = await fetch('/v1/api/sessions?status=scheduled', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { sessions } = await response.json();
```

---

### 2. Get Session by ID
**GET** `/sessions/:id`

Get detailed information about a specific session.

**Response:**
```json
{
  "session": {
    "id": "string",
    "title": "string",
    "subject": "string",
    "type": "study" | "tutoring" | "quiz" | "reading",
    "startTime": "ISO Date",
    "endTime": "ISO Date",
    "student": {
      "id": "string",
      "name": "string",
      "avatar": "string | null",
      "email": "string"
    },
    "tutor": {
      "id": "string",
      "name": "string",
      "avatar": "string | null",
      "email": "string"
    } | undefined,
    "status": "scheduled" | "completed" | "missed" | "cancelled",
    "isRecurring": boolean,
    "recurringPattern": "daily" | "weekly" | "monthly" | undefined,
    "reminderEnabled": boolean,
    "reminderTime": number,
    "description": "string",
    "notes": "string",
    "meetingUrl": "string",
    "price": number,
    "rating": number,
    "feedback": "string",
    "createdAt": "ISO Date",
    "updatedAt": "ISO Date"
  }
}
```

**Notes:**
- Only students and tutors involved in the session can access it
- Returns 403 if user doesn't have access

---

### 3. Create Session
**POST** `/sessions`

Create a new study or quiz session.

**Request Body:**
```json
{
  "title": "string (required)",
  "subject": "string (required)",
  "type": "study" | "tutoring" | "quiz" | "reading" (required)",
  "startTime": "ISO Date (required)",
  "duration": number, // in minutes (required)
  "tutorId": "string (optional)",
  "description": "string (optional)",
  "isRecurring": boolean (optional, default: false),
  "recurringPattern": "daily" | "weekly" | "monthly" (optional)",
  "reminderEnabled": boolean (optional, default: true),
  "reminderTime": number // minutes before (optional, default: 15)
}
```

**Response:**
```json
{
  "session": {
    "id": "string",
    "title": "string",
    "subject": "string",
    "type": "study",
    "startTime": "ISO Date",
    "endTime": "ISO Date",
    "tutor": {...} | undefined,
    "status": "scheduled",
    "isRecurring": boolean,
    "recurringPattern": "daily" | "weekly" | "monthly" | undefined,
    "reminderEnabled": boolean,
    "reminderTime": number,
    "description": "string"
  }
}
```

**Frontend Usage:**
```typescript
const sessionData = {
  title: "Math Practice",
  subject: "Mathematics",
  type: "study",
  startTime: new Date().toISOString(),
  duration: 60,
  isRecurring: true,
  recurringPattern: "daily",
  reminderEnabled: true,
  reminderTime: 15
};

const response = await fetch('/v1/api/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(sessionData)
});
```

---

### 4. Update Session
**PUT** `/sessions/:id`

Update an existing session.

**Request Body:**
```json
{
  "title": "string (optional)",
  "subject": "string (optional)",
  "type": "study" | "tutoring" | "quiz" | "reading" (optional)",
  "startTime": "ISO Date (optional)",
  "duration": number (optional),
  "description": "string (optional)",
  "isRecurring": boolean (optional)",
  "recurringPattern": "daily" | "weekly" | "monthly" (optional)",
  "reminderEnabled": boolean (optional)",
  "reminderTime": number (optional)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "session": {
    // Updated session object
  }
}
```

**Notes:**
- Only the student who created the session can update it
- Returns 403 if user doesn't have permission

---

### 5. Delete Session
**DELETE** `/sessions/:id`

Delete a session.

**Response:**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Notes:**
- Only the student who created the session can delete it
- Permanently removes the session

---

### 6. Update Session Status
**PATCH** `/sessions/:id/status`

Update the status of a session.

**Request Body:**
```json
{
  "status": "scheduled" | "completed" | "missed" | "cancelled"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session status updated",
  "status": "completed"
}
```

**Notes:**
- Both students and tutors can update status
- Useful for marking sessions as completed or cancelled

---

### 7. Get Session Statistics
**GET** `/sessions/stats`

Get session statistics for the current user.

**Response:**
```json
{
  "stats": {
    "total": number,
    "scheduled": number,
    "completed": number,
    "missed": number,
    "cancelled": number,
    "upcoming": number,
    "today": number,
    "averageRating": number
  }
}
```

**Frontend Usage:**
```typescript
const { stats } = await fetch('/v1/api/sessions/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());

// Display in SessionStats component
```

---

## Tutor Management Endpoints

### 8. Search Tutors
**GET** `/tutors/search`

Search for available tutors.

**Query Parameters:**
- `subject` (optional): Filter by subject
- `query` (optional): Search by name

**Response:**
```json
{
  "tutors": [
    {
      "id": "string",
      "name": "string",
      "avatar": "string | null",
      "subjects": ["string"],
      "hourlyRate": number,
      "rating": number,
      "totalSessions": number,
      "bio": "string"
    }
  ]
}
```

**Frontend Usage:**
```typescript
const { tutors } = await fetch('/v1/api/tutors/search?subject=Mathematics', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());
```

---

### 9. Get Tutor Availability
**GET** `/tutors/:tutorId/availability`

Check a tutor's availability for a specific date.

**Query Parameters:**
- `date` (optional): Date to check (ISO format, defaults to today)

**Response:**
```json
{
  "tutorId": "string",
  "date": "ISO Date",
  "bookedSlots": [
    {
      "start": "ISO Date",
      "end": "ISO Date"
    }
  ],
  "tutor": {
    "id": "string",
    "name": "string",
    "hourlyRate": number,
    "rating": number
  }
}
```

**Frontend Usage:**
```typescript
const date = new Date().toISOString();
const { bookedSlots, tutor } = await fetch(
  `/v1/api/tutors/${tutorId}/availability?date=${date}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(res => res.json());

// Use bookedSlots to show available time slots
```

---

### 10. Book Tutor Session
**POST** `/tutors/book`

Book a session with a tutor.

**Request Body:**
```json
{
  "tutorId": "string (required)",
  "title": "string (required)",
  "subject": "string (required)",
  "startTime": "ISO Date (required)",
  "duration": number, // in minutes (required)
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "session": {
    "id": "string",
    "title": "string",
    "subject": "string",
    "type": "tutoring",
    "startTime": "ISO Date",
    "endTime": "ISO Date",
    "tutor": {
      "id": "string",
      "name": "string",
      "avatar": "string | null"
    },
    "status": "scheduled",
    "price": number,
    "reminderEnabled": true,
    "reminderTime": 15
  }
}
```

**Notes:**
- Automatically calculates price based on tutor's hourly rate
- Checks for scheduling conflicts
- Returns 409 if tutor is not available at the requested time
- Sets type to "tutoring" automatically

---

## Session Types

### study
Self-study sessions created by the student.
- No tutor required
- Price defaults to 0
- Can be recurring

### tutoring
Sessions with a tutor.
- Requires tutorId
- Price calculated based on tutor's hourly rate
- Must check availability before booking

### quiz
Quiz or assessment sessions.
- No tutor required
- Price defaults to 0
- Usually shorter duration

### reading
Reading practice sessions.
- No tutor required
- Price defaults to 0
- Can be recurring

---

## Recurring Patterns

### daily
Session repeats every day at the same time.

### weekly
Session repeats every week on the same day and time.

### monthly
Session repeats monthly on the same date and time.

**Note:** Recurring sessions are stored as a single record with the recurring flag. The frontend should generate instance view based on the pattern.

---

## Reminder System

Sessions support reminders to notify users before they start.

**Fields:**
- `reminderEnabled`: Boolean to enable/disable reminders
- `reminderTime`: Minutes before session to send reminder (5-1440 minutes)

**Default:** Reminders are enabled by default, 15 minutes before the session.

**Implementation:**
- Backend tracks reminder settings
- Can be integrated with notification system
- Frontend can display upcoming sessions with reminders

---

## Session Status Workflow

```
scheduled → in_progress → completed
         ↘ cancelled
         ↘ missed (if not attended)
```

**Status Descriptions:**
- **scheduled**: Session is upcoming
- **in_progress**: Session is currently active
- **completed**: Session finished successfully
- **missed**: Student didn't attend scheduled session
- **cancelled**: Session was cancelled by student or tutor

---

## Frontend Integration Examples

### Example: Create Study Session

```typescript
const createStudySession = async (data) => {
  const session = {
    title: data.title,
    subject: data.subject,
    type: 'study',
    startTime: data.startTime,
    duration: data.duration,
    isRecurring: data.isRecurring,
    recurringPattern: data.recurringPattern,
    reminderEnabled: true,
    reminderTime: 15
  };

  const response = await fetch('/v1/api/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(session)
  });

  return response.json();
};
```

---

### Example: Book Tutor

```typescript
const bookTutor = async (tutorId, sessionDetails) => {
  // First check availability
  const { bookedSlots } = await fetch(
    `/v1/api/tutors/${tutorId}/availability?date=${sessionDetails.date}`
  ).then(res => res.json());

  // Check if slot is available
  const isAvailable = checkSlotAvailability(
    bookedSlots,
    sessionDetails.startTime,
    sessionDetails.duration
  );

  if (!isAvailable) {
    throw new Error('Tutor not available at this time');
  }

  // Book the session
  const response = await fetch('/v1/api/tutors/book', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tutorId,
      title: sessionDetails.title,
      subject: sessionDetails.subject,
      startTime: sessionDetails.startTime,
      duration: sessionDetails.duration,
      description: sessionDetails.description
    })
  });

  return response.json();
};
```

---

### Example: Update Session Status

```typescript
const markSessionComplete = async (sessionId) => {
  const response = await fetch(`/v1/api/sessions/${sessionId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'completed' })
  });

  return response.json();
};
```

---

## Error Handling

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**403 Forbidden:**
```json
{
  "error": "Access denied"
}
```

**404 Not Found:**
```json
{
  "error": "Session not found"
}
```

**409 Conflict:**
```json
{
  "error": "Tutor is not available at this time"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch sessions"
}
```

---

## Best Practices

1. **Session Creation**
   - Validate time slots before creating sessions
   - Set appropriate reminder times
   - Use meaningful titles and descriptions

2. **Tutor Booking**
   - Always check availability first
   - Handle scheduling conflicts gracefully
   - Confirm price with user before booking

3. **Status Updates**
   - Update status promptly after sessions
   - Mark missed sessions appropriately
   - Collect feedback for completed sessions

4. **Recurring Sessions**
   - Clearly indicate recurring patterns to users
   - Provide option to modify/cancel all instances
   - Handle edge cases (e.g., end dates)

5. **Reminders**
   - Respect user's reminder preferences
   - Provide multiple reminder time options
   - Integrate with notification system

---

## Testing

### Test Session Creation
```bash
curl -X POST http://localhost:3000/v1/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Math Practice",
    "subject": "Mathematics",
    "type": "study",
    "startTime": "2024-01-20T14:00:00Z",
    "duration": 60,
    "reminderEnabled": true
  }'
```

### Test Tutor Search
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/v1/api/tutors/search?subject=Mathematics"
```

### Test Get Sessions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/v1/api/sessions?status=scheduled"
```

---

## Next Steps

To integrate sessions into your frontend:

1. **Create Session Store**
   - Manage session state
   - Handle CRUD operations
   - Track session statistics

2. **Implement Calendar View**
   - Display sessions on calendar
   - Handle recurring sessions
   - Show availability

3. **Build Tutor Booking Flow**
   - Search tutors
   - Check availability
   - Book and confirm sessions

4. **Add Reminder System**
   - Display upcoming sessions
   - Show reminder notifications
   - Allow reminder customization

The complete implementation is now ready on the backend!
