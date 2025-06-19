# Share System Documentation

## Overview
The Share System allows users to share meeting rooms via generated links or email invitations, with each room having its own unique URL for easy access.

## Features

### 1. Room URL Routing
- **Room URL Pattern**: `/room/{roomCode}`
- **Share URL Pattern**: `/room/{roomCode}?share={shareToken}`
- Each room has a unique 6-character code
- Share links include tracking tokens for analytics

### 2. Share Link Generation
```typescript
const shareLink = await generateShareLink({
  expiryHours: 24,
  maxUses: 50,
  title: "Join Meeting Room",
  description: "You're invited to join our meeting"
})
```

**Generated URL Structure:**
- Base URL: `https://yourapp.com/room/ABC123`
- Share URL: `https://yourapp.com/room/ABC123?share=xyz789token`

### 3. Social Media Sharing
Supports sharing to:
- **WhatsApp**: Direct message with room link
- **Twitter**: Tweet with room title and link
- **Facebook**: Facebook post sharing
- **Email**: Pre-filled email with room details

### 4. Email Invitations
- Send direct email invitations to specific users
- Custom personal messages
- Automatic room link inclusion
- Invitation tracking (pending/accepted/declined)

### 5. Analytics & Statistics
Track sharing performance:
- **Views**: How many times share link was viewed
- **Clicks**: How many times share link was clicked
- **Joins**: How many users actually joined the room
- **Active Links**: Number of currently active share links

## Component Architecture

### Files Created/Modified

#### New Files:
- `src/hooks/useShareSystem.ts` - Share functionality hook
- `src/components/ShareModal.tsx` - Share UI component
- `src/pages/RoomPage.tsx` - Room URL handler
- `SHARE_SYSTEM.md` - This documentation

#### Modified Files:
- `src/App.tsx` - Added room routing
- `src/pages/Login.tsx` - Added routing support and persistence
- `src/components/MeetingDashboard.tsx` - Added share functionality
- `src/utils/roomStorage.ts` - Already had member management

## URL Routing System

### Route Configuration
```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/room/:roomCode" element={<RoomPage />} />
</Routes>
```

### Room Access Flow
1. **Direct URL Access**: User visits `/room/ABC123`
2. **Room Validation**: Check if room exists in storage
3. **Authentication**: Require Google login if not authenticated
4. **Auto-Join**: Add user to room members
5. **Share Tracking**: Track views/joins if coming from share link

### Navigation Functions
```typescript
// Navigate to room from dashboard
const handleJoinMeeting = (roomData) => {
  if (roomData.roomCode) {
    navigate(`/room/${roomData.roomCode}`)
  }
}

// Handle room sharing
const handleShareRoom = (room) => {
  setSelectedRoomForShare(room)
  setShareModalOpen(true)
}
```

## Share System Hook (useShareSystem)

### Hook Usage
```typescript
const {
  shareLinks,
  shareStats,
  loading,
  generateShareLink,
  createInvitation,
  getSocialShareData,
  deactivateShareLink
} = useShareSystem(roomId, userId)
```

### Key Functions

#### Generate Share Link
```typescript
const newLink = await generateShareLink({
  expiryHours: 24,
  maxUses: 50,
  title: `Join ${room.roomName}`,
  description: `${user.name} invited you to join the meeting`
})
```

#### Create Email Invitation
```typescript
await createInvitation(
  "friend@example.com",
  "Join us for our weekly meeting!"
)
```

#### Get Social Share URLs
```typescript
const socialData = await getSocialShareData(shareToken, "whatsapp")
// Returns: { whatsappUrl, twitterUrl, facebookUrl, emailUrl }
```

## ShareModal Component

### Features
- **Three Tabs**: Share Link, Email Invite, Statistics
- **Link Generation**: Create shareable links with options
- **Social Sharing**: Quick share to social platforms
- **Email Invites**: Send personalized invitations
- **Analytics**: View sharing statistics and link performance
- **Link Management**: Deactivate or copy existing links

### Props Interface
```typescript
interface ShareModalProps {
  room: any           // Room object to share
  user: User          // Current user sharing the room
  isOpen: boolean     // Modal visibility state
  onClose: () => void // Close modal callback
}
```

### Usage
```typescript
<ShareModal
  room={selectedRoom}
  user={currentUser}
  isOpen={shareModalOpen}
  onClose={() => setShareModalOpen(false)}
/>
```

## RoomPage Component

### Responsibilities
- Handle direct room URL access
- Validate room existence
- Manage user authentication for room access
- Track share link analytics
- Provide seamless room joining experience

### URL Parameters
- `roomCode`: 6-character room identifier
- `share`: Optional share token for tracking

### Authentication Flow
1. Check if user is already logged in (localStorage)
2. If not authenticated, show Google login
3. After login, automatically join room
4. Track join if coming from share link

## Data Persistence

### localStorage Keys
- `currentUser`: Persisted user session
- `shareLinks_{roomId}`: Share links per room
- `invitations_{roomId}`: Invitations per room
- `demo_rooms`: All room data (existing)

### Share Link Storage Structure
```typescript
interface ShareLink {
  shareToken: string
  shareUrl: string
  title: string
  description: string
  views: number
  clicks: number
  joins: number
  expiryHours: number
  maxUses: number
  isActive: boolean
  createdAt: string
}
```

## Demo Mode Features

### Mock API Behavior
- Simulates server API calls with delays
- Stores data in localStorage
- Generates realistic share URLs
- Provides feedback for all operations

### Development Testing
- Share links work in development environment
- Analytics tracking simulated
- Email invitations logged to console
- Social sharing opens real platform URLs

## Security Considerations

### Share Link Security
- Share tokens are randomly generated
- Links can be deactivated/expired
- Maximum usage limits configurable
- Time-based expiration supported

### Room Access Control
- Private rooms require password validation
- Member management with add/remove capabilities
- Authentication required for all room access
- Session persistence for user convenience

## Usage Examples

### Sharing a Room
```typescript
// 1. User clicks "Share" button on room
handleShareRoom(room)

// 2. ShareModal opens with room data
<ShareModal room={room} user={user} isOpen={true} />

// 3. User generates share link
const link = await generateShareLink(options)

// 4. Share link: https://app.com/room/ABC123?share=xyz789
```

### Joining via Share Link
```typescript
// 1. Recipient clicks share link
// URL: https://app.com/room/ABC123?share=xyz789

// 2. RoomPage component loads
<Route path="/room/:roomCode" element={<RoomPage />} />

// 3. Authentication if needed
// 4. Track analytics (view, join)
// 5. Auto-join room
```

### Social Media Sharing
```typescript
// Generate social share URLs
const socialData = await getSocialShareData(shareToken, "whatsapp")

// Open WhatsApp with pre-filled message
window.open(socialData.whatsappUrl, '_blank')
```

## Integration Points

### With Existing System
- **Room Storage**: Uses existing `roomStorage` utility
- **User Authentication**: Integrates with Google OAuth
- **Socket.IO**: Compatible with real-time features
- **UI Components**: Uses existing design system

### Future Enhancements
- **Server Integration**: Replace mock APIs with real backend
- **Advanced Analytics**: Detailed tracking and reporting
- **Custom Domains**: Branded share URLs
- **Bulk Invitations**: Invite multiple users at once
- **Calendar Integration**: Schedule and share meetings

## Testing

### Test Scenarios
1. **Create and share room**: Generate link, verify URL format
2. **Join via share link**: Access room through shared URL
3. **Social sharing**: Test platform integration
4. **Analytics tracking**: Verify view/click/join counting
5. **Email invitations**: Test invitation creation
6. **Link management**: Deactivate and reactivate links
7. **Authentication flow**: Test login requirement for rooms
8. **URL routing**: Test direct room access and navigation

### Demo Mode Testing
- All functionality works without server
- Data persists in localStorage
- Realistic user experience
- Easy debugging with storage panel

## Conclusion

The Share System provides a comprehensive solution for room sharing with:
- ✅ Unique URLs for each room
- ✅ Advanced sharing options (link + email)
- ✅ Social media integration
- ✅ Analytics and tracking
- ✅ Secure access control
- ✅ Seamless user experience
- ✅ Demo mode compatibility

The system is designed to be both functional in demo mode and ready for production with minimal backend integration required. 