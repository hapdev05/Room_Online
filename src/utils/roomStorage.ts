// Shared room storage for demo mode
// Simulates server-side room management using localStorage

interface StoredRoom {
  id: string;
  roomName: string;
  description: string;
  maxUsers: number;
  isPrivate: boolean;
  password?: string;
  roomCode: string;
  roomLink: string;
  createdBy: string;
  createdAt: string;
  members: any[];
}

const ROOMS_STORAGE_KEY = 'demo_rooms';

export const roomStorage = {
  // Save room to localStorage
  saveRoom: (room: StoredRoom): void => {
    try {
      const existingRooms = roomStorage.getAllRooms();
      existingRooms[room.roomCode] = room;
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(existingRooms));
      console.log(`Room ${room.roomCode} saved to storage`);
    } catch (error) {
      console.error('Error saving room:', error);
    }
  },

  // Get room by code
  getRoom: (roomCode: string): StoredRoom | null => {
    try {
      const rooms = roomStorage.getAllRooms();
      const room = rooms[roomCode];
      if (room) {
        console.log(`Room ${roomCode} found in storage`);
        return room;
      } else {
        console.log(`Room ${roomCode} not found in storage`);
        return null;
      }
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  },

  // Get all rooms
  getAllRooms: (): Record<string, StoredRoom> => {
    try {
      const stored = localStorage.getItem(ROOMS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting all rooms:', error);
      return {};
    }
  },

  // Add member to room
  addMemberToRoom: (roomCode: string, member: any): boolean => {
    try {
      const room = roomStorage.getRoom(roomCode);
      if (!room) return false;

      // Check if member already exists
      const memberExists = room.members.some(m => m.id === member.id);
      if (!memberExists) {
        room.members.push(member);
        roomStorage.saveRoom(room);
        console.log(`Member ${member.name} added to room ${roomCode}`);
      }
      return true;
    } catch (error) {
      console.error('Error adding member to room:', error);
      return false;
    }
  },

  // Remove member from room
  removeMemberFromRoom: (roomCode: string, memberId: string): boolean => {
    try {
      const room = roomStorage.getRoom(roomCode);
      if (!room) return false;

      room.members = room.members.filter(m => m.id !== memberId);
      roomStorage.saveRoom(room);
      console.log(`Member ${memberId} removed from room ${roomCode}`);
      return true;
    } catch (error) {
      console.error('Error removing member from room:', error);
      return false;
    }
  },

  // Check if room exists
  roomExists: (roomCode: string): boolean => {
    const room = roomStorage.getRoom(roomCode);
    return room !== null;
  },

  // Validate room password
  validateRoomPassword: (roomCode: string, password: string): boolean => {
    const room = roomStorage.getRoom(roomCode);
    if (!room) return false;
    
    if (!room.isPrivate) return true; // No password needed for public rooms
    
    return room.password === password;
  },

  // Delete room
  deleteRoom: (roomCode: string): boolean => {
    try {
      const rooms = roomStorage.getAllRooms();
      if (rooms[roomCode]) {
        delete rooms[roomCode];
        localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
        console.log(`Room ${roomCode} deleted from storage`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  },

  // Clear all rooms (for debugging)
  clearAllRooms: (): void => {
    try {
      localStorage.removeItem(ROOMS_STORAGE_KEY);
      console.log('All rooms cleared from storage');
    } catch (error) {
      console.error('Error clearing rooms:', error);
    }
  },

  // Generate random room code
  generateRoomCode: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (roomStorage.roomExists(result)) {
      return roomStorage.generateRoomCode(); // Retry if code exists
    }
    
    return result;
  }
}; 