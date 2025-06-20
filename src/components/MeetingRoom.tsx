import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { useRoomSocket } from "../hooks/useRoomSocket";
import JitsiMeeting from "./JitsiMeeting";
import type { Socket } from "socket.io-client";

interface User {
  email: string;
  name: string;
  picture?: string;
  id: string;
}

interface MeetingRoomProps {
  onBack: () => void;
  onLogout: () => void;
  user: User;
  showChat: boolean;
  setShowChat: (value: boolean) => void;
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: any;
}

export default function MeetingRoom({
  onBack,
  onLogout,
  user,
  showChat,
  setShowChat,
  currentRoom,
}: MeetingRoomProps) {
  const [showJitsi, setShowJitsi] = useState(false);

  // Socket connection for room management and chat
  const {
    roomMessages,
    roomMembers,
    memberCount,
    isConnected: roomConnected,
    systemMessages,
    sendMessage,
    startTyping,
    stopTyping,
    refreshMembers,
  } = useRoomSocket(user, currentRoom?.roomCode || currentRoom?.id || null);

  const roomName = currentRoom?.roomName || "Cuộc họp";
  const roomCode =
    currentRoom?.roomCode || currentRoom?.id || `${Date.now()}`;

  // Debug current room data
  console.log("🏠 Room Debug:", {
    currentRoom,
    roomCode,
    roomName,
  });

  // Auto-start Jitsi when ready
  useEffect(() => {
    if (currentRoom && user) {
      console.log("🎥 Starting Jitsi Meeting for room:", roomCode);
      setShowJitsi(true);
    }
  }, [currentRoom, user, roomCode]);

  // Chat input component
  const ChatInput = ({
    onSendMessage,
    onStartTyping,
    onStopTyping,
    disabled,
  }: {
    onSendMessage: (message: string) => void;
    onStartTyping: () => void;
    onStopTyping: () => void;
    disabled: boolean;
  }) => {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = () => {
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage("");
        if (isTyping) {
          onStopTyping();
          setIsTyping(false);
        }
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);

      if (e.target.value.length > 0 && !isTyping && !disabled) {
        onStartTyping();
        setIsTyping(true);
      } else if (e.target.value.length === 0 && isTyping) {
        onStopTyping();
        setIsTyping(false);
      }
    };

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
    );
  };

  // If Jitsi is ready, show the Jitsi meeting
  if (showJitsi && currentRoom) {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Main Jitsi Meeting */}
        <div className={showChat ? "flex-1" : "w-full"}>
          <JitsiMeeting
            roomCode={roomCode}
            user={user}
            onLeaveCall={onLogout}
            onBack={onBack}
            showChat={showChat}
            setShowChat={setShowChat}
          />
        </div>

        {/* Responsive Chat Sidebar */}
        {showChat && (
          <div className="w-full md:w-72 bg-gray-800 border-l border-gray-700 flex flex-col absolute md:relative inset-0 md:inset-auto z-50 md:z-auto h-full">
            <div className="p-3 md:p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm md:text-base">
                    Trò chuyện trong cuộc họp
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {memberCount || roomMembers.length} thành viên •{" "}
                    {roomConnected ? "🟢 Connected" : "🔴 Disconnected"}
                  </p>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    Room: {roomCode} | Active:{" "}
                    {roomMembers.filter((m) => m.isActive !== false).length}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshMembers}
                    disabled={!roomConnected}
                    title="Refresh members"
                    className="hidden md:flex"
                  >
                    ↻
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                    title="Close chat"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* System Messages */}
              {systemMessages.length > 0 && (
                <div className="space-y-2 border-b border-gray-600 pb-4 mb-4">
                  {systemMessages.map((sysMsg) => (
                    <div
                      key={sysMsg.id}
                      className={`text-xs px-2 py-1 rounded ${
                        sysMsg.type === "join"
                          ? "bg-green-800 text-green-200"
                          : sysMsg.type === "leave"
                          ? "bg-red-800 text-red-200"
                          : sysMsg.type === "sync"
                          ? "bg-blue-800 text-blue-200"
                          : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      {sysMsg.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Room Members List */}
              <div className="border-b border-gray-600 pb-4 mb-4">
                <div className="text-xs text-gray-400 mb-2">
                  Active Members ({roomMembers.length})
                </div>
                <div className="space-y-1">
                  {roomMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          member.isActive !== false
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={`${
                          member.isTyping ? "text-blue-400" : "text-gray-300"
                        }`}
                      >
                        {member.userName}
                        {member.role === "creator" && " 👑"}
                        {member.isTyping && " (typing...)"}
                        {member.userId === user.id && " (you)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-3 flex-1">
                {roomMessages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Không có tin nhắn nào
                    <div className="text-xs mt-1">
                      Hãy bắt đầu cuộc trò chuyện!
                    </div>
                  </div>
                ) : (
                  roomMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-300">
                          {msg.userName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-200 bg-gray-700 p-2 rounded">
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Input */}
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
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center w-full max-w-md mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Chuẩn bị cuộc họp...
        </h3>
        <p className="text-sm md:text-base text-gray-400">
          Đang thiết lập phòng họp {roomCode}
        </p>
      </div>
    </div>
  );
}
