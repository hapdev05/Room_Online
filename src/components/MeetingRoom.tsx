import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Phone,
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  Clock,
  Shield,
  ArrowLeft,
  Hash,

} from "lucide-react"
import { useRoomSocket } from "../hooks/useRoomSocket"
// import { useWebRTC } from "../hooks/useWebRTC"  // simple-peer version
import { useNativeWebRTC as useWebRTC } from "../hooks/useNativeWebRTC"  // native WebRTC version
import { VideoGrid, VideoControls } from "./VideoCall"
import type { Socket } from "socket.io-client"

interface User {
  email: string
  name: string
  picture?: string
  id: string
}

interface MeetingRoomProps {
  onBack: () => void
  onLogout: () => void
  user: User
  isMuted: boolean
  setIsMuted: (value: boolean) => void
  isVideoOn: boolean
  setIsVideoOn: (value: boolean) => void
  showChat: boolean
  setShowChat: (value: boolean) => void
  socket: Socket | null
  isConnected: boolean
  currentRoom: any
}

export default function MeetingRoom({
  onBack,
  onLogout,
  user,
  isMuted,
  setIsMuted,
  isVideoOn,
  setIsVideoOn,
  showChat,
  setShowChat,
  currentRoom,
}: MeetingRoomProps) {
  // Enhanced room socket for real-time room features
  const { 
    roomMessages, 
    roomMembers, 
    roomData,
    memberCount,
    isConnected: roomConnected, 
    systemMessages,
    sendMessage,
    startTyping,
    stopTyping,
    refreshMembers,
    forceRefreshRoom,
    socket: roomSocket
  } = useRoomSocket(user, currentRoom?.roomCode || currentRoom?.id || null)

  // WebRTC for real video calling
  const {
    localStream,
    remoteStreams,
    peerConnections,
    isInitialized,
    error: webRTCError,
    initializeMedia,
    toggleVideo: webRTCToggleVideo,
    toggleAudio: webRTCToggleAudio,
    shareScreen,
    stopScreenShare,
    isScreenSharing,
    setError
  } = useWebRTC({
    socket: roomSocket,
    user: user,
    roomId: currentRoom?.roomCode || currentRoom?.id || null,
    isVideoEnabled: isVideoOn,
    isAudioEnabled: !isMuted
  })

  // State for WebRTC initialization
  const [isWebRTCStarted, setIsWebRTCStarted] = useState(false)

  const roomName = currentRoom?.roomName || "Cuộc họp"
  const roomCode = currentRoom?.roomCode || "UNKNOWN"

  // Enhanced debug logs to track component updates
  useEffect(() => {
    console.log('🎭 MeetingRoom: roomMembers updated!');
    console.log('🎭 roomMembers.length:', roomMembers.length);
    console.log('🎭 roomMembers array:', roomMembers);
    console.log('🎭 Members list:', roomMembers.map(m => `${m.userName} (${m.role}) - ${m.userId}`));
    console.log('🎭 Other members (not current user):', roomMembers.filter(m => m.userId !== user.id));
  }, [roomMembers]);
  
  useEffect(() => {
    console.log('📊 MeetingRoom: memberCount updated:', memberCount);
  }, [memberCount]);
  
  useEffect(() => {
    console.log('🏠 MeetingRoom: roomData updated:', roomData);
  }, [roomData]);

  // Sync WebRTC toggles with existing state
  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    webRTCToggleVideo();
  };

  const handleToggleAudio = () => {
    setIsMuted(!isMuted);
    webRTCToggleAudio();
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      shareScreen();
    }
  };

  // Initialize WebRTC when room is connected
  useEffect(() => {
    if (roomConnected && !isWebRTCStarted && user) {
      console.log('🎥 Initializing WebRTC...');
      initializeMedia();
      setIsWebRTCStarted(true);
    }
  }, [roomConnected, isWebRTCStarted, user, initializeMedia]);

  // Chat input component
  const ChatInput = ({ onSendMessage, onStartTyping, onStopTyping, disabled }: {
    onSendMessage: (message: string) => void
    onStartTyping: () => void
    onStopTyping: () => void
    disabled: boolean
  }) => {
    const [message, setMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)

    const handleSend = () => {
      if (message.trim() && !disabled) {
        onSendMessage(message.trim())
        setMessage("")
        if (isTyping) {
          onStopTyping()
          setIsTyping(false)
        }
      }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value)
      
      if (e.target.value.length > 0 && !isTyping && !disabled) {
        onStartTyping()
        setIsTyping(true)
      } else if (e.target.value.length === 0 && isTyping) {
        onStopTyping()
        setIsTyping(false)
      }
    }

    return (
      <div className="flex gap-2">
        <Input 
          placeholder="Gửi tin nhắn tới mọi người" 
          className="bg-gray-700 border-gray-600 flex-1" 
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        <Button 
          onClick={handleSend} 
          disabled={!message.trim() || disabled}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Gửi
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold">Meet</span>
          </div>
          <div className="text-sm text-gray-300">
            {roomName} • 
            <span className="text-green-400 ml-1">Đang diễn ra</span>
            {roomCode !== "UNKNOWN" && (
              <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {roomCode}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-gray-700">
            <Clock className="w-3 h-3 mr-1" />
            45:23
          </Badge>
          <Badge variant="secondary" className="bg-gray-700">
            <Shield className="w-3 h-3 mr-1" />
            An toàn
          </Badge>

          <div className="text-right">
            <div className="text-sm text-gray-300">{user.name}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-80px)]">
        {/* Main Video Area with WebRTC */}
        <div className="flex-1 p-4">
          {isInitialized ? (
            <VideoGrid
              localStream={localStream}
              remoteStreams={remoteStreams}
              peerConnections={peerConnections}
              currentUser={{
                id: user.id,
                name: user.name,
                picture: user.picture
              }}
              isVideoEnabled={isVideoOn}
              isAudioEnabled={!isMuted}
              isScreenSharing={isScreenSharing}
            />
          ) : (
            /* Loading/Initialization State with Enhanced Error Handling */
            <div className="h-full flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
              {!isWebRTCStarted ? (
                <>
                  <Video className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to start video call?</h3>
                  <p className="text-gray-400 mb-6 text-center max-w-md">
                    We'll need access to your camera and microphone to start the call.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        console.log('🎥 Starting full video call');
                        initializeMedia();
                        setIsWebRTCStarted(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Start Video Call
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('🎤 Starting audio-only call');
                        initializeMedia(true);
                        setIsWebRTCStarted(true);
                      }}
                      variant="outline"
                      size="lg"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Audio Only
                    </Button>
                  </div>
                </>
              ) : webRTCError ? (
                /* Error State with Multiple Options */
                <>
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Media Access Issue</h3>
                  <p className="text-gray-300 text-center max-w-lg mb-6">
                    {webRTCError}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                    <Button 
                      onClick={() => {
                        console.log('🔄 Retry full video');
                        setError(null);
                        initializeMedia();
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Retry Video
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        console.log('🎤 Try audio only');
                        setError(null);
                        initializeMedia(true);
                      }}
                      variant="outline"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Audio Only
                    </Button>
                  </div>
                  
                  {/* Help Section */}
                  <div className="mt-6 p-4 bg-gray-700 rounded-lg max-w-lg">
                    <h4 className="text-sm font-semibold text-white mb-2">🛠️ Troubleshooting Tips:</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Make sure your camera/microphone is connected</li>
                      <li>• Check if another app is using your camera</li>
                      <li>• Allow camera access in browser settings</li>
                      <li>• Try refreshing the page if issues persist</li>
                    </ul>
                  </div>
                </>
              ) : (
                /* Loading State */
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                  <h3 className="text-xl font-semibold text-white mb-2">Initializing camera...</h3>
                  <p className="text-gray-400 text-center">
                    Please allow camera and microphone access when prompted
                  </p>
                  
                  {/* Cancel option */}
                  <Button 
                    onClick={() => {
                      console.log('❌ Canceling WebRTC initialization');
                      setIsWebRTCStarted(false);
                      setError(null);
                    }}
                    variant="ghost"
                    className="mt-4"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Debug Panel (when WebRTC is initialized) */}
          {isInitialized && (
            <div className="mt-4 p-2 bg-gray-700 text-xs rounded">
              <div>📡 WebRTC Status: {isInitialized ? 'Ready' : 'Initializing'}</div>
              <div>🎥 Local Stream: {localStream ? 'Active' : 'None'}</div>
              <div>👥 Remote Streams: {remoteStreams.size}</div>
              <div>🤝 Peer Connections: {peerConnections.size}</div>
              <div>📋 Room Members: {roomMembers.length}</div>
              <div>🔗 Room Connected: {roomConnected ? 'Yes' : 'No'}</div>
              {webRTCError && <div className="text-red-400">❌ Error: {webRTCError}</div>}
              <div className="mt-2 flex gap-2">
                <Button 
                  size="sm" 
                  onClick={refreshMembers}
                  className="text-xs px-2 py-1 h-6"
                >
                  🔄 Refresh
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    console.log('🔍 FULL DEBUG:');
                    console.log('localStream:', localStream);
                    console.log('remoteStreams:', remoteStreams);
                    console.log('peerConnections:', peerConnections);
                    console.log('roomMembers:', roomMembers);
                  }}
                  className="text-xs px-2 py-1 h-6"
                >
                  🐛 Debug
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Trò chuyện trong cuộc họp</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {memberCount || roomMembers.length} thành viên • {roomConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </p>
                                     {/* Enhanced debug info */}
                   <div className="text-xs text-gray-500 mt-1">
                     Room: {currentRoom?.roomCode} | Active: {roomMembers.filter(m => m.isActive !== false).length} | 
                     Creator: {roomMembers.find(m => m.role === 'creator')?.userName || 'None'}
                   </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={refreshMembers}
                    disabled={!roomConnected}
                    title="Refresh members"
                  >
                    ↻
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={forceRefreshRoom}
                    disabled={!roomConnected}
                    title="Force refresh room"
                  >
                    ⟳
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      console.log('🔍 Current members state:', roomMembers);
                      console.log('📊 Member count:', memberCount);
                      console.log('🏠 Room data:', roomData);
                    }}
                    title="Debug info"
                  >
                    🐛
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* System Messages */}
              {systemMessages.length > 0 && (
                <div className="space-y-2 border-b border-gray-600 pb-4 mb-4">
                  {systemMessages.map((sysMsg) => (
                    <div key={sysMsg.id} className={`text-xs px-2 py-1 rounded ${
                      sysMsg.type === 'join' ? 'bg-green-800 text-green-200' :
                      sysMsg.type === 'leave' ? 'bg-red-800 text-red-200' :
                      sysMsg.type === 'sync' ? 'bg-blue-800 text-blue-200' :
                      'bg-gray-800 text-gray-200'
                    }`}>
                      {sysMsg.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Room Members List */}
              <div className="border-b border-gray-600 pb-4 mb-4">
                <div className="text-xs text-gray-400 mb-2">Active Members ({roomMembers.length})</div>
                <div className="space-y-1">
                  {roomMembers.map((member) => (
                    <div key={member.userId} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        member.isActive !== false ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <span className={`${member.isTyping ? 'text-blue-400' : 'text-gray-300'}`}>
                        {member.userName}
                        {member.role === 'creator' && ' 👑'}
                        {member.isTyping && ' (typing...)'}
                        {member.userId === user.id && ' (You)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              {roomMessages.length > 0 ? (
                roomMessages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div className="text-xs text-gray-400">
                      {message.userName} • {new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`text-sm ${
                      message.messageType === 'system' 
                        ? 'text-blue-400 italic' 
                        : message.userId === user.id 
                          ? 'text-blue-300' 
                          : 'text-white'
                    }`}>
                      {message.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <ChatInput 
                onSendMessage={sendMessage}
                onStartTyping={startTyping}
                onStopTyping={stopTyping}
                disabled={!roomConnected}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - Enhanced with WebRTC */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
        {isInitialized ? (
          /* WebRTC Controls */
          <VideoControls
            isVideoEnabled={isVideoOn}
            isAudioEnabled={!isMuted}
            isScreenSharing={isScreenSharing}
            onToggleVideo={handleToggleVideo}
            onToggleAudio={handleToggleAudio}
            onToggleScreenShare={handleToggleScreenShare}
            onLeaveCall={onLogout}
          />
        ) : (
          /* Basic Controls */
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12"
              onClick={handleToggleAudio}
              disabled={!isInitialized}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              variant={!isVideoOn ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12"
              onClick={handleToggleVideo}
              disabled={!isInitialized}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button 
              variant={isScreenSharing ? "default" : "secondary"} 
              size="lg" 
              className="rounded-full w-12 h-12"
              onClick={handleToggleScreenShare}
              disabled={!isInitialized}
            >
              <Monitor className="w-6 h-6" />
            </Button>

            <Button variant="destructive" size="lg" className="rounded-full w-12 h-12" onClick={onLogout}>
              <Phone className="w-6 h-6" />
            </Button>

            <Button
              variant={showChat ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
              <Users className="w-6 h-6" />
            </Button>
          </div>
        )}

        <div className="text-center mt-2 text-sm text-gray-400">
          {currentRoom?.roomLink || `Mã phòng: ${roomCode}`}
          {isInitialized && (
            <span className="ml-2 text-green-400">
              • WebRTC Active ({peerConnections.size} connected)
            </span>
          )}
        </div>
      </div>
    </div>
  )
} 