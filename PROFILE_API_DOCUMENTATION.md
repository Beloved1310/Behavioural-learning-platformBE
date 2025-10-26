# User Profile API Documentation

Base URL: `/v1/api/users`

All endpoints require authentication via Bearer token in the Authorization header.

## Table of Contents
1. [Get Profile](#get-profile)
2. [Update Profile](#update-profile)
3. [Upload Profile Image](#upload-profile-image)
4. [Delete Profile Image](#delete-profile-image)
5. [Update Password](#update-password)
6. [Delete Account](#delete-account)

---

## Get Profile

**GET** `/profile`

Retrieve the current user's complete profile information.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v123456/profile-images/user-507f1f77bcf86cd799439011.jpg",
    "phoneNumber": "+44 7700 900123",
    "dateOfBirth": "2005-03-15T00:00:00.000Z",
    "gradeLevel": "10",
    "learningStyle": "visual",
    "academicGoals": ["Improve math grades", "Prepare for exams"],
    "subjects": [],
    "bio": null,
    "qualifications": [],
    "totalPoints": 450,
    "streakCount": 5,
    "subscriptionTier": "PREMIUM",
    "subscriptionStatus": "active",
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
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "lastLoginAt": "2024-01-15T09:00:00.000Z"
  }
}
```

---

## Update Profile

**PUT** `/profile`

Update the current user's profile information.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+44 7700 900123",
  "dateOfBirth": "2005-03-15",
  "gradeLevel": "10",
  "learningStyle": "visual",
  "academicGoals": ["Improve math grades", "Prepare for SAT"],
  "subjects": ["Math", "Science", "English"]
}
```

**Field Descriptions:**

**Common Fields (All Roles):**
- `firstName` (optional): User's first name (string, max 50 chars)
- `lastName` (optional): User's last name (string, max 50 chars)
- `phoneNumber` (optional): Phone number in international format
- `dateOfBirth` (optional): Date of birth (ISO date string)
- `profileImage` (optional): Profile image URL (managed via separate upload endpoint)

**Student-Specific Fields:**
- `gradeLevel` (optional): Student's grade level (string: '6', '7', '8', '9', '10', '11', '12')
- `learningStyle` (optional): Preferred learning style
  - Options: `visual`, `auditory`, `kinesthetic`, `reading_writing`
- `academicGoals` (optional): Array of academic goals or comma-separated string
  - Can be sent as: `["Goal 1", "Goal 2"]` or `"Goal 1, Goal 2"`

**Tutor-Specific Fields:**
- `subjects` (optional): Subjects taught (array or comma-separated string)
- `bio` (optional): Tutor biography (string, max 1000 chars)
- `qualifications` (optional): List of qualifications (array or comma-separated string)

**Validation Rules:**
- At least one field must be provided
- `learningStyle` must be one of: `visual`, `auditory`, `kinesthetic`, `reading_writing`
- Arrays can be sent as actual arrays or comma-separated strings
- Empty strings are allowed for optional fields to clear them

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT",
    "profileImage": "https://res.cloudinary.com/.../profile.jpg",
    "phoneNumber": "+44 7700 900123",
    "dateOfBirth": "2005-03-15T00:00:00.000Z",
    "gradeLevel": "10",
    "learningStyle": "visual",
    "academicGoals": ["Improve math grades", "Prepare for SAT"],
    "subjects": [],
    "bio": null,
    "qualifications": [],
    "totalPoints": 450,
    "streakCount": 5,
    "subscriptionTier": "PREMIUM",
    "subscriptionStatus": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "lastLoginAt": "2024-01-15T09:00:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` - Validation failed
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "At least one field must be provided for update",
    "Learning style must be visual, auditory, kinesthetic, or reading_writing"
  ]
}
```

`404 Not Found` - User not found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found"
}
```

---

## Upload Profile Image

**POST** `/profile/image`

Upload a new profile image. The image is automatically uploaded to Cloudinary with optimizations applied.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
image: [image file]
```

**Image Requirements:**
- **Accepted formats:** JPEG, JPG, PNG, GIF, WebP
- **Maximum size:** 2MB
- **Field name:** `image`

**Automatic Optimizations:**
- Resized to 500x500 pixels (face-centered crop)
- Quality optimization
- Format auto-conversion for best performance
- Stored in Cloudinary with folder: `profile-images/`
- Previous profile image is automatically deleted

**Example using FormData (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/v1/api/users/profile/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Example using cURL:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  https://your-api.com/v1/api/users/profile/image
```

**Response:** `200 OK`
```json
{
  "message": "Profile image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile-images/user-507f1f77bcf86cd799439011.jpg",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile-images/user-507f1f77bcf86cd799439011.jpg"
  }
}
```

**Error Responses:**

`400 Bad Request` - No file provided
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "No image file provided"
}
```

`400 Bad Request` - Invalid file type
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

`400 Bad Request` - File too large
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Image size must be less than 2MB"
}
```

`500 Internal Server Error` - Upload failed
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to upload image to cloud storage"
}
```

---

## Delete Profile Image

**DELETE** `/profile/image`

Delete the current user's profile image from both the database and Cloudinary.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Profile image deleted successfully"
}
```

**Error Responses:**

`400 Bad Request` - No profile image to delete
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "No profile image to delete"
}
```

`404 Not Found` - User not found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found"
}
```

---

## Update Password

**PUT** `/password`

Change the current user's password.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Validation:**
- `currentPassword` (required): Current password
- `newPassword` (required): New password (minimum 8 characters)

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**

`400 Bad Request` - Missing fields
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Current password and new password are required"
}
```

`400 Bad Request` - Password too short
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "New password must be at least 8 characters long"
}
```

`401 Unauthorized` - Incorrect current password
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Current password is incorrect"
}
```

---

## Delete Account

**DELETE** `/account`

Permanently delete the current user's account. This action cannot be undone.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "currentPassword123"
}
```

**Validation:**
- `password` (required): User's current password for confirmation

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

**Error Responses:**

`400 Bad Request` - Password not provided
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Password is required to delete account"
}
```

`401 Unauthorized` - Incorrect password
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Incorrect password"
}
```

---

## Frontend Integration Examples

### Get User Profile
```typescript
const getProfile = async () => {
  const response = await fetch('/v1/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.user;
};
```

### Update Profile
```typescript
const updateProfile = async (profileData: {
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
  learningStyle?: string;
  academicGoals?: string[];
  subjects?: string[];
}) => {
  const response = await fetch('/v1/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  const data = await response.json();
  return data.user;
};
```

### Upload Profile Image
```typescript
const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/v1/api/users/profile/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload image');
  }

  const data = await response.json();
  return data;
};
```

### Complete Upload with Validation
```typescript
const handleFileUpload = async (file: File) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPG, PNG, or GIF)');
  }

  // Validate file size (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 2MB');
  }

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setProfileImagePreview(reader.result as string);
  };
  reader.readAsDataURL(file);

  // Upload to backend
  const result = await uploadProfileImage(file);

  return result;
};
```

---

## Environment Variables

Add these variables to your `.env` file:

```env
# Cloudinary Configuration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Getting Cloudinary Credentials:**
1. Sign up at https://cloudinary.com (free tier available)
2. Go to Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

---

## Image Processing Details

When an image is uploaded, the following transformations are automatically applied:

1. **Resize:** 500x500 pixels with face-detection centering
2. **Crop:** Fill mode ensures the entire area is covered
3. **Quality:** Auto-optimized based on content
4. **Format:** Auto-converted to the most efficient format (WebP where supported)

This ensures:
- Fast loading times
- Consistent sizing across the platform
- Optimal storage usage
- Professional appearance

---

## Security Notes

1. **Authentication Required:** All endpoints require a valid JWT token
2. **File Validation:**
   - File type validation on both frontend and backend
   - File size limits enforced
   - Mime type checking
3. **Old Image Cleanup:** Previous profile images are automatically deleted from Cloudinary
4. **Password Verification:** Sensitive operations (delete account, change password) require password confirmation
5. **HTTPS Only:** In production, all file uploads should use HTTPS

---

## Rate Limiting

All endpoints are subject to the global rate limit:
- **Window:** 15 minutes
- **Max Requests:** 100 per window per IP

Image uploads count as 2 requests due to higher resource usage.

---

## Best Practices

1. **Image Uploads:**
   - Validate file type and size on the frontend before uploading
   - Show upload progress indicator
   - Display preview before uploading
   - Handle errors gracefully with user-friendly messages

2. **Profile Updates:**
   - Only send changed fields to minimize bandwidth
   - Debounce rapid updates
   - Show success/error feedback to users
   - Update local state optimistically for better UX

3. **Error Handling:**
   - Always check response status
   - Parse error messages for user display
   - Provide fallback for missing images
   - Log errors for debugging

4. **Performance:**
   - Cache profile images with appropriate headers
   - Use Cloudinary URL transformations for different sizes
   - Lazy load profile images
   - Compress images before upload when possible
