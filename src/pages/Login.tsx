"use client"

import { useState } from "react"
import LoginScreen from "../components/LoginScreen"
import MeetingDashboard from "../components/MeetingDashboard"
import MeetingRoom from "../components/MeetingRoom"

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

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setAppState("dashboard")
  }

  const handleJoinMeeting = () => {
    setAppState("meeting")
  }

  const handleBackToDashboard = () => {
    setAppState("dashboard")
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAppState("login")
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
    />
  )
}
