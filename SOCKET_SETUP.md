# Socket.IO Integration Setup

## Environment Configuration

Tạo file `.env.local` trong thư mục `room-metting/`:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# API Server Configuration  
VITE_API_URL=https://20ac-2001-ee0-4b49-c580-797e-6c58-d5d7-bc67.ngrok-free.app

# Development
# VITE_API_URL=http://localhost:3001

# Production với ngrok
# VITE_API_URL=https://your-ngrok-url.ngrok-free.app
```

## Socket.IO Events

### Client Events (Gửi từ React app):

1. **user-join** - Khi user đăng nhập thành công
```javascript
socket.emit('user-join', {
  id: user.id,
  email: user.email,
  name: user.name,
  picture: user.picture,
  joinTime: new Date().toISOString()
});
```

2. **user-leave** - Khi user logout
```javascript
socket.emit('user-leave', { userId: user.id });
```

3. **create-meeting** - Khi user tạo meeting mới
```javascript
socket.emit('create-meeting', {
  creatorId: user.id,
  creatorName: user.name
});
```

4. **join-meeting** - Khi user tham gia meeting
```javascript
socket.emit('join-meeting', {
  meetingCode: meetingCode.trim(),
  userId: user.id
});
```

### Server Events (Nhận từ Node.js server):

1. **connect** - Khi kết nối thành công
2. **disconnect** - Khi mất kết nối
3. **connect_error** - Lỗi kết nối
4. **join-error** - Lỗi khi join

5. **online-users-list** - Danh sách users online
```javascript
socket.on('online-users-list', (data) => {
  // data.users: Array of User objects
});
```

6. **user-joined** - Có user mới join
```javascript
socket.on('user-joined', (data) => {
  // data.user: User object
});
```

7. **user-left** - Có user rời khỏi
```javascript
socket.on('user-left', (data) => {
  // data.userId: string
});
```

8. **user-status-change** - User thay đổi trạng thái
```javascript
socket.on('user-status-change', (data) => {
  // data.userId: string
  // data.status: string
});
```

9. **meeting-created** - Meeting được tạo thành công
10. **meeting-joined** - Join meeting thành công

## Features Implemented

### ✅ Hoàn thành:
- Socket.IO client integration
- Real-time user presence
- Online users display  
- Connection status indicator
- Error handling và reconnection
- Meeting events (create/join)
- User management (join/leave)

### 📋 Cần server hỗ trợ:
- Socket.IO server endpoints
- User session management
- Meeting room management
- Real-time messaging
- Video call signaling

## Usage

1. User đăng nhập → Gửi user info qua API + Socket
2. Dashboard hiển thị:
   - Connection status
   - Online users count
   - Real-time user list
3. Meeting room hiển thị:
   - Real participants thay vì dummy data
   - Connection indicators
   - Online user count

## Server Requirements

Server Node.js cần implement:

```javascript
// Basic Socket.IO server structure
io.on('connection', (socket) => {
  socket.on('user-join', (userData) => {
    // Add user to online list
    // Broadcast to all clients
  });
  
  socket.on('user-leave', (data) => {
    // Remove user from online list  
    // Broadcast to all clients
  });
  
  // Handle meeting events
  socket.on('create-meeting', (data) => {
    // Create meeting room
  });
  
  socket.on('join-meeting', (data) => {
    // Add user to meeting room
  });
});
``` 