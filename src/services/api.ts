import axios from 'axios';
import type { User } from '../types/user';

// Base URL cho server Node.js - có thể thay đổi theo môi trường
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://20ac-2001-ee0-4b49-c580-797e-6c58-d5d7-bc67.ngrok-free.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Service để gửi thông tin user lên server
export const userService = {
  // Gửi thông tin user sau khi login
  sendUserInfo: async (user: User) => {
    try {
      const response = await api.post('/api/users/login', {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        loginTime: new Date().toISOString()
      });
      
      console.log('User data sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending user data to server:', error);
      throw error;
    }
  },

  // Cập nhật thông tin user
  updateUser: async (userId: string, userData: Partial<User>) => {
    try {
      const response = await api.put(`/api/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  },

  // Gửi thông tin logout
  sendLogout: async (userId: string) => {
    try {
      const response = await api.post('/api/users/logout', {
        id: userId,
        logoutTime: new Date().toISOString()
      });
      
      console.log('Logout sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending logout to server:', error);
      throw error;
    }
  }
};

// Room service để quản lý phòng họp
export const roomService = {
  // Tạo phòng mới
  createRoom: async (user: User, roomData: {
    roomName: string;
    description: string;
    maxUsers: number;
    isPrivate: boolean;
    password?: string;
  }) => {
    try {
      const response = await api.post('/api/rooms', {
        user,
        ...roomData
      });
      
      console.log('Room created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  // Tham gia phòng
  joinRoom: async (user: User, roomCode: string, password?: string) => {
    try {
      const response = await api.post(`/api/rooms/join/${roomCode}`, {
        user,
        password
      });
      
      console.log('Joined room successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },

  // Lấy thông tin phòng
  getRoomInfo: async (roomId: string) => {
    try {
      const response = await api.get(`/api/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting room info:', error);
      throw error;
    }
  },

  // Rời khỏi phòng
  leaveRoom: async (user: User, roomId: string) => {
    try {
      const response = await api.post(`/api/rooms/${roomId}/leave`, {
        user
      });
      
      console.log('Left room successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  },

  // Lấy danh sách phòng của user
  getUserRooms: async (userId: string) => {
    try {
      const response = await api.get(`/api/users/${userId}/rooms`);
      return response.data;
    } catch (error) {
      console.error('Error getting user rooms:', error);
      throw error;
    }
  }
};

export default api; 