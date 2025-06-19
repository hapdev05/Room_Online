import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Users,
  Lock,
  Unlock,
  Copy,
  Check,
  Settings,
  AlertCircle,
} from "lucide-react"
import { roomService } from "../services/api"
import type { User } from "../types/user"

interface CreateRoomProps {
  user: User
  onRoomCreated: (roomData: any) => void
}

export default function CreateRoom({ user, onRoomCreated }: CreateRoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdRoom, setCreatedRoom] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  
  const [roomData, setRoomData] = useState({
    roomName: '',
    description: '',
    maxUsers: 10,
    isPrivate: false,
    password: ''
  })

  const resetForm = () => {
    setRoomData({
      roomName: '',
      description: '',
      maxUsers: 10,
      isPrivate: false,
      password: ''
    })
    setError(null)
    setCreatedRoom(null)
    setCopied(false)
  }

  const createRoom = async () => {
    if (!roomData.roomName.trim()) {
      setError('Vui lòng nhập tên phòng')
      return
    }

    if (roomData.isPrivate && !roomData.password.trim()) {
      setError('Vui lòng nhập mật khẩu cho phòng riêng tư')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Creating room via server API...')
      const response = await roomService.createRoom(user, roomData)
      console.log('✅ Server response:', response)
      
      // Extract room data from server response
      const room = response?.room || response?.data || response
      
      if (!room) {
        throw new Error('Invalid server response - no room data')
      }
      
      console.log('🏠 Final room data:', room)
      setCreatedRoom(room)
      onRoomCreated(room)
      
    } catch (error: any) {
      console.error('❌ Error creating room:', error)
      setError(error.response?.data?.message || error.message || 'Không thể tạo phòng. Vui lòng kiểm tra kết nối server.')
    } finally {
      setIsLoading(false)
    }
  }



  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(resetForm, 300) // Reset after dialog closes
  }

  if (createdRoom) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Tạo cuộc họp mới
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Phòng họp đã được tạo!
            </DialogTitle>
            <DialogDescription>
              Phòng "{createdRoom.roomName}" đã sẵn sàng. Chia sẻ thông tin dưới đây để mời người khác tham gia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Room Info */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{createdRoom.roomName}</span>
                    <Badge variant={createdRoom.isPrivate ? "destructive" : "secondary"}>
                      {createdRoom.isPrivate ? (
                        <><Lock className="w-3 h-3 mr-1" /> Riêng tư</>
                      ) : (
                        <><Unlock className="w-3 h-3 mr-1" /> Công khai</>
                      )}
                    </Badge>
                  </div>
                  
                  {createdRoom.description && (
                    <p className="text-sm text-gray-600">{createdRoom.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Tối đa {createdRoom.maxUsers} người
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Mã phòng:</label>
              <div className="flex gap-2">
                <Input
                  value={createdRoom.roomCode}
                  readOnly
                  className="font-mono text-center text-lg bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(createdRoom.roomCode)}
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Room Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Đường dẫn phòng:</label>
              <div className="flex gap-2">
                <Input
                  value={createdRoom.roomLink}
                  readOnly
                  className="text-xs bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(createdRoom.roomLink)}
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Password (if private) */}
            {createdRoom.isPrivate && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Mật khẩu:</label>
                <div className="flex gap-2">
                  <Input
                    value={roomData.password}
                    readOnly
                    type="text"
                    className="font-mono bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(roomData.password)}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Đóng
              </Button>
              <Button 
                onClick={() => {
                  onRoomCreated(createdRoom)
                  handleClose()
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Vào phòng ngay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Tạo cuộc họp mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo phòng họp mới</DialogTitle>
          <DialogDescription>
            Thiết lập thông tin cho phòng họp của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Room Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Tên phòng *</label>
            <Input
              placeholder="Nhập tên phòng họp"
              value={roomData.roomName}
              onChange={(e) => setRoomData({...roomData, roomName: e.target.value})}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Mô tả</label>
            <Input
              placeholder="Mô tả cuộc họp (tùy chọn)"
              value={roomData.description}
              onChange={(e) => setRoomData({...roomData, description: e.target.value})}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {/* Max Users */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Số người tối đa</label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <Input
                type="number"
                min="2"
                max="50"
                value={roomData.maxUsers}
                onChange={(e) => setRoomData({...roomData, maxUsers: parseInt(e.target.value) || 10})}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Cài đặt quyền riêng tư</label>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRoomData({...roomData, isPrivate: !roomData.isPrivate, password: ''})}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  roomData.isPrivate 
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}
                disabled={isLoading}
              >
                {roomData.isPrivate ? (
                  <><Lock className="w-4 h-4" /> Phòng riêng tư</>
                ) : (
                  <><Unlock className="w-4 h-4" /> Phòng công khai</>
                )}
              </button>
            </div>

            {roomData.isPrivate && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Mật khẩu phòng *</label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={roomData.password}
                  onChange={(e) => setRoomData({...roomData, password: e.target.value})}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isLoading}>
              Hủy
            </Button>
            <Button onClick={createRoom} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo phòng
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 