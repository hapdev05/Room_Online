import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  Phone,
  MessageSquare,
  Users,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Maximize,
  Minimize,
} from "lucide-react";

interface JitsiMeetingProps {
  roomCode: string;
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  onLeaveCall: () => void;
  onBack: () => void;
  showChat?: boolean;
  setShowChat?: (show: boolean) => void;
}

export default function JitsiMeeting({
  roomCode,
  user,
  onLeaveCall,
  onBack,
  showChat = false,
  setShowChat,
}: JitsiMeetingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Validate and clean room code
  const validRoomCode =
    roomCode && roomCode !== "UNKNOWN" ? roomCode : `${Date.now()}`;
  const cleanRoomName = `RoomMeeting-${validRoomCode.replace(
    /[^a-zA-Z0-9]/g,
    "-"
  )}`;

  // Debug logs
  console.log("🔍 Room Code Debug:", {
    originalRoomCode: roomCode,
    validRoomCode,
    cleanRoomName,
  });

  useEffect(() => {
    // Reset loading state when URL changes
    setIsLoading(true);
    setError(null);

    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [cleanRoomName, retryCount]);

  const handleIframeLoad = () => {
    console.log("✅ Jitsi iframe loaded successfully");
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    console.error("❌ Jitsi iframe failed to load");
    setError("Không thể tải Jitsi Meet. Vui lòng thử lại.");
    setIsLoading(false);
  };

  const handleRetry = () => {
    console.log("🔄 Retrying Jitsi connection...");
    setRetryCount((prev) => prev + 1);
    setError(null);
    setIsLoading(true);
  };

  const openInNewTab = () => {
    // Simpler URL for new tab
    const simpleUrl = `https://meet.jit.si/${cleanRoomName}`;
    window.open(simpleUrl, "_blank");
  };

  const copyRoomLink = async () => {
    try {
      const simpleUrl = `https://meet.jit.si/${cleanRoomName}`;
      await navigator.clipboard.writeText(simpleUrl);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy room link:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center w-full max-w-md mx-auto">
          <div className="mb-6">
            <AlertCircle className="w-12 md:w-16 h-12 md:h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
              Lỗi kết nối
            </h3>
            <p className="text-sm md:text-base text-gray-400 mb-4">{error}</p>
            <div className="text-sm text-gray-500">
              Lần thử: {retryCount + 1}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6">
            <Button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại ({retryCount + 1})
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={openInNewTab} variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Mở trong</span> tab mới
              </Button>

              <Button onClick={copyRoomLink} variant="outline" size="sm">
                <Users className="w-4 h-4 mr-1" />
                Copy link
              </Button>
            </div>

            <Button onClick={onBack} variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại dashboard
            </Button>
          </div>

          <div className="p-3 md:p-4 bg-gray-800 rounded-lg text-left">
            <h4 className="text-sm font-semibold text-white mb-2">
              💡 Gợi ý khắc phục:
            </h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Kiểm tra kết nối internet</li>
              <li>• Cho phép camera/microphone trong trình duyệt</li>
              <li>• Thử mở trong tab riêng biệt</li>
              <li>• Tắt các extension có thể chặn</li>
              <li>• Sử dụng Chrome hoặc Firefox mới nhất</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col text-white overflow-hidden">
      {/* Compact Header - Hide in fullscreen */}
      {!isFullscreen && (
        <div className="bg-gray-800 border-b border-gray-700 p-1 md:p-2 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left side - Mobile optimized */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-400 hover:text-white hover:bg-gray-700 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>

              <div className="border-l border-gray-600 pl-2 min-w-0 flex-1">
                <h1 className="text-sm md:text-base font-semibold text-white truncate">
                  🏠 <span className="hidden sm:inline">Phòng </span>
                  {roomCode}
                </h1>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                  <span className="hidden sm:inline">Jitsi Meet • </span>
                  <span className="truncate">🔒 Encrypted</span>
                </p>
              </div>
            </div>

            {/* Right side - Mobile optimized */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {setShowChat && (
                <Button
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className="hidden lg:flex"
                  title="Chat"
                >
                  <MessageSquare className="w-4 h-4 md:mr-2" />
                  <span className="hidden xl:inline">Chat</span>
                </Button>
              )}

              {/* Mobile Chat Toggle */}
              {setShowChat && (
                <Button
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className="lg:hidden"
                  title="Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              )}

              <Button
                size="sm"
                onClick={copyRoomLink}
                title="Copy room link"
                className="hidden sm:flex"
              >
                <Users className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>

              <Button
                size="sm"
                onClick={openInNewTab}
                title="Mở trong tab mới"
                className="hidden md:flex"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={onLeaveCall}
                className="flex-shrink-0"
              >
                <Phone className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Rời phòng</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Meeting Container */}
      <div className="flex-1 relative bg-black min-h-0">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <Video className="absolute inset-0 w-6 h-6 m-auto text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Đang kết nối Jitsi Meet...
              </h3>
              <p className="text-sm text-gray-400 mb-2">
                Đang tải phòng họp {roomCode}
              </p>
              <div className="text-xs text-gray-500">
                Có thể mất vài giây để tải hoàn toàn
              </div>
            </div>
          </div>
        )}

        {/* Full-Size Jitsi iframe */}
        <iframe
          src={`https://meet.jit.si/${cleanRoomName}`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="w-full h-full absolute inset-0"
          title="Jitsi Meet Video Conference"
        />

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="bg-gray-800 bg-opacity-90 border-gray-600 text-white hover:bg-gray-700"
              title="Exit fullscreen"
            >
              <Minimize className="w-4 h-4 mr-2" />
              Exit Fullscreen
            </Button>
          </div>
        )}
      </div>

      {/* Minimal Footer - Hide in fullscreen */}
      {!isFullscreen && (
        <div className="bg-gray-800 border-t border-gray-700 px-2 py-1 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                👤 <span className="truncate max-w-24">{user.name}</span>
              </span>
              <span className="hidden sm:flex items-center gap-1">
                🔒 Encrypted
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-1 py-0.5 bg-green-900 text-green-300 rounded">
                JITSI
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
