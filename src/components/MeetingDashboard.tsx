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
            <span className="text-xl font-semibold text-gray-900">Room Online</span>
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
          <p className="text-gray-600">Bây giờ mọi người đều có thể tham gia cuộc họp</p>
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