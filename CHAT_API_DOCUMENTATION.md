# Chat API Documentation

## Overview
This document describes the chat and messaging endpoints for the Behavioral Learning Platform. The chat system supports both HTTP REST API endpoints and real-time Socket.IO communication.

## Base URL
```
/v1/api/chat
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

For Socket.IO connections:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

---

## HTTP REST API Endpoints

### 1. Get User Chats
**GET** `/chats`

Get all chats for the current user with details.

**Response:**
```json
{
  "chats": [
    {
      "id": "string",
      "participants": [
        {
          "id": "string",
          "firstName": "string",
          "lastName": "string",
          "name": "string",
          "profileImage": "string | null",
          "role": "STUDENT" | "TUTOR" | "PARENT" | "ADMIN"
        }
      ],
      "title": "string",
      "lastMessage": {
        "id": "string",
        "senderId": "string",
        "senderName": "string",
        "content": "string",
        "type": "TEXT" | "FILE" | "IMAGE" | "SYSTEM",
        "createdAt": "ISO Date",
        "isRead": boolean
      } | null,
      "unreadCount": number,
      "updatedAt": "ISO Date",
      "createdAt": "ISO Date"
    }
  ]
}
```

**Features:**
- Returns chats sorted by most recent activity
- Includes unread message count for each chat
- Shows last message preview
- Lists all participants with their details

---

### 2. Get or Create Chat
**POST** `/chats`

Get an existing chat or create a new one with another user.

**Request Body:**
```json
{
  "otherUserId": "string"
}
```

**Response:**
```json
{
  "chat": {
    "id": "string",
    "participants": [...],
    "title": "string",
    "lastMessage": {...} | null,
    "unreadCount": number,
    "updatedAt": "ISO Date",
    "createdAt": "ISO Date"
  }
}
```

**Notes:**
- If a chat already exists between the two users, returns existing chat
- If no chat exists, creates a new one
- Validates that the other user exists

---

### 3. Get Chat Messages
**GET** `/chats/:chatId/messages`

Get messages for a specific chat with pagination.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Messages per page

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "chatId": "string",
      "senderId": "string",
      "sender": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "name": "string",
        "profileImage": "string | null",
        "role": "STUDENT" | "TUTOR" | "PARENT" | "ADMIN"
      },
      "type": "TEXT" | "FILE" | "IMAGE" | "SYSTEM",
      "content": "string",
      "fileUrl": "string | null",
      "fileName": "string | null",
      "isRead": boolean,
      "createdAt": "ISO Date"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "totalMessages": number,
    "totalPages": number,
    "hasMore": boolean
  }
}
```

**Notes:**
- Messages are returned in chronological order (oldest first)
- Only participants of the chat can access messages
- Supports pagination for efficient loading

---

### 4. Send Message (HTTP)
**POST** `/chats/:chatId/messages`

Send a message via HTTP (alternative to Socket.IO).

**Request Body:**
```json
{
  "content": "string",
  "type": "TEXT" | "FILE" | "IMAGE" | "SYSTEM",
  "fileUrl": "string (optional)",
  "fileName": "string (optional)"
}
```

**Response:**
```json
{
  "message": {
    "id": "string",
    "chatId": "string",
    "senderId": "string",
    "sender": {...},
    "type": "TEXT",
    "content": "string",
    "fileUrl": "string | null",
    "fileName": "string | null",
    "isRead": false,
    "createdAt": "ISO Date"
  }
}
```

**Notes:**
- For real-time messaging, use Socket.IO instead
- Automatically updates chat's `updatedAt` timestamp
- Only participants can send messages

---

### 5. Mark Messages as Read
**PUT** `/chats/:chatId/read`

Mark all unread messages in a chat as read.

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

**Notes:**
- Marks all messages from other participants as read
- Does not affect messages sent by the current user

---

### 6. Delete Chat
**DELETE** `/chats/:chatId`

Delete a chat and all its messages.

**Response:**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

**Notes:**
- Deletes all messages in the chat
- Permanently removes the chat
- Only participants can delete the chat

---

### 7. Get Unread Count
**GET** `/unread-count`

Get total unread message count across all chats.

**Response:**
```json
{
  "unreadCount": number
}
```

**Notes:**
- Useful for displaying notification badges
- Counts all unread messages from all chats

---

### 8. Search Users
**GET** `/users/search`

Search for users to start a chat with.

**Query Parameters:**
- `query` (required, min: 2 characters): Search term

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "name": "string",
      "email": "string",
      "profileImage": "string | null",
      "role": "STUDENT" | "TUTOR" | "PARENT" | "ADMIN"
    }
  ]
}
```

**Notes:**
- Searches firstName, lastName, and email
- Returns max 20 results
- Excludes current user from results
- Case-insensitive search

---

## Socket.IO Real-Time Events

### Client Events (emit from frontend)

#### 1. join_chat
Join a chat room to receive real-time messages.

```javascript
socket.emit('join_chat', chatId);
```

**Notes:**
- Must be a participant in the chat
- Automatically subscribes to chat events

---

#### 2. leave_chat
Leave a chat room.

```javascript
socket.emit('leave_chat', chatId);
```

---

#### 3. send_message
Send a real-time message.

```javascript
socket.emit('send_message', {
  chatId: 'string',
  content: 'string',
  type: 'TEXT' | 'FILE' | 'IMAGE',
  fileUrl: 'string (optional)',
  fileName: 'string (optional)'
});
```

**Response:**
- Message is broadcast to all participants via `new_message` event
- Saved to database automatically

---

#### 4. typing_start
Indicate that user is typing.

```javascript
socket.emit('typing_start', chatId);
```

**Response:**
- Other participants receive `user_typing` event

---

#### 5. typing_stop
Indicate that user stopped typing.

```javascript
socket.emit('typing_stop', chatId);
```

**Response:**
- Other participants receive `user_stop_typing` event

---

#### 6. update_status
Update online status.

```javascript
socket.emit('update_status', 'online' | 'away' | 'offline');
```

**Response:**
- All connected users receive `user_online_status` event

---

#### 7. mark_messages_read
Mark messages as read in real-time.

```javascript
socket.emit('mark_messages_read', { chatId: 'string' });
```

**Response:**
- Other participants receive `messages_read` event

---

### Server Events (listen on frontend)

#### 1. new_message
Receive new messages in real-time.

```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // message has same structure as HTTP message response
});
```

---

#### 2. user_typing
User started typing.

```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // data: { userId: string, chatId: string }
});
```

---

#### 3. user_stop_typing
User stopped typing.

```javascript
socket.on('user_stop_typing', (data) => {
  console.log('User stopped typing:', data);
  // data: { userId: string, chatId: string }
});
```

---

#### 4. user_online_status
User online status changed.

```javascript
socket.on('user_online_status', (data) => {
  console.log('Status update:', data);
  // data: { userId: string, status: 'online' | 'away' | 'offline', lastSeen: ISO Date }
});
```

---

#### 5. messages_read
Messages were read by another participant.

```javascript
socket.on('messages_read', (data) => {
  console.log('Messages read:', data);
  // data: { chatId: string, userId: string }
});
```

---

#### 6. error
Socket error occurred.

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // error: { message: string }
});
```

---

## Frontend Integration

### Example: Initialize Chat

```typescript
import { io } from 'socket.io-client';

// Initialize Socket.IO connection
const socket = io('http://localhost:3000', {
  auth: {
    token: yourAuthToken
  }
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to chat');

  // Update status to online
  socket.emit('update_status', 'online');
});

// Listen for messages
socket.on('new_message', (message) => {
  // Update your chat store
  addMessageToChat(message);
});

// Listen for online status
socket.on('user_online_status', (status) => {
  updateUserStatus(status);
});
```

---

### Example: Join Chat and Send Message

```typescript
// Join a specific chat
socket.emit('join_chat', chatId);

// Send a message
socket.emit('send_message', {
  chatId: chatId,
  content: 'Hello!',
  type: 'TEXT'
});

// Show typing indicator
const handleTyping = () => {
  socket.emit('typing_start', chatId);

  // Stop after 3 seconds of no typing
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', chatId);
  }, 3000);
};
```

---

### Example: Fetch Chat Messages

```typescript
// Fetch initial messages
const response = await fetch(`/v1/api/chat/chats/${chatId}/messages?page=1&limit=50`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { messages, pagination } = await response.json();

// Load more messages (pagination)
if (pagination.hasMore) {
  const nextPage = await fetch(`/v1/api/chat/chats/${chatId}/messages?page=${pagination.page + 1}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

---

### Example: Mark Messages as Read

```typescript
// Via HTTP
await fetch(`/v1/api/chat/chats/${chatId}/read`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Via Socket.IO (real-time)
socket.emit('mark_messages_read', { chatId });
```

---

## Online Status Tracking

The system automatically tracks user online status:

- **online**: User is actively connected and viewing chat
- **away**: User is connected but inactive (tab hidden)
- **offline**: User is disconnected

Status updates are broadcast to all connected users in real-time.

---

## Message Types

### TEXT
Regular text message.
```json
{
  "type": "TEXT",
  "content": "Hello world!"
}
```

### FILE
File attachment with URL.
```json
{
  "type": "FILE",
  "content": "File description",
  "fileUrl": "https://...",
  "fileName": "document.pdf"
}
```

### IMAGE
Image attachment.
```json
{
  "type": "IMAGE",
  "content": "Image description",
  "fileUrl": "https://...",
  "fileName": "photo.jpg"
}
```

### SYSTEM
System-generated message.
```json
{
  "type": "SYSTEM",
  "content": "User joined the chat"
}
```

---

## Error Handling

All HTTP endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**404 Not Found:**
```json
{
  "error": "Chat not found or access denied"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch chats"
}
```

Socket.IO errors are emitted via the `error` event.

---

## Best Practices

1. **Connection Management**
   - Connect to Socket.IO when user opens chat
   - Disconnect when user leaves chat page
   - Handle reconnection automatically

2. **Status Updates**
   - Update status to 'online' on page focus
   - Update to 'away' on page blur
   - Update to 'offline' on disconnect

3. **Message Loading**
   - Load initial messages via HTTP
   - Use Socket.IO for new messages
   - Implement infinite scroll for history

4. **Read Receipts**
   - Mark messages as read when chat is viewed
   - Use Socket.IO for real-time read receipts
   - Update UI immediately on receipt

5. **Typing Indicators**
   - Debounce typing events (send max every 3s)
   - Clear typing after 3s of no input
   - Only show for current chat

---

## Testing

### Test Socket.IO Connection
```bash
# Install socket.io-client for testing
npm install -g socket.io-client

# Test connection
node
> const io = require('socket.io-client');
> const socket = io('http://localhost:3000', { auth: { token: 'YOUR_TOKEN' } });
> socket.on('connect', () => console.log('Connected'));
```

### Test HTTP Endpoints
```bash
# Get all chats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/chat/chats

# Get chat messages
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/v1/api/chat/chats/CHAT_ID/messages

# Send message
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!", "type": "TEXT"}' \
  http://localhost:3000/v1/api/chat/chats/CHAT_ID/messages

# Search users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/v1/api/chat/users/search?query=john"
```

---

## Database Models

### Chat Model
- `participants`: Array of User IDs
- `title`: Optional chat title (for group chats)
- `createdAt`: Chat creation timestamp
- `updatedAt`: Last message timestamp

### Message Model
- `chatId`: Reference to Chat
- `senderId`: Reference to User
- `type`: Message type (TEXT, FILE, IMAGE, SYSTEM)
- `content`: Message content
- `fileUrl`: Optional file URL
- `fileName`: Optional file name
- `isRead`: Read status
- `createdAt`: Message timestamp

---

## Next Steps

To integrate chat into your frontend:

1. **Install Socket.IO Client**
   ```bash
   npm install socket.io-client
   ```

2. **Create Socket Service**
   ```typescript
   // services/socket.ts
   import { io } from 'socket.io-client';

   export const socket = io(API_URL, {
     auth: { token: getAuthToken() }
   });
   ```

3. **Update Chat Store**
   - Connect to Socket.IO in store
   - Listen for real-time events
   - Update state accordingly

4. **Handle Connection Lifecycle**
   - Connect on mount
   - Disconnect on unmount
   - Handle reconnection

The complete implementation is now ready on the backend!
