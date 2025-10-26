# Settings API Documentation

## Base URLs
- **User Preferences**: `/v1/api/preferences`
- **User Account**: `/v1/api/users`

All endpoints require authentication via Bearer token in the Authorization header.

---

## User Preferences Endpoints

### 1. Get User Preferences

**GET** `/v1/api/preferences`

Retrieves the authenticated user's notification and account preferences.

#### Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "preferences": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "studyReminders": true,
    "darkMode": false,
    "language": "en",
    "timezone": "UTC",
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "sessionReminders": true,
    "progressReports": true,
    "weeklyReport": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-20T14:22:00.000Z"
  }
}
```

#### Notes
- If no preferences exist for the user, default preferences will be created automatically
- Default values are returned for any missing preference fields

---

### 2. Update User Preferences

**PUT** `/v1/api/preferences`

Updates the authenticated user's preferences. Only provided fields will be updated.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "emailNotifications": true,
  "pushNotifications": false,
  "sessionReminders": true,
  "weeklyReport": true,
  "studyReminders": true,
  "darkMode": false,
  "language": "en",
  "timezone": "UTC"
}
```

#### Field Descriptions

**Notification Settings:**
- `emailNotifications` (boolean, optional): Receive updates and announcements via email
- `pushNotifications` (boolean, optional): Get real-time notifications in browser
- `smsNotifications` (boolean, optional): Receive SMS notifications (if phone number is verified)
- `sessionReminders` (boolean, optional): Receive reminders before scheduled sessions
- `progressReports` (boolean, optional): Receive periodic progress reports
- `weeklyReport` (boolean, optional): Get a weekly summary of learning progress

**Appearance & Locale:**
- `darkMode` (boolean, optional): Enable dark theme
- `language` (string, optional): One of: "en", "es", "fr", "de"
- `timezone` (string, optional): User's timezone (e.g., "UTC", "America/New_York")

**Study Settings:**
- `studyReminders` (boolean, optional): Enable study reminders

#### Response (200 OK)
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "studyReminders": true,
    "darkMode": false,
    "language": "en",
    "timezone": "UTC",
    "emailNotifications": true,
    "pushNotifications": false,
    "smsNotifications": false,
    "sessionReminders": true,
    "progressReports": true,
    "weeklyReport": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-20T15:30:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request**: Validation error
  ```json
  {
    "error": "Validation Error",
    "details": [
      {
        "field": "language",
        "message": "Language must be one of: en, es, fr, de"
      }
    ]
  }
  ```
- **401 Unauthorized**: No token or invalid token

---

### 3. Reset Preferences to Default

**POST** `/v1/api/preferences/reset`

Resets all preferences to their default values.

#### Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "message": "Preferences reset to default",
  "preferences": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "studyReminders": true,
    "darkMode": false,
    "language": "en",
    "timezone": "UTC",
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "sessionReminders": true,
    "progressReports": true,
    "weeklyReport": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-20T15:45:00.000Z"
  }
}
```

#### Default Values
- `studyReminders`: true
- `darkMode`: false
- `language`: "en"
- `timezone`: "UTC"
- `emailNotifications`: true
- `pushNotifications`: true
- `smsNotifications`: false
- `sessionReminders`: true
- `progressReports`: true
- `weeklyReport`: true

---

## Password & Security Endpoints

### 4. Change Password

**PUT** `/v1/api/users/password`

Updates the authenticated user's password.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least:
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character (@$!%*?&)

#### Response (200 OK)
```json
{
  "message": "Password updated successfully"
}
```

#### Error Responses
- **400 Bad Request**: Validation error or password doesn't meet requirements
  ```json
  {
    "error": "Validation Error",
    "details": [
      {
        "field": "newPassword",
        "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }
    ]
  }
  ```
- **401 Unauthorized**: Current password is incorrect or no/invalid token
  ```json
  {
    "error": "Current password is incorrect"
  }
  ```
- **404 Not Found**: User not found

---

## Privacy & Account Management

### 5. Delete Account

**DELETE** `/v1/api/users/account`

Permanently deletes the authenticated user's account. This action cannot be undone.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "password": "MyPassword123!"
}
```

#### Response (200 OK)
```json
{
  "message": "Account deleted successfully"
}
```

#### Error Responses
- **400 Bad Request**: Password not provided
- **401 Unauthorized**: Incorrect password or no/invalid token
- **404 Not Found**: User not found

#### Important Notes
- This action is **irreversible**
- All user data will be permanently deleted including:
  - Profile information
  - Learning progress
  - Quiz attempts
  - Session history
  - Messages
  - Badges and achievements

---

## Example Usage

### React TypeScript Example (matching Settings component)

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface NotificationForm {
  emailNotifications: boolean;
  pushNotifications: boolean;
  sessionReminders: boolean;
  weeklyReport: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Get preferences
const getPreferences = async () => {
  const response = await fetch('http://localhost:3000/v1/api/preferences', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  const data = await response.json();
  return data.preferences;
};

// Update notification preferences
const onNotificationSubmit = async (data: NotificationForm) => {
  const response = await fetch('http://localhost:3000/v1/api/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to update preferences');
  }

  const result = await response.json();
  return result;
};

// Change password
const onPasswordSubmit = async (data: PasswordForm) => {
  const response = await fetch('http://localhost:3000/v1/api/users/password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }

  const result = await response.json();
  return result;
};

// Delete account
const handleDeleteAccount = async (password: string) => {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return;
  }

  const response = await fetch('http://localhost:3000/v1/api/users/account', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete account');
  }

  const result = await response.json();
  alert('Account deleted successfully');

  // Clear token and redirect to login
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Reset preferences to default
const resetPreferences = async () => {
  const response = await fetch('http://localhost:3000/v1/api/preferences/reset', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to reset preferences');
  }

  const result = await response.json();
  return result.preferences;
};
```

### JavaScript/Fetch Example

```javascript
// Update multiple preferences at once
async function updatePreferences(preferences) {
  const response = await fetch('http://localhost:3000/v1/api/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferences)
  });

  const data = await response.json();
  return data.preferences;
}

// Example: Toggle a single preference
async function toggleEmailNotifications(enabled) {
  return await updatePreferences({
    emailNotifications: enabled
  });
}

// Example: Update multiple preferences
async function updateAllNotifications(enabled) {
  return await updatePreferences({
    emailNotifications: enabled,
    pushNotifications: enabled,
    sessionReminders: enabled,
    weeklyReport: enabled
  });
}
```

---

## Integration with User Profile

The user profile endpoint (`GET /v1/api/users/profile`) now includes preferences in the response:

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "preferences": {
      "emailNotifications": true,
      "pushNotifications": true,
      "sessionReminders": true,
      "weeklyReport": true,
      "studyReminders": true,
      "darkMode": false,
      "language": "en",
      "timezone": "UTC"
    },
    ...
  }
}
```

This allows you to load user preferences along with profile data in a single request.

---

## Supported Languages

- `en` - English (default)
- `es` - Spanish
- `fr` - French
- `de` - German

---

## Common Timezone Values

Examples of valid timezone strings:
- `UTC` (default)
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `Australia/Sydney`

For a complete list, refer to the [IANA Time Zone Database](https://www.iana.org/time-zones).

---

## Error Handling

All endpoints follow consistent error response format:

### Validation Errors (400)
```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "fieldName",
      "message": "Error description"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### Not Found Errors (404)
```json
{
  "error": "User not found"
}
```

### Server Errors (500)
```json
{
  "error": "Failed to update preferences"
}
```

---

## Best Practices

1. **Batch Updates**: When updating multiple preferences, send them all in a single request rather than multiple requests

2. **Error Handling**: Always handle errors gracefully and provide user feedback

3. **Confirmation Dialogs**: Always show confirmation dialogs for destructive actions like deleting an account

4. **Password Validation**: Validate password requirements on the frontend before submitting to reduce unnecessary API calls

5. **State Management**: Store preferences in your application state to avoid unnecessary API calls

6. **Optimistic Updates**: Update the UI immediately when toggling preferences, then sync with the API

7. **Token Management**: Ensure the JWT token is refreshed before making API calls if it's close to expiration

---

## Rate Limiting

All endpoints are subject to the global rate limit:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP address

Preference update endpoints have additional rate limiting:
- **Window**: 1 minute
- **Max Requests**: 10 per user

---

## Notes

1. **Preferences are created automatically** when a user first accesses the preferences endpoint
2. **Partial updates are supported** - only send the fields you want to change
3. **Password changes** do not invalidate existing JWT tokens - consider implementing token refresh after password change
4. **Account deletion** is permanent and cannot be undone
5. **Preferences are not deleted** when resetting - only their values are changed to defaults
6. **Timezone changes** may affect session scheduling and reminder times
