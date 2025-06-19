import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import MeetingRoom from "../components/MeetingRoom"
import { roomService, userService } from "../services/api"
import { useSocket } from "../hooks/useSocket"
import type { User } from "../types/user"

interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shareToken = searchParams.get('share')
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  
  // Meeting controls
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [showChat, setShowChat] = useState(false)

  // Socket connection
  const { socket, isConnected } = useSocket(currentUser)

  // Google Client ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    loadRoomAndUser()
  }, [roomCode])

  const loadRoomAndUser = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if user is already logged in (from localStorage or sessionStorage)
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
      }

      // Find room by code from server
      if (roomCode) {
        console.log(`🔍 Looking for room via server API: ${roomCode}`)
        
        try {
          // Get room info from server
          const room = await roomService.getRoomInfo(roomCode)
          console.log('✅ Room found on server:', room)
          
          setCurrentRoom(room)
          
          // If share token exists, track view
          if (shareToken) {
            console.log(`Tracking view for share token: ${shareToken}`)
            // In real app, would call API to track view
          }
          
          // If user exists, join room
          if (savedUser) {
            const user = JSON.parse(savedUser)
            try {
              // Join room via server API
              await roomService.joinRoom(user, roomCode)
              console.log('✅ User automatically joined room')
            } catch (joinError) {
              console.warn('Failed to auto-join room:', joinError)
              // Continue anyway, user can manually join
            }
          } else {
            // Need authentication to join room
            setNeedsAuth(true)
          }
          
        } catch (error: any) {
          console.error('❌ Failed to get room from server:', error)
          setError(`Room "${roomCode}" not found. The room may have been deleted or the code is incorrect.`)
        }
      }
    } catch (error) {
      console.error('Error loading room:', error)
      setError('Failed to load room')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      const decoded = jwtDecode<GoogleUser>(credentialResponse.credential!)
      const user: User = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        id: decoded.sub
      }

      // Save user for persistence
      localStorage.setItem('currentUser', JSON.stringify(user))
      setCurrentUser(user)

      // Send user info to server
      try {
        await userService.sendUserInfo(user)
      } catch (error) {
        console.error('Failed to send user info to server:', error)
      }

      // Join room if room exists
      if (currentRoom && roomCode) {
        try {
          await roomService.joinRoom(user, roomCode)
          console.log('✅ User joined room after login')
          
          // Track join if coming from share link
          if (shareToken) {
            console.log(`Tracking join for share token: ${shareToken}`)
            // In real app, would call API to track join
          }
        } catch (joinError) {
          console.warn('Failed to join room after login:', joinError)
        }
      }

      setNeedsAuth(false)
    } catch (error) {
      console.error("Error during login:", error)
      setError('Login failed')
    }
  }

  const handleGoogleError = () => {
    console.log('Google Login Failed')
    setError('Google login failed')
  }

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await userService.sendLogout(currentUser.id)
        
        // Leave room
        if (roomCode && currentUser) {
          try {
            await roomService.leaveRoom(currentUser, roomCode)
            console.log('✅ User left room during logout')
          } catch (leaveError) {
            console.warn('Failed to leave room during logout:', leaveError)
          }
        }
      }
    } catch (error) {
      console.error('Failed to send logout to server:', error)
    } finally {
      localStorage.removeItem('currentUser')
      setCurrentUser(null)
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Room Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleBackToDashboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/?create=true')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Create New Room
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (needsAuth || !currentUser) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="max-w-md w-full mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Join {currentRoom?.roomName || 'Room'}
              </h1>
              <p className="text-gray-600">
                Please sign in to join the meeting room
              </p>
              {shareToken && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    You've been invited to join this room
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
              
              <div className="text-center">
                <button
                  onClick={handleBackToDashboard}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    )
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Room not found</p>
          <button
            onClick={handleBackToDashboard}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <MeetingRoom
      onBack={handleBackToDashboard}
      onLogout={handleLogout}
      user={currentUser}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      isVideoOn={isVideoOn}
      setIsVideoOn={setIsVideoOn}
      showChat={showChat}
      setShowChat={setShowChat}
      socket={socket}
      isConnected={isConnected}
      currentRoom={currentRoom}
    />
  )
} 