import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
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
  peer: Peer.Instance;
  stream?: MediaStream;
}

interface UseWebRTCProps {
  socket: Socket | null;
  user: User | null;
  roomId: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface UseWebRTCReturn {
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

export const useWebRTC = ({ 
  socket, 
  user, 
  roomId, 
  isVideoEnabled, 
  isAudioEnabled 
}: UseWebRTCProps): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  // Initialize media devices with fallback options
  const initializeMedia = useCallback(async (audioOnly = false) => {
    try {
      console.log('🎥 Initializing media devices...', audioOnly ? '(Audio only)' : '(Video + Audio)');
      
      // Check available devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(device => device.kind === 'videoinput');
      const hasAudioInput = devices.some(device => device.kind === 'audioinput');
      
      console.log('📱 Available devices:', {
        videoInputs: devices.filter(d => d.kind === 'videoinput').length,
        audioInputs: devices.filter(d => d.kind === 'audioinput').length
      });

      if (!hasAudioInput && !hasVideoInput) {
        throw new Error('No camera or microphone found');
      }

      // Try different constraint combinations
      const constraintOptions = [
        // Option 1: Full quality (if not audio only)
        !audioOnly && hasVideoInput && hasAudioInput ? {
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
        } : null,
        
        // Option 2: Medium quality video
        !audioOnly && hasVideoInput && hasAudioInput ? {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15 }
          },
          audio: true
        } : null,
        
        // Option 3: Basic video
        !audioOnly && hasVideoInput && hasAudioInput ? {
          video: true,
          audio: true
        } : null,
        
        // Option 4: Video only (if audio fails)
        !audioOnly && hasVideoInput ? {
          video: true,
          audio: false
        } : null,
        
        // Option 5: Audio only
        hasAudioInput ? {
          video: false,
          audio: true
        } : null,
        
        // Option 6: Audio only with basic settings
        hasAudioInput ? {
          video: false,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        } : null
      ].filter(Boolean);

      let stream = null;
      let lastError = null;

      // Try each constraint option
      for (const constraints of constraintOptions) {
        try {
          console.log('🔄 Trying constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          console.warn('⚠️ Constraint failed:', constraints, err);
          lastError = err;
          continue;
        }
      }

      if (!stream) {
        throw lastError || new Error('All media constraints failed');
      }

      setLocalStream(stream);
      setIsInitialized(true);
      setError(null);
      
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log('✅ Media initialized successfully');
      console.log('📹 Video tracks:', videoTracks.length);
      console.log('🎤 Audio tracks:', audioTracks.length);
      
      // Enable/disable tracks based on initial state
      videoTracks.forEach(track => {
        track.enabled = isVideoEnabled;
      });
      audioTracks.forEach(track => {
        track.enabled = isAudioEnabled;
      });

      // Show success message based on what we got
      if (videoTracks.length > 0 && audioTracks.length > 0) {
        console.log('✅ Full video calling available');
      } else if (audioTracks.length > 0) {
        console.log('✅ Audio-only calling available');
        setError('Camera not available - Audio-only mode enabled');
      } else if (videoTracks.length > 0) {
        console.log('✅ Video without audio available');
        setError('Microphone not available - Video without audio');
      }

    } catch (err) {
      console.error('❌ Failed to initialize media:', err);
      
      // Provide specific error messages
      let errorMessage = 'Media access failed';
      if (err instanceof Error) {
        if (err.name === 'NotFoundError' || err.message.includes('Requested device not found')) {
          errorMessage = 'No camera or microphone found. Please connect a camera/microphone and try again.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone access denied. Please allow access in browser settings.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera/microphone is being used by another application. Please close other apps and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera settings not supported. Trying with basic settings...';
          // Auto-retry with audio only
          setTimeout(() => initializeMedia(true), 1000);
          return;
        } else {
          errorMessage = `${err.message}`;
        }
      }
      
      setError(errorMessage);
    }
  }, [isVideoEnabled, isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📹 Video toggled:', videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🎤 Audio toggled:', audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Screen sharing
  const shareScreen = useCallback(async () => {
    try {
      console.log('🖥️ Starting screen share...');
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      peersRef.current.forEach((peerConnection) => {
        const sender = peerConnection.peer._pc.getSenders().find(
          (s: RTCRtpSender) => s.track && s.track.kind === 'video'
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
      
      console.log('✅ Screen sharing started');
      
    } catch (err) {
      console.error('❌ Screen sharing failed:', err);
      setError(`Screen sharing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [localStream]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      console.log('🛑 Stopping screen share...');
      
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen track with camera track
      peersRef.current.forEach((peerConnection) => {
        const sender = peerConnection.peer._pc.getSenders().find(
          (s: RTCRtpSender) => s.track && s.track.kind === 'video'
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
      console.log('✅ Screen sharing stopped');
      
    } catch (err) {
      console.error('❌ Failed to stop screen sharing:', err);
    }
  }, [localStream]);

  // Create peer connection
  const createPeer = useCallback((targetUserId: string, targetUserName: string, initiator: boolean) => {
    if (!localStream) {
      console.error('❌ Cannot create peer: no local stream');
      return null;
    }

    console.log(`🤝 Creating peer connection with ${targetUserName} (initiator: ${initiator})`);
    
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    const peerConnection: PeerConnection = {
      peerId: targetUserId,
      peerName: targetUserName,
      peer
    };

    // Handle peer events
    peer.on('signal', (signal) => {
      console.log('📡 Sending signal to', targetUserName);
      socket?.emit('webrtc-signal', {
        targetUserId,
        signal,
        roomId
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('📺 Received remote stream from', targetUserName);
      peerConnection.stream = remoteStream;
      
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(targetUserId, remoteStream);
        return newMap;
      });
    });

    peer.on('connect', () => {
      console.log('✅ Peer connected:', targetUserName);
    });

    peer.on('error', (err) => {
      console.error('❌ Peer error with', targetUserName, ':', err);
      // Remove failed peer
      setPeerConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(targetUserId);
        return newMap;
      });
    });

    peer.on('close', () => {
      console.log('🔒 Peer connection closed:', targetUserName);
      // Clean up
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(targetUserId);
        return newMap;
      });
      setPeerConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(targetUserId);
        return newMap;
      });
    });

    // Add to connections
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(targetUserId, peerConnection);
      return newMap;
    });
    
    peersRef.current.set(targetUserId, peerConnection);
    
    return peer;
  }, [localStream, socket, roomId]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    // Listen for new users joining
    const handleUserJoinedRoom = (data: { userId: string; userName: string }) => {
      if (data.userId !== user.id && localStream) {
        console.log('👋 New user joined, creating peer connection:', data.userName);
        createPeer(data.userId, data.userName, true);
      }
    };

    // Listen for WebRTC signals
    const handleWebRTCSignal = (data: { fromUserId: string; fromUserName: string; signal: any }) => {
      console.log('📡 Received WebRTC signal from', data.fromUserName);
      
      let peer = peersRef.current.get(data.fromUserId)?.peer;
      
      if (!peer) {
        // Create new peer as answerer
        peer = createPeer(data.fromUserId, data.fromUserName, false);
      }
      
      if (peer) {
        peer.signal(data.signal);
      }
    };

    // Listen for user leaving
    const handleUserLeftRoom = (data: { userId: string }) => {
      console.log('👋 User left, cleaning up peer connection:', data.userId);
      
      const peerConnection = peersRef.current.get(data.userId);
      if (peerConnection) {
        peerConnection.peer.destroy();
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
  }, [socket, user, roomId, localStream, createPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up WebRTC connections');
      
      // Close all peer connections
      peersRef.current.forEach((peerConnection) => {
        peerConnection.peer.destroy();
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
    isScreenSharing
  };
}; 