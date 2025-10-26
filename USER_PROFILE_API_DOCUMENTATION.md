# User Profile API Documentation

## Base URL
`/v1/api/users`

All endpoints require authentication via Bearer token in the Authorization header.

---

## Endpoints

### 1. Get Current User Profile

**GET** `/profile`

Retrieves the authenticated user's profile information.

#### Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "profileImage": "https://example.com/image.jpg",
    "phoneNumber": "+447911123456",
    "dateOfBirth": "2005-03-15T00:00:00.000Z",
    "gradeLevel": "Year 11",
    "learningStyle": "visual",
    "academicGoals": [
      "Improve math grades",
      "Prepare for GCSE exams"
    ],
    "subjects": [],
    "bio": null,
    "qualifications": [],
    "totalPoints": 1250,
    "streakCount": 7,
    "subscriptionTier": "PREMIUM",
    "subscriptionStatus": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-20T14:22:00.000Z",
    "lastLoginAt": "2024-03-20T14:22:00.000Z"
  }
}
```

#### Error Responses
- **401 Unauthorized**: No token or invalid token
- **404 Not Found**: User not found

---

### 2. Update User Profile

**PUT** `/profile`

Updates the authenticated user's profile information. Only provided fields will be updated.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+447911123456",
  "dateOfBirth": "2005-03-15",
  "profileImage": "https://example.com/new-image.jpg",
  "gradeLevel": "Year 11",
  "learningStyle": "visual",
  "academicGoals": [
    "Improve math grades",
    "Prepare for GCSE exams",
    "Learn programming"
  ]
}
```

**Or** (alternative format for arrays as comma-separated strings):
```json
{
  "firstName": "John",
  "academicGoals": "Improve math grades, Prepare for GCSE exams, Learn programming"
}
```

#### Field Descriptions

**Common Fields (All Roles):**
- `firstName` (string, optional): 2-50 characters, letters/spaces/hyphens/apostrophes only
- `lastName` (string, optional): 2-50 characters, letters/spaces/hyphens/apostrophes only
- `phoneNumber` (string, optional): UK phone number format
- `dateOfBirth` (string, optional): ISO date format (YYYY-MM-DD)
- `profileImage` (string, optional): Valid URL or empty string

**Student-Specific Fields:**
- `gradeLevel` (string, optional): One of: "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"
- `learningStyle` (string, optional): One of: "visual", "auditory", "kinesthetic", "reading_writing"
- `academicGoals` (array of strings OR comma-separated string, optional): Maximum 5 goals, each max 100 characters

**Tutor-Specific Fields:**
- `subjects` (array of strings OR comma-separated string, optional): Valid subjects (Mathematics, English, Science, etc.), 1-10 subjects
- `bio` (string, optional): Maximum 1000 characters
- `qualifications` (array of strings OR comma-separated string, optional): Maximum 10 qualifications, each max 200 characters

#### Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "profileImage": "https://example.com/new-image.jpg",
    "phoneNumber": "+447911123456",
    "dateOfBirth": "2005-03-15T00:00:00.000Z",
    "gradeLevel": "Year 11",
    "learningStyle": "visual",
    "academicGoals": [
      "Improve math grades",
      "Prepare for GCSE exams",
      "Learn programming"
    ],
    "subjects": [],
    "bio": null,
    "qualifications": [],
    "totalPoints": 1250,
    "streakCount": 7,
    "subscriptionTier": "PREMIUM",
    "subscriptionStatus": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-20T15:30:00.000Z",
    "lastLoginAt": "2024-03-20T14:22:00.000Z"
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
        "field": "gradeLevel",
        "message": "Grade level must be a valid UK school year"
      }
    ]
  }
  ```
- **401 Unauthorized**: No token or invalid token
- **404 Not Found**: User not found

---

### 3. Update Password

**PUT** `/password`

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

### 4. Delete Account

**DELETE** `/account`

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
  ```json
  {
    "error": "Validation Error",
    "details": [
      {
        "field": "password",
        "message": "Password is required to delete account"
      }
    ]
  }
  ```
- **401 Unauthorized**: Incorrect password or no/invalid token
  ```json
  {
    "error": "Incorrect password"
  }
  ```
- **404 Not Found**: User not found

---

## Example Usage

### JavaScript/TypeScript (with fetch)

```javascript
// Get profile
async function getProfile() {
  const response = await fetch('http://localhost:3000/v1/api/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  return data.user;
}

// Update profile
async function updateProfile(profileData) {
  const response = await fetch('http://localhost:3000/v1/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();
  return data.user;
}

// Update password
async function updatePassword(currentPassword, newPassword) {
  const response = await fetch('http://localhost:3000/v1/api/users/password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await response.json();
  return data;
}

// Delete account
async function deleteAccount(password) {
  const response = await fetch('http://localhost:3000/v1/api/users/account', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  const data = await response.json();
  return data;
}
```

### React Example (matching your Profile component)

```typescript
import { useState, useEffect } from 'react';

const Profile = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gradeLevel: '',
    learningStyle: '',
    subjects: '',
    academicGoals: ''
  });

  useEffect(() => {
    // Load profile
    fetch('http://localhost:3000/v1/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          gradeLevel: data.user.gradeLevel || '',
          learningStyle: data.user.learningStyle || '',
          subjects: data.user.subjects?.join(', ') || '',
          academicGoals: data.user.academicGoals?.join(', ') || ''
        });
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:3000/v1/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const data = await response.json();
      alert('Profile updated successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

---

## Valid Values

### Grade Levels (UK School Years)
- Year 7
- Year 8
- Year 9
- Year 10
- Year 11
- Year 12
- Year 13

### Learning Styles
- visual
- auditory
- kinesthetic
- reading_writing

### Subjects
- Mathematics
- English
- Science
- Physics
- Chemistry
- Biology
- History
- Geography
- Computer Science
- Art
- Music
- Spanish
- French
- German

---

## Notes

1. **Email cannot be changed** through the profile update endpoint
2. **Role-specific fields**: Students can only update student fields (gradeLevel, learningStyle, academicGoals), tutors can only update tutor fields (subjects, bio, qualifications)
3. **Array handling**: Arrays can be sent as actual arrays or as comma-separated strings. The backend will parse both formats correctly
4. **Partial updates**: You only need to send the fields you want to update, not the entire profile
5. **Authentication**: All endpoints require a valid JWT token in the Authorization header
6. **Rate limiting**: All endpoints are subject to the global rate limit (check main API documentation)
