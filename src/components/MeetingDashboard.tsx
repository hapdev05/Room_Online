import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Video,
  Calendar,
  Trash2,
  Database,
  Share2,
} from "lucide-react"
import CreateRoom from "./CreateRoom"
import JoinRoom from "./JoinRoom"
import ShareModal from "./ShareModal"
import { roomService } from "../services/api"
import type { Socket } from "socket.io-client"

interface User {
  email: string
  name: string
  picture?: string
  id: string
}

interface MeetingDashboardProps {
  user: User
  onJoinMeeting: (roomData?: any) => void
  onLogout: () => void
  socket: Socket | null
  isConnected: boolean
}

export default function MeetingDashboard({
  user,
  onJoinMeeting,
  onLogout,
  socket,
}: MeetingDashboardProps) {
  const [meetingCode, setMeetingCode] = useState("")
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [storedRooms, setStoredRooms] = useState<any>({})
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedRoomForShare, setSelectedRoomForShare] = useState<any>(null)

  const handleRoomCreated = (roomData: any) => {
    console.log('Room created in dashboard:', roomData)
    
    // Validate roomData before using
    if (!roomData) {
      console.error('Invalid room data received')
      return
    }
    
    // Emit create meeting event qua socket
    if (socket && roomData) {
      socket.emit('create-meeting', {
        roomId: roomData.id || roomData._id || `temp-${Date.now()}`,
        roomCode: roomData.roomCode || 'UNKNOWN',
        creatorId: user.id,
        creatorName: user.name,
        roomName: roomData.roomName
      })
    }
    onJoinMeeting(roomData)
  }

  const handleRoomJoined = (roomData: any) => {
    console.log('Room joined in dashboard:', roomData)
    
    // Validate roomData before using
    if (!roomData) {
      console.error('Invalid room data received')
      return
    }
    
    // Emit join meeting event qua socket
    if (socket && roomData) {
      socket.emit('join-meeting', {
        roomId: roomData.id || roomData._id || `temp-${Date.now()}`,
        roomCode: roomData.roomCode || 'UNKNOWN',
        userId: user.id,
        roomName: roomData.roomName
      })
    }
    onJoinMeeting(roomData)
  }

  const handleJoinMeeting = () => {
    if (meetingCode.trim()) {
      // Legacy join for direct code input
      handleRoomJoined({ roomCode: meetingCode.trim() })
    }
  }

  const loadUserRooms = async () => {
    try {
      console.log('🔍 Loading user rooms from server...')
      const response = await roomService.getUserRooms(user.id)
      const rooms = response?.rooms || response?.data || []
      
      // Convert array to object for compatibility
      const roomsObj = rooms.reduce((acc: any, room: any) => {
        acc[room.roomCode] = room
        return acc
      }, {})
      
      setStoredRooms(roomsObj)
      console.log('✅ Loaded user rooms:', roomsObj)
    } catch (error) {
      console.error('❌ Failed to load user rooms:', error)
      setStoredRooms({})
    }
  }

  const clearAllRooms = () => {
    if (confirm('Này chỉ là demo - không thể xóa rooms từ server. Refresh để reload.')) {
      setStoredRooms({})
      console.log('Local room list cleared (server data unchanged)')
    }
  }

  const handleShareRoom = (room: any) => {
    setSelectedRoomForShare(room)
    setShareModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Meet</span>
          </div>

          <div className="flex items-center gap-4">


            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-600">{user.email}</div>
            </div>
            <Avatar className="w-8 h-8">
              {user.picture && <AvatarImage src={user.picture} alt={user.name} />}
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        {/* Server Notice */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700">
              <strong>Server Mode:</strong> Kết nối với server thật. Tất cả dữ liệu được lưu trên server.
            </span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-gray-900 mb-4">Cuộc họp video an toàn và chất lượng cao</h1>
          <p className="text-gray-600">Bây giờ mọi người đều có thể tham gia cuộc họp Google Meet</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Tạo cuộc họp mới */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cuộc họp mới</h3>
                <p className="text-sm text-gray-600">Tạo phòng họp mới với các tùy chọn tùy chỉnh</p>
              </div>

              <CreateRoom user={user} onRoomCreated={handleRoomCreated} />
            </CardContent>
          </Card>

          {/* Tham gia cuộc họp */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tham gia cuộc họp</h3>
                <p className="text-sm text-gray-600">Sử dụng mã phòng để tham gia cuộc họp</p>
              </div>

              <div className="space-y-3">
                <JoinRoom user={user} onRoomJoined={handleRoomJoined} meetingCode={meetingCode} />
                
                {/* Quick join option */}
                <div className="text-center text-sm text-gray-500">hoặc</div>
                <div className="space-y-2">
                  <Input
                    placeholder="Nhập mã phòng trực tiếp"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                    className="w-full text-center"
                    maxLength={6}
                  />
                  <Button variant="outline" className="w-full" onClick={handleJoinMeeting} disabled={!meetingCode.trim()}>
                    Tham gia nhanh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Cuộc họp sắp tới */}
        <div className="mt-12">
          <h2 className="text-xl font-medium text-gray-900 mb-6">Cuộc họp sắp tới</h2>
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Họp nhóm dự án</h3>
                  <p className="text-sm text-gray-600">Hôm nay • 14:00 - 15:00</p>
                  <p className="text-sm text-gray-500">meet.google.com/abc-defg-hij</p>
                </div>
                <Button variant="outline">Tham gia</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Rooms Panel */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-medium text-gray-900">Phòng của bạn</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowDebugPanel(!showDebugPanel)
                if (!showDebugPanel) loadUserRooms()
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              {showDebugPanel ? 'Ẩn' : 'Xem'} Rooms
            </Button>
          </div>

          {showDebugPanel && (
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      Phòng của bạn ({Object.keys(storedRooms).length})
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={loadUserRooms}>
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAllRooms}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {Object.keys(storedRooms).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Bạn chưa có phòng nào. Tạo hoặc tham gia phòng để thấy ở đây.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {Object.values(storedRooms).map((room: any) => (
                        <div 
                          key={room.roomCode} 
                          className="p-4 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {room.roomName}
                              </div>
                              <div className="text-sm text-gray-600">
                                Mã: <span className="font-mono">{room.roomCode}</span>
                                {room.isPrivate && (
                                  <span className="ml-2 text-red-600">(Riêng tư)</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {room.members.length} thành viên • Tạo bởi: {room.createdBy}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleShareRoom(room)}
                              >
                                <Share2 className="w-4 h-4 mr-1" />
                                Share
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRoomJoined(room)}
                              >
                                Vào phòng
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {selectedRoomForShare && (
        <ShareModal
          room={selectedRoomForShare}
          user={user}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false)
            setSelectedRoomForShare(null)
          }}
        />
      )}
    </div>
  )
} 