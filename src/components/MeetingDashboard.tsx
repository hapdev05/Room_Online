import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Video,
  Plus,
  Calendar,
  Link,
} from "lucide-react"
import type { Socket } from "socket.io-client"

interface User {
  email: string
  name: string
  picture?: string
  id: string
}

interface MeetingDashboardProps {
  user: User
  onJoinMeeting: () => void
  onLogout: () => void
  socket: Socket | null
  isConnected: boolean
}

export default function MeetingDashboard({
  user,
  onJoinMeeting,
  onLogout,
  socket,
  isConnected,
}: MeetingDashboardProps) {
  const [meetingCode, setMeetingCode] = useState("")

  const handleJoinMeeting = () => {
    if (meetingCode.trim()) {
      // Emit join meeting event qua socket
      if (socket) {
        socket.emit('join-meeting', {
          meetingCode: meetingCode.trim(),
          userId: user.id
        })
      }
      onJoinMeeting()
    }
  }

  const handleCreateMeeting = () => {
    // Emit create meeting event qua socket
    if (socket) {
      socket.emit('create-meeting', {
        creatorId: user.id,
        creatorName: user.name
      })
    }
    onJoinMeeting()
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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-gray-900 mb-4">Cuộc họp video an toàn và chất lượng cao</h1>
          <p className="text-gray-600">Bây giờ mọi người đều có thể tham gia cuộc họp Google Meet</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Tạo cuộc họp mới */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Cuộc họp mới</h3>
                  <p className="text-sm text-gray-600">Tạo cuộc họp để sử dụng sau hoặc bắt đầu ngay</p>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateMeeting}>
                Tạo cuộc họp mới
              </Button>
            </CardContent>
          </Card>

          {/* Tham gia cuộc họp */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Link className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Tham gia cuộc họp</h3>
                  <p className="text-sm text-gray-600">Thông qua liên kết mời hoặc mã cuộc họp</p>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Nhập mã cuộc họp hoặc liên kết"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full"
                />
                <Button variant="outline" className="w-full" onClick={handleJoinMeeting} disabled={!meetingCode.trim()}>
                  Tham gia
                </Button>
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
      </div>
    </div>
  )
} 