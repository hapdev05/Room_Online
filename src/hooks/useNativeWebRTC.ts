import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  picture?: string;
  email: string;
}

interface PeerConnection {
  peerId: string;
  peerName: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface UseNativeWebRTCProps {
  socket: Socket | null;
  user: User | null;
  roomId: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface UseNativeWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerConnections: Map<string, PeerConnection>;
  isInitialized: boolean;
  error: string | null;
  initializeMedia: (audioOnly?: boolean) => Promise<void>;
  toggleVideo: () => void;
  toggleAudio: () => void;
  shareScreen: () => Promise<void>;
  stopScreenShare: () => void;
  isScreenSharing: boolean;
  setError: (error: string | null) => void;
}

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const useNativeWebRTC = ({ 
  socket, 
  user, 
  roomId, 
  isVideoEnabled, 
  isAudioEnabled 
}: UseNativeWebRTCProps): UseNativeWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  // Initialize media devices
  const initializeMedia = useCallback(async () => {
    try {
      console.log('🎥 Initializing native WebRTC media...');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsInitialized(true);
      setError(null);
      
      console.log('✅ Native WebRTC media initialized');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
      
      // Enable/disable tracks based on initial state
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });

    } catch (err) {
      console.error('❌ Failed to initialize native WebRTC:', err);
      setError(`Media access failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [isVideoEnabled, isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📹 Native WebRTC video toggled:', videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🎤 Native WebRTC audio toggled:', audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Screen sharing
  const shareScreen = useCallback(async () => {
    try {
      console.log('🖥️ Starting native WebRTC screen share...');
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      peersRef.current.forEach((peerConnection) => {
        const sender = peerConnection.connection.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local stream
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(videoTrack);
      }
      
      setIsScreenSharing(true);
      
      // Handle screen share end
      videoTrack.addEventListener('ended', () => {
        stopScreenShare();
      });
      
      console.log('✅ Native WebRTC screen sharing started');
      
    } catch (err) {
      console.error('❌ Native WebRTC screen sharing failed:', err);
      setError(`Screen sharing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [localStream]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      console.log('🛑 Stopping native WebRTC screen share...');
      
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen track with camera track
      peersRef.current.forEach((peerConnection) => {
        const sender = peerConnection.connection.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local stream
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(videoTrack);
      }
      
      setIsScreenSharing(false);
      console.log('✅ Native WebRTC screen sharing stopped');
      
    } catch (err) {
      console.error('❌ Failed to stop native WebRTC screen sharing:', err);
    }
  }, [localStream]);

  // Create peer connection
  const createPeerConnection = useCallback(async (targetUserId: string, targetUserName: string, isOffer: boolean) => {
    if (!localStream) {
      console.error('❌ Cannot create peer: no local stream');
      return null;
    }

    console.log(`🤝 Creating native WebRTC peer connection with ${targetUserName} (offer: ${isOffer})`);
    
    const pc = new RTCPeerConnection(rtcConfig);

    const peerConnection: PeerConnection = {
      peerId: targetUserId,
      peerName: targetUserName,
      connection: pc
    };

    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📺 Received remote stream from', targetUserName);
      const [remoteStream] = event.streams;
      peerConnection.stream = remoteStream;
      
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(targetUserId, remoteStream);
        return newMap;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📡 Sending ICE candidate to', targetUserName);
        socket?.emit('webrtc-signal', {
          targetUserId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          },
          roomId
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state with', targetUserName, ':', pc.connectionState);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // Clean up failed connection
        setPeerConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(targetUserId);
          return newMap;
        });
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(targetUserId);
          return newMap;
        });
      }
    };

    // Create offer/answer
    if (isOffer) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log('📤 Sending offer to', targetUserName);
        socket?.emit('webrtc-signal', {
          targetUserId,
          signal: {
            type: 'offer',
            sdp: offer
          },
          roomId
        });
      } catch (err) {
        console.error('❌ Failed to create offer:', err);
      }
    }

    // Add to connections
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(targetUserId, peerConnection);
      return newMap;
    });
    
    peersRef.current.set(targetUserId, peerConnection);
    
    return pc;
  }, [localStream, socket, roomId]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    // Listen for new users joining
    const handleUserJoinedRoom = (data: { userId: string; userName: string }) => {
      if (data.userId !== user.id && localStream) {
        console.log('👋 New user joined, creating native WebRTC connection:', data.userName);
        createPeerConnection(data.userId, data.userName, true);
      }
    };

    // Listen for WebRTC signals
    const handleWebRTCSignal = async (data: { fromUserId: string; fromUserName: string; signal: any }) => {
      console.log('📡 Received native WebRTC signal from', data.fromUserName, ':', data.signal.type);
      
      let peerConnection = peersRef.current.get(data.fromUserId);
      
      if (!peerConnection && data.signal.type === 'offer') {
        // Create new peer as answerer
        await createPeerConnection(data.fromUserId, data.fromUserName, false);
        peerConnection = peersRef.current.get(data.fromUserId);
      }
      
      if (peerConnection) {
        const pc = peerConnection.connection;
        
        try {
          if (data.signal.type === 'offer') {
            await pc.setRemoteDescription(data.signal.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            console.log('📤 Sending answer to', data.fromUserName);
            socket?.emit('webrtc-signal', {
              targetUserId: data.fromUserId,
              signal: {
                type: 'answer',
                sdp: answer
              },
              roomId
            });
          } else if (data.signal.type === 'answer') {
            await pc.setRemoteDescription(data.signal.sdp);
          } else if (data.signal.type === 'ice-candidate') {
            await pc.addIceCandidate(data.signal.candidate);
          }
        } catch (err) {
          console.error('❌ Failed to handle WebRTC signal:', err);
        }
      }
    };

    // Listen for user leaving
    const handleUserLeftRoom = (data: { userId: string }) => {
      console.log('👋 User left, cleaning up native WebRTC connection:', data.userId);
      
      const peerConnection = peersRef.current.get(data.userId);
      if (peerConnection) {
        peerConnection.connection.close();
        peersRef.current.delete(data.userId);
      }
      
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      
      setPeerConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    };

    socket.on('user-joined-room', handleUserJoinedRoom);
    socket.on('webrtc-signal', handleWebRTCSignal);
    socket.on('user-left-room', handleUserLeftRoom);

    return () => {
      socket.off('user-joined-room', handleUserJoinedRoom);
      socket.off('webrtc-signal', handleWebRTCSignal);
      socket.off('user-left-room', handleUserLeftRoom);
    };
  }, [socket, user, roomId, localStream, createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up native WebRTC connections');
      
      // Close all peer connections
      peersRef.current.forEach((peerConnection) => {
        peerConnection.connection.close();
      });
      peersRef.current.clear();
      
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    peerConnections,
    isInitialized,
    error,
    initializeMedia,
    toggleVideo,
    toggleAudio,
    shareScreen,
    stopScreenShare,
    isScreenSharing,
    setError
  };
}; 