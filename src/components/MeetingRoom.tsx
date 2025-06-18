import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"

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
}: MeetingRoomProps) {
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
            Cuộc họp • <span className="text-green-400">Đang diễn ra</span>
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
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Main Speaker */}
            <Card className="col-span-2 bg-gray-800 border-gray-700 relative overflow-hidden">
              <CardContent className="p-0 h-full">
                <div className="relative h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                  <Avatar className="w-32 h-32">
                    {user.picture && <AvatarImage src={user.picture} alt={user.name} />}
                    <AvatarFallback className="text-4xl bg-blue-600">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-black/50 px-3 py-1 rounded-full text-sm">{user.name} (Bạn)</div>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {!isMuted && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other Participants */}
            {[
              { name: "Trần Thị B", avatar: "TB", speaking: true },
              { name: "Lê Văn C", avatar: "LC", speaking: false },
              { name: "Phạm Thị D", avatar: "PD", speaking: false },
              { name: "Hoàng Văn E", avatar: "HE", speaking: false },
            ].map((participant, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700 relative overflow-hidden">
                <CardContent className="p-0 h-full">
                  <div className="relative h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-purple-600">{participant.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-2 left-2">
                      <div className="bg-black/50 px-2 py-1 rounded text-xs">{participant.name}</div>
                    </div>
                    {participant.speaking && (
                      <div className="absolute bottom-2 right-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Trò chuyện trong cuộc họp</h3>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <div className="text-xs text-gray-400">{user.name} • 10:30</div>
                <div className="text-sm">Chào mọi người! Chúng ta bắt đầu cuộc họp nhé.</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Trần Thị B • 10:32</div>
                <div className="text-sm">Xin chào! Tôi đã sẵn sàng.</div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700">
              <Input placeholder="Gửi tin nhắn tới mọi người" className="bg-gray-700 border-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-12 h-12"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            variant={!isVideoOn ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-12 h-12"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button variant="secondary" size="lg" className="rounded-full w-12 h-12">
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

        <div className="text-center mt-2 text-sm text-gray-400">meet.google.com/abc-defg-hij</div>
      </div>
    </div>
  )
} 