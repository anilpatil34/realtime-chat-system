/* ============================================================
   Chat State Store — Zustand for real-time chat state
   ============================================================ */
import { create } from 'zustand';
import { ChatRoom, Message, User } from '@/types';

interface ChatState {
  // Rooms
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  setRooms: (rooms: ChatRoom[]) => void;
  setActiveRoom: (room: ChatRoom | null) => void;
  updateRoom: (roomId: number, updates: Partial<ChatRoom>) => void;
  addRoom: (room: ChatRoom) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageReadStatus: (messageIds: number[]) => void;

  // Typing
  typingUsers: Map<number, string>;
  setTypingUser: (userId: number, username: string, isTyping: boolean) => void;

  // Online users
  onlineUsers: Set<number>;
  setUserOnline: (userId: number, isOnline: boolean) => void;

  // UI
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Rooms
  rooms: [],
  activeRoom: null,
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (room) => set({ activeRoom: room }),
  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, ...updates } : r
      ),
    })),
  addRoom: (room) =>
    set((state) => ({
      rooms: [room, ...state.rooms.filter((r) => r.id !== room.id)],
    })),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessageReadStatus: (messageIds) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        messageIds.includes(m.id) ? { ...m, is_read: true } : m
      ),
    })),

  // Typing
  typingUsers: new Map(),
  setTypingUser: (userId, username, isTyping) =>
    set((state) => {
      const newMap = new Map(state.typingUsers);
      if (isTyping) {
        newMap.set(userId, username);
      } else {
        newMap.delete(userId);
      }
      return { typingUsers: newMap };
    }),

  // Online users
  onlineUsers: new Set(),
  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      if (isOnline) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return { onlineUsers: newSet };
    }),

  // UI
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
