"use client"

import { useState } from "react"
import LoginScreen from "../components/LoginScreen"
import MeetingDashboard from "../components/MeetingDashboard"
import MeetingRoom from "../components/MeetingRoom"
import { userService } from "../services/api"
import { useSocket } from "../hooks/useSocket"

type AppState = "login" | "dashboard" | "meeting"

interface User {
  email: string
  name: string
  picture?: string
  id: string
}

export default function Login() {
  const [appState, setAppState] = useState<AppState>("login")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Socket connection
  const { socket, isConnected } = useSocket(currentUser)

  const handleLogin = async (user: User) => {
    try {
      // Gửi thông tin user lên server
      await userService.sendUserInfo(user)
      
      // Cập nhật state sau khi gửi thành công
      setCurrentUser(user)
      setAppState("dashboard")
    } catch (error) {
      console.error('Failed to send user info to server:', error)
      // Vẫn cho phép user vào app ngay cả khi server không phản hồi
      setCurrentUser(user)
      setAppState("dashboard")
    }
  }

  const handleJoinMeeting = () => {
    setAppState("meeting")
  }

  const handleBackToDashboard = () => {
    setAppState("dashboard")
  }

  const handleLogout = async () => {
    try {
      // Gửi thông tin logout lên server nếu có user
      if (currentUser) {
        await userService.sendLogout(currentUser.id)
      }
    } catch (error) {
      console.error('Failed to send logout to server:', error)
    } finally {
      // Luôn logout ở frontend dù server có phản hồi hay không
      setCurrentUser(null)
      setAppState("login")
    }
  }

  if (appState === "login") {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (appState === "dashboard") {
    return (
      <MeetingDashboard 
        user={currentUser!} 
        onJoinMeeting={handleJoinMeeting} 
        onLogout={handleLogout}
        socket={socket}
        isConnected={isConnected}
      />
    )
  }

  return (
    <MeetingRoom
      onBack={handleBackToDashboard}
      onLogout={handleLogout}
      user={currentUser!}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      isVideoOn={isVideoOn}
      setIsVideoOn={setIsVideoOn}
      showChat={showChat}
      setShowChat={setShowChat}
      socket={socket}
      isConnected={isConnected}
    />
  )
}
