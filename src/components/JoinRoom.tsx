import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Link,
  Lock,
  AlertCircle,
  Settings,
  LogIn,
} from "lucide-react"
import { roomService } from "../services/api"
import type { User } from "../types/user"

interface JoinRoomProps {
  user: User
  onRoomJoined: (roomData: any) => void
  meetingCode?: string
}

export default function JoinRoom({ user, onRoomJoined, meetingCode: initialMeetingCode = '' }: JoinRoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [roomCode, setRoomCode] = useState(initialMeetingCode)
  const [password, setPassword] = useState('')

  const resetForm = () => {
    setRoomCode(initialMeetingCode)
    setPassword('')
    setError(null)
  }



  const joinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Vui lòng nhập mã phòng')
      return
    }

    if (roomCode.length !== 6) {
      setError('Mã phòng phải có 6 ký tự')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Joining room via server API:', roomCode.trim().toUpperCase())
      const response = await roomService.joinRoom(user, roomCode.trim().toUpperCase(), password)
      console.log('✅ Server join response:', response)
      
      // Extract room data from server response
      const room = response?.room || response?.data || response
      
      if (!room) {
        throw new Error('Invalid server response - no room data')
      }
      
      console.log('🏠 Successfully joined room:', room)
      onRoomJoined(room)
      
      // Close dialog after successful join
      setIsOpen(false)
      resetForm()
      
    } catch (error: any) {
      console.error('❌ Error joining room:', error)
      
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tham gia phòng'
      
      if (errorMessage.includes('password') || errorMessage.includes('mật khẩu')) {
        setError('Mật khẩu không đúng. Vui lòng thử lại.')
      } else if (errorMessage.includes('not found') || errorMessage.includes('không tìm thấy')) {
        setError('Không tìm thấy phòng với mã này.')
      } else if (errorMessage.includes('full') || errorMessage.includes('đầy')) {
        setError('Phòng đã đầy. Không thể tham gia.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(resetForm, 300) // Reset after dialog closes
  }

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length <= 6) {
      setRoomCode(value)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      joinRoom()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Link className="w-4 h-4 mr-2" />
          Tham gia cuộc họp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tham gia phòng họp</DialogTitle>
          <DialogDescription>
            Nhập mã phòng để tham gia cuộc họp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Room Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Mã phòng *</label>
            <Input
              placeholder="Nhập mã phòng (6 ký tự)"
              value={roomCode}
              onChange={handleRoomCodeChange}
              onKeyPress={handleKeyPress}
              className="w-full text-center text-lg font-mono tracking-wider uppercase"
              disabled={isLoading}
              maxLength={6}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              Mã phòng bao gồm 6 ký tự (ví dụ: ABC123)
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mật khẩu (nếu cần)
              </div>
            </label>
            <Input
              type="password"
              placeholder="Nhập mật khẩu nếu phòng riêng tư"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              Chỉ cần nhập nếu phòng là riêng tư
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Room Code Format Help */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs text-white font-bold">i</span>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Cách tìm mã phòng:</p>
                <ul className="text-xs space-y-1">
                  <li>• Người tạo phòng sẽ chia sẻ mã 6 ký tự</li>
                  <li>• Mã có thể có trong link mời</li>
                  <li>• Ví dụ: ABC123, XYZ789</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isLoading}>
              Hủy
            </Button>
            <Button 
              onClick={joinRoom} 
              className="flex-1 bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading || !roomCode.trim()}
            >
              {isLoading ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Đang tham gia...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Tham gia
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 