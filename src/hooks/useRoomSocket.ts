import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { roomService } from '../services/api';
import type { User } from '../types/user';

interface RoomMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  messageType: 'text' | 'system';
  timestamp: string;
}

interface RoomMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
  isTyping?: boolean;
  isActive?: boolean;
  isOnline?: boolean;
  role?: string;
}

interface SystemMessage {
  id: number;
  message: string;
  type: 'join' | 'leave' | 'sync' | 'refresh';
  timestamp: string;
}

interface UseRoomSocketReturn {
  socket: Socket | null;
  roomMessages: RoomMessage[];
  roomMembers: RoomMember[];
  roomData: any;
  memberCount: number;
  isConnected: boolean;
  systemMessages: SystemMessage[];
  sendMessage: (message: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  refreshMembers: () => void;
  forceRefreshRoom: () => void;
  connectionError: string | null;
}

export const useRoomSocket = (user: User | null, roomId: string | null): UseRoomSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Debug: Track state changes
  useEffect(() => {
    console.log('🔧 useRoomSocket: roomMembers state changed!');
    console.log('🔧 New roomMembers length:', roomMembers.length);
    console.log('🔧 New roomMembers:', roomMembers);
  }, [roomMembers]);

  useEffect(() => {
    console.log('🔧 useRoomSocket: memberCount state changed:', memberCount);
  }, [memberCount]);

  // Sử dụng cùng base URL với API
  const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://8e42-2001-ee0-4b49-c580-80e9-81fe-65db-5870.ngrok-free.app';

  // Add system message helper
  const addSystemMessage = (message: string, type: 'join' | 'leave' | 'sync' | 'refresh') => {
    const systemMsg: SystemMessage = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setSystemMessages(prev => [...prev, systemMsg]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setSystemMessages(prev => prev.filter(msg => msg.id !== systemMsg.id));
    }, 5000);
  };

  // Load initial room data from server with fallback
  useEffect(() => {
    if (user && roomId) {
      console.log('🔍 Loading room data from server for room:', roomId);
      
      const loadRoomData = async () => {
        try {
          const roomData = await roomService.getRoomInfo(roomId);
          console.log('✅ Found room on server:', roomData);
          
          // Convert room members to RoomMember format (match server structure)
          const members: RoomMember[] = (roomData.members || []).map((member: any) => ({
            userId: member.userId || member.id,
            userName: member.userName || member.name,
            userAvatar: member.userPicture || member.picture || member.userAvatar,
            joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
            isTyping: false,
            isActive: member.isActive !== undefined ? member.isActive : true,
            isOnline: member.isOnline !== undefined ? member.isOnline : true,
            role: member.role || 'member'
          }));
          
          setRoomMembers(members);
          setMemberCount(members.length);
          console.log('🏠 Room members loaded from server:', members);
          console.log('👥 Member details:', members.map(m => `${m.userName} (${m.role}) - ${m.userId}`));
        } catch (error) {
          console.error('❌ Failed to load room data from server:', error);
          console.log('🔄 Creating fallback member list with current user');
          
          // Fallback: Add current user to member list
          const fallbackMembers: RoomMember[] = [{
            userId: user.id,
            userName: user.name,
            userAvatar: user.picture,
            joinedAt: new Date().toISOString(),
            isTyping: false,
            isActive: true,
            isOnline: true,
            role: 'creator' // Default to creator for fallback
          }];
          
          setRoomMembers(fallbackMembers);
          console.log('🏠 Fallback room members:', fallbackMembers);
        }
      };
      
      loadRoomData();
    }
  }, [user, roomId]);

  useEffect(() => {
    if (user && roomId) {
      console.log('Connecting to room:', roomId);
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });
      
      // Connection events
      newSocket.on('connect', () => {
        console.log('🔗 Socket.IO connected for room');
        setIsConnected(true);
        setConnectionError(null);
        addSystemMessage('Connected to room server', 'sync');
        
        // Join user and room
        newSocket.emit('user-join', {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        });
        
        newSocket.emit('join-room', { 
          roomId,
          roomCode: roomId,
          user: {
            userId: user.id,
            userName: user.name,
            userAvatar: user.picture,
            joinedAt: new Date().toISOString(),
            isActive: true,
            isOnline: true,
            role: 'member'
          }
        });
        
        // Ensure current user is in member list (fallback)
        const currentUserMember: RoomMember = {
          userId: user.id,
          userName: user.name,
          userAvatar: user.picture,
          joinedAt: new Date().toISOString(),
          isTyping: false,
          isActive: true,
          isOnline: true,
          role: 'member'
        };
        
        setTimeout(() => {
          setRoomMembers(prev => {
            const exists = prev.some(member => member.userId === user.id);
            if (!exists) {
              console.log('➕ Ensuring current user is in member list');
              return [...prev, currentUserMember];
            }
            return prev;
          });
        }, 500);
        
        // Multiple sync attempts for reliability
        setTimeout(() => {
          console.log('📋 First sync attempt');
          newSocket.emit('get-room-members', { roomId });
        }, 1000);
        
        setTimeout(() => {
          console.log('📋 Second sync attempt');
          newSocket.emit('get-room-members', { roomId });
        }, 3000);
        
        setTimeout(() => {
          console.log('📋 Third sync attempt');
          newSocket.emit('get-room-members', { roomId });
        }, 5000);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO disconnected from room');
        setIsConnected(false);
      });

      // Error handling
      newSocket.on('connect_error', (error) => {
        console.error('Room socket connection failed:', error);
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
      });

      newSocket.on('room-error', (data) => {
        console.error('Room error:', data.message);
        setConnectionError(`Room error: ${data.message}`);
      });

      // CRITICAL: Handle direct join room response
      newSocket.on('joined-room', (response: any) => {
        console.log('✅ Successfully joined room event received:', response);
        console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data) {
          const roomData = response.data;
          console.log('🏠 Room data received:', roomData);
          setRoomData(roomData);
          
          if (roomData.members && Array.isArray(roomData.members)) {
            console.log('🏠 Processing members from joined-room:', roomData.members);
            console.log('🔢 Raw members count:', roomData.members.length);
            
            // Map server members to RoomMember format
            const mappedMembers: RoomMember[] = roomData.members.map((member: any, index: number) => {
              console.log(`👤 Mapping member ${index}:`, member);
              return {
                userId: member.userId || member.id,
                userName: member.userName || member.name,
                userAvatar: member.userPicture || member.picture || member.userAvatar,
                joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
                isTyping: false,
                isActive: member.isActive !== undefined ? member.isActive : true,
                isOnline: member.isOnline !== undefined ? member.isOnline : true,
                role: member.role || 'member'
              };
            });
            
            console.log('🎯 BEFORE setState - mappedMembers:', mappedMembers);
            console.log('🎯 BEFORE setState - mappedMembers length:', mappedMembers.length);
            
            // Force state update with fallback
            setRoomMembers(mappedMembers);
            setMemberCount(mappedMembers.length);
            
            // Force re-render to ensure UI updates
            setTimeout(() => {
              console.log('⏰ Force checking state after timeout...');
              setRoomMembers(prev => {
                console.log('🔄 Current state in timeout:', prev.length);
                if (prev.length === 0) {
                  console.log('🔄 State was empty, forcing update with mappedMembers:', mappedMembers);
                  return mappedMembers;
                }
                return prev;
              });
            }, 100);
            
            // Additional fallback
            setTimeout(() => {
              console.log('⏰ Final fallback check...');
              setRoomMembers(prev => {
                console.log('🔄 Final state check:', prev.length);
                return prev.length === 0 ? mappedMembers : prev;
              });
            }, 500);
            
            console.log('👥 Room members set from joined-room:', mappedMembers);
            console.log('📊 Member count set to:', mappedMembers.length);
            console.log('👑 Creator:', mappedMembers.find(m => m.role === 'creator')?.userName);
            
            addSystemMessage(`Joined room: ${roomData.roomName} (${mappedMembers.length} members)`, 'join');
          } else {
            console.log('❌ No members array found in roomData.members:', roomData.members);
          }
        } else {
          console.log('❌ Invalid response structure:', response);
        }
      });

      // Handle all possible server events that might contain member data
      newSocket.on('room-joined', (response: any) => {
        console.log('🚪 Room joined event:', response);
        if (response.data && response.data.members) {
          const mappedMembers: RoomMember[] = response.data.members.map((member: any) => ({
            userId: member.userId || member.id,
            userName: member.userName || member.name,
            userAvatar: member.userPicture || member.picture || member.userAvatar,
            joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
            isTyping: false,
            isActive: member.isActive !== undefined ? member.isActive : true,
            isOnline: member.isOnline !== undefined ? member.isOnline : true,
            role: member.role || 'member'
          }));
          
          setRoomMembers(mappedMembers);
          setMemberCount(mappedMembers.length);
          setRoomData(response.data);
          console.log('🎯 Members set from room-joined:', mappedMembers);
        }
      });

      newSocket.on('join-room-success', (response: any) => {
        console.log('✅ Join room success event:', response);
        if (response.data && response.data.members) {
          const mappedMembers: RoomMember[] = response.data.members.map((member: any) => ({
            userId: member.userId || member.id,
            userName: member.userName || member.name,
            userAvatar: member.userPicture || member.picture || member.userAvatar,
            joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
            isTyping: false,
            isActive: member.isActive !== undefined ? member.isActive : true,
            isOnline: member.isOnline !== undefined ? member.isOnline : true,
            role: member.role || 'member'
          }));
          
          setRoomMembers(mappedMembers);
          setMemberCount(mappedMembers.length);
          setRoomData(response.data);
          console.log('🎯 Members set from join-room-success:', mappedMembers);
        }
      });

      // Debug: catch all events to see what server sends
      newSocket.onAny((eventName, ...args) => {
        if (eventName.includes('room') || eventName.includes('member') || eventName.includes('join')) {
          console.log(`🎫 Socket event: ${eventName}`, args);
          
          // Try to auto-extract member data from any event
          const firstArg = args[0];
          if (firstArg && firstArg.data && firstArg.data.members && Array.isArray(firstArg.data.members)) {
            console.log('🔍 Auto-detected member data in event:', eventName);
            const mappedMembers: RoomMember[] = firstArg.data.members.map((member: any) => ({
              userId: member.userId || member.id,
              userName: member.userName || member.name,
              userAvatar: member.userPicture || member.picture || member.userAvatar,
              joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
              isTyping: false,
              isActive: member.isActive !== undefined ? member.isActive : true,
              isOnline: member.isOnline !== undefined ? member.isOnline : true,
              role: member.role || 'member'
            }));
            
            setRoomMembers(mappedMembers);
            setMemberCount(mappedMembers.length);
            console.log(`🎯 Auto-set members from ${eventName}:`, mappedMembers);
          }
        }
      });

      // Room message events
      newSocket.on('room-message', (data: RoomMessage) => {
        console.log('New room message:', data);
        setRoomMessages(prev => [...prev, data]);
      });

      newSocket.on('room-message-history', (data: { messages: RoomMessage[] }) => {
        console.log('Room message history:', data.messages);
        setRoomMessages(data.messages);
      });

      // Room member events
      newSocket.on('user-joined-room', (data: RoomMember) => {
        console.log('👤 User joined room:', data);
        setRoomMembers(prev => {
          const exists = prev.some(member => member.userId === data.userId);
          if (!exists) {
            const newMembers = [...prev, data];
            console.log('🏠 Updated room members after join:', newMembers);
            return newMembers;
          } else {
            console.log('👤 User already in member list:', data.userId);
            return prev;
          }
        });
        
        // Add system message
        const joinMessage: RoomMessage = {
          id: `system-join-${Date.now()}`,
          userId: 'system',
          userName: 'System',
          message: `${data.userName} joined the room`,
          messageType: 'system',
          timestamp: new Date().toISOString()
        };
        setRoomMessages(prev => [...prev, joinMessage]);
      });
      
      // Generic user-join event (fallback)
      newSocket.on('user-joined', (data: any) => {
        console.log('👤 User joined (generic):', data);
        if (data.id && data.name) {
          const newMember: RoomMember = {
            userId: data.id,
            userName: data.name,
            userAvatar: data.picture,
            joinedAt: new Date().toISOString(),
            isTyping: false
          };
          
          setRoomMembers(prev => {
            const exists = prev.some(member => member.userId === data.id);
            if (!exists) {
              console.log('➕ Adding user from generic join event');
              return [...prev, newMember];
            }
            return prev;
          });
        }
      });

      newSocket.on('user-left-room', (data: { userId: string; userName?: string }) => {
        console.log('👋 User left room:', data);
        setRoomMembers(prev => {
          const newMembers = prev.filter(member => member.userId !== data.userId);
          console.log('🏠 Updated room members after leave:', newMembers);
          return newMembers;
        });
        
        // Add system message
        if (data.userName) {
          const leaveMessage: RoomMessage = {
            id: `system-leave-${Date.now()}`,
            userId: 'system',
            userName: 'System',
            message: `${data.userName} left the room`,
            messageType: 'system',
            timestamp: new Date().toISOString()
          };
          setRoomMessages(prev => [...prev, leaveMessage]);
        }
      });

      newSocket.on('room-members-list', (data: { members: any[]; totalMembers?: number }) => {
        console.log('📋 Room members list received:', data.members);
        
        // Map server members to RoomMember format
        const mappedMembers: RoomMember[] = (data.members || []).map((member: any) => ({
          userId: member.userId || member.id,
          userName: member.userName || member.name,
          userAvatar: member.userPicture || member.picture || member.userAvatar,
          joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
          isTyping: false,
          isActive: member.isActive !== undefined ? member.isActive : true,
          isOnline: member.isOnline !== undefined ? member.isOnline : true,
          role: member.role || 'member'
        }));
        
        setRoomMembers(mappedMembers);
        setMemberCount(data.totalMembers || mappedMembers.length);
        addSystemMessage(`Updated member list (${mappedMembers.length} members)`, 'sync');
        console.log('👥 Mapped members:', mappedMembers.map(m => `${m.userName} (${m.role})`));
      });

      // Enhanced room sync events
      newSocket.on('room-members-updated', (data: { members: any[]; totalMembers?: number }) => {
        console.log('🔄 Members updated:', data.members);
        
        // Map server members to RoomMember format
        const mappedMembers: RoomMember[] = (data.members || []).map((member: any) => ({
          userId: member.userId || member.id,
          userName: member.userName || member.name,
          userAvatar: member.userPicture || member.picture || member.userAvatar,
          joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
          isTyping: false,
          isActive: member.isActive !== undefined ? member.isActive : true,
          isOnline: member.isOnline !== undefined ? member.isOnline : true,
          role: member.role || 'member'
        }));
        
        setRoomMembers(mappedMembers);
        setMemberCount(data.totalMembers || mappedMembers.length);
        addSystemMessage('Member list updated', 'sync');
      });

      newSocket.on('room-sync-update', (data: any) => {
        console.log('🔄 Room sync update:', data);
        if (data.roomData) {
          setRoomData(data.roomData);
        }
        if (data.members) {
          // Map server members to RoomMember format
          const mappedMembers: RoomMember[] = data.members.map((member: any) => ({
            userId: member.userId || member.id,
            userName: member.userName || member.name,
            userAvatar: member.userPicture || member.picture || member.userAvatar,
            joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
            isTyping: false,
            isActive: member.isActive !== undefined ? member.isActive : true,
            isOnline: member.isOnline !== undefined ? member.isOnline : true,
            role: member.role || 'member'
          }));
          
          setRoomMembers(mappedMembers);
          setMemberCount(data.totalMembers || mappedMembers.length);
        }
        addSystemMessage(`Room synced${data.syncedUser?.userName ? ` for ${data.syncedUser.userName}` : ''}`, 'sync');
      });

      newSocket.on('room-force-refresh', (data: any) => {
        console.log('🔄 Force refresh:', data);
        if (data.roomData) {
          setRoomData(data.roomData);
        }
        if (data.members) {
          // Map server members to RoomMember format
          const mappedMembers: RoomMember[] = data.members.map((member: any) => ({
            userId: member.userId || member.id,
            userName: member.userName || member.name,
            userAvatar: member.userPicture || member.picture || member.userAvatar,
            joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
            isTyping: false,
            isActive: member.isActive !== undefined ? member.isActive : true,
            isOnline: member.isOnline !== undefined ? member.isOnline : true,
            role: member.role || 'member'
          }));
          
          setRoomMembers(mappedMembers);
          setMemberCount(data.totalMembers || mappedMembers.length);
        }
        addSystemMessage('Room data refreshed', 'refresh');
      });

      newSocket.on('user-presence-change', (data: { userId: string; isOnline: boolean; isActive?: boolean }) => {
        console.log('👤 User presence change:', data);
        setRoomMembers(prev => 
          prev.map(member => 
            member.userId === data.userId 
              ? { 
                  ...member, 
                  isOnline: data.isOnline, 
                  isActive: data.isActive !== undefined ? data.isActive : member.isActive 
                }
              : member
          )
        );
      });
      
      // Force refresh room data
      newSocket.on('room-data-updated', async () => {
        console.log('🔄 Room data updated, refreshing...');
        try {
          const roomData = await roomService.getRoomInfo(roomId);
          const members: RoomMember[] = (roomData.members || []).map((member: any) => ({
            userId: member.userId || member.id,
            userName: member.userName || member.name,
            userAvatar: member.userPicture || member.picture || member.userAvatar,
            joinedAt: member.joinedAt || member.lastJoinedAt || new Date().toISOString(),
            isTyping: false,
            isActive: member.isActive !== undefined ? member.isActive : true,
            isOnline: member.isOnline !== undefined ? member.isOnline : true,
            role: member.role || 'member'
          }));
          setRoomMembers(members);
          setMemberCount(members.length);
          console.log('✅ Room members refreshed from server:', members);
        } catch (error) {
          console.error('❌ Failed to refresh room data:', error);
        }
      });

      // Typing events
      newSocket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
        setRoomMembers(prev => prev.map(member => 
          member.userId === data.userId 
            ? { ...member, isTyping: data.isTyping }
            : member
        ));
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up room socket connection');
        if (roomId) {
          newSocket.emit('leave-room', { 
            roomId,
            user: {
              userId: user.id,
              userName: user.name
            }
          });
        }
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setRoomMessages([]);
        setRoomMembers([]);
        setConnectionError(null);
      };
    }
  }, [user, roomId, SOCKET_URL]);

  const sendMessage = (message: string) => {
    if (socket && message.trim() && roomId) {
      socket.emit('room-message', {
        roomId,
        message: message.trim(),
        messageType: 'text'
      });
    }
  };

  const startTyping = () => {
    if (socket && roomId) {
      socket.emit('room-typing', { roomId, isTyping: true });
    }
  };

  const stopTyping = () => {
    if (socket && roomId) {
      socket.emit('room-typing', { roomId, isTyping: false });
    }
  };

  const refreshMembers = () => {
    if (socket && roomId) {
      console.log('🔄 Manual refresh members');
      socket.emit('get-room-members', { roomId });
    }
  };

  const forceRefreshRoom = () => {
    if (socket && roomId) {
      console.log('🔄 Force refresh room data');
      socket.emit('refresh-room-data', { roomId });
    }
  };

  // Add to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).roomDebug = {
        socket: socket,
        roomMembers: roomMembers,
        roomData: roomData,
        memberCount: memberCount,
        refreshMembers: refreshMembers,
        forceRefresh: forceRefreshRoom,
        checkConnection: () => console.log('Connected:', socket?.connected),
        getRoomData: () => console.log('Current room data:', roomData),
        getMembers: () => console.log('Current members:', roomMembers)
      };
    }
  }, [socket, roomMembers, roomData, memberCount]);

  return {
    socket,
    roomMessages,
    roomMembers,
    roomData,
    memberCount,
    isConnected,
    systemMessages,
    sendMessage,
    startTyping,
    stopTyping,
    refreshMembers,
    forceRefreshRoom,
    connectionError
  };
}; 