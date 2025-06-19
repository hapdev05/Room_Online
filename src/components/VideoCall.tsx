import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Users,

} from "lucide-react"

interface VideoPlayerProps {
  stream: MediaStream | null;
  userName: string;
  userAvatar?: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenShare?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  userName,
  userAvatar,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isScreenShare = false,
  className = ""
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && !isVideoOff;

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardContent className="p-0 h-full">
        <div className="relative h-full bg-gradient-to-br from-gray-700 to-gray-800">
          {/* Video Element */}
          {hasVideo ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isLocal} // Always mute local video to prevent feedback
              className="w-full h-full object-cover"
            />
          ) : (
            /* Avatar Fallback */
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="w-24 h-24">
                {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-purple-600">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* User Info Overlay */}
          <div className="absolute bottom-2 left-2">
            <div className="bg-black/50 px-2 py-1 rounded text-sm text-white">
              {userName}
              {isLocal && " (You)"}
              {isScreenShare && " 🖥️"}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            {/* Audio Status */}
            {isMuted ? (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Video Status */}
            {isVideoOff && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Screen Share Indicator */}
            {isScreenShare && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Monitor className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Connection Quality Indicator */}
          {!isLocal && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerConnections: Map<string, any>;
  currentUser: {
    id: string;
    name: string;
    picture?: string;
  };
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  peerConnections,
  currentUser,
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing
}) => {
  const remoteUsers = Array.from(peerConnections.values());
  const totalParticipants = remoteUsers.length + 1; // +1 for local user

  // Determine grid layout
  const getGridLayout = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  // Check if someone is screen sharing
  const screenShareUser = remoteUsers.find(peer => 
    peer.stream && peer.stream.getVideoTracks().some((track: MediaStreamTrack) => 
      track.label.includes('screen')
    )
  );

  return (
    <div className="h-full">
      {screenShareUser ? (
        /* Screen Share Layout */
        <div className="grid grid-cols-4 gap-4 h-full">
          {/* Main screen share */}
          <div className="col-span-3">
            <VideoPlayer
              stream={screenShareUser.stream}
              userName={screenShareUser.peerName}
              isScreenShare={true}
              className="h-full"
            />
          </div>

          {/* Sidebar with other participants */}
          <div className="space-y-4">
            {/* Local user */}
            <VideoPlayer
              stream={localStream}
              userName={currentUser.name}
              userAvatar={currentUser.picture}
              isLocal={true}
              isMuted={!isAudioEnabled}
              isVideoOff={!isVideoEnabled}
              isScreenShare={isScreenSharing}
              className="h-32"
            />

            {/* Other remote users */}
            {remoteUsers
              .filter(peer => peer.peerId !== screenShareUser.peerId)
              .map((peer) => (
                <VideoPlayer
                  key={peer.peerId}
                  stream={peer.stream || null}
                  userName={peer.peerName}
                  className="h-32"
                />
              ))}
          </div>
        </div>
      ) : (
        /* Normal Grid Layout */
        <div className={`grid ${getGridLayout(totalParticipants)} gap-4 h-full`}>
          {/* Local user - make it prominent if only user */}
          <div className={totalParticipants === 1 ? "col-span-full row-span-full" : ""}>
            <VideoPlayer
              stream={localStream}
              userName={currentUser.name}
              userAvatar={currentUser.picture}
              isLocal={true}
              isMuted={!isAudioEnabled}
              isVideoOff={!isVideoEnabled}
              isScreenShare={isScreenSharing}
              className="h-full"
            />
          </div>

          {/* Remote users */}
          {remoteUsers.map((peer) => (
            <VideoPlayer
              key={peer.peerId}
              stream={peer.stream || null}
              userName={peer.peerName}
              className="h-full"
            />
          ))}

          {/* Placeholder for empty slots */}
          {totalParticipants < 4 && Array.from({ 
            length: Math.min(4 - totalParticipants, 3) 
          }).map((_, index) => (
            <Card key={`placeholder-${index}`} className="bg-gray-800 border-gray-700 relative overflow-hidden opacity-50">
              <CardContent className="p-0 h-full">
                <div className="relative h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gray-600">
                      <Users className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-black/50 px-2 py-1 rounded text-xs text-white">
                      Waiting...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface VideoControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onLeaveCall: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onLeaveCall
}) => {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
      {/* Audio Control */}
      <Button
        variant={isAudioEnabled ? "secondary" : "destructive"}
        size="lg"
        className="rounded-full w-12 h-12"
        onClick={onToggleAudio}
        title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
      </Button>

      {/* Video Control */}
      <Button
        variant={isVideoEnabled ? "secondary" : "destructive"}
        size="lg"
        className="rounded-full w-12 h-12"
        onClick={onToggleVideo}
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
      </Button>

      {/* Screen Share Control */}
      <Button
        variant={isScreenSharing ? "default" : "secondary"}
        size="lg"
        className="rounded-full w-12 h-12"
        onClick={onToggleScreenShare}
        title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
      >
        {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
      </Button>

      {/* Leave Call */}
      <Button
        variant="destructive"
        size="lg"
        className="rounded-full w-12 h-12"
        onClick={onLeaveCall}
        title="Leave call"
      >
        <VideoOff className="w-6 h-6" />
      </Button>
    </div>
  );
}; 