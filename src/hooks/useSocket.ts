import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { User } from '../types/user';

interface UseSocketReturn {
  socket: Socket | null;
  onlineUsers: User[];
  isConnected: boolean;
  connectionError: string | null;
}

export const useSocket = (user: User | null): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Sử dụng cùng base URL với API
  const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://20ac-2001-ee0-4b49-c580-797e-6c58-d5d7-bc67.ngrok-free.app';

  useEffect(() => {
    if (user) {
      console.log('Connecting to Socket.IO server:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });
      
      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket.IO connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        
        // Gửi thông tin user khi connect
        newSocket.emit('user-join', {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          joinTime: new Date().toISOString()
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setIsConnected(false);
      });

      // Error handling
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection failed:', error);
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
      });

      newSocket.on('join-error', (data) => {
        console.error('Join failed:', data.message);
        setConnectionError(`Join failed: ${data.message}`);
      });

      // User management events
      newSocket.on('online-users-list', (data: { users: User[] }) => {
        console.log('Online users updated:', data.users);
        setOnlineUsers(data.users);
      });

      newSocket.on('user-joined', (data: { user: User }) => {
        console.log('User joined:', data.user);
        setOnlineUsers(prev => {
          const exists = prev.some(u => u.id === data.user.id);
          if (!exists) {
            return [...prev, data.user];
          }
          return prev;
        });
      });

      newSocket.on('user-left', (data: { userId: string }) => {
        console.log('User left:', data.userId);
        setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
      });

      newSocket.on('user-status-change', (data: { userId: string; status: string }) => {
        console.log('User status changed:', data);
        // Có thể cập nhật UI khi có user thay đổi trạng thái
      });

      // Meeting events
      newSocket.on('meeting-created', (data) => {
        console.log('Meeting created:', data);
      });

      newSocket.on('meeting-joined', (data) => {
        console.log('Meeting joined:', data);
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        console.log('Cleaning up socket connection');
        newSocket.emit('user-leave', { userId: user.id });
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setConnectionError(null);
      };
    }
  }, [user, SOCKET_URL]);

  return { 
    socket, 
    onlineUsers, 
    isConnected, 
    connectionError 
  };
}; 