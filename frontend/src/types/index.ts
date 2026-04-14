/* ============================================================
   TypeScript Type Definitions for the Real-Time Chat System
   ============================================================ */

// ── User Types ──
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string;
  mobile_number?: string;
  is_online: boolean;
  last_seen: string;
  date_joined: string;
}

// ── Auth Types ──
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

// ── Chat Types ──
export interface ChatRoom {
  id: number;
  name: string;
  room_type: 'direct' | 'group';
  members: User[];
  avatar: string | null;
  created_at: string;
  updated_at: string;
  last_message: LastMessage | null;
  unread_count: number;
  display_name: string;
  display_avatar: string | null;
}

export interface LastMessage {
  id: number;
  content: string;
  sender_username: string;
  timestamp: string;
  is_read: boolean;
}

export interface Message {
  id: number;
  room: number;
  sender: number;
  sender_username: string;
  sender_avatar: string | null;
  content: string;
  attachment: string | null;
  timestamp: string;
  is_read: boolean;
  read_receipts: ReadReceipt[];
  is_own_message: boolean;
}

export interface ReadReceipt {
  id: number;
  user: number;
  username: string;
  read_at: string;
}

// ── WebSocket Message Types ──
export interface WSChatMessage {
  type: 'chat_message';
  message_id: number;
  message: string;
  sender_id: number;
  sender_username: string;
  sender_avatar: string | null;
  timestamp: string;
  room_id: string;
  attachment?: string | null;
}

export interface WSTypingIndicator {
  type: 'typing';
  user_id: number;
  username: string;
  is_typing: boolean;
  room_id: string;
}

export interface WSReadReceipt {
  type: 'read_receipt';
  user_id: number;
  username: string;
  message_ids: number[];
  read_at: string;
  room_id: string;
}

export interface WSUserOnline {
  type: 'user_online';
  user_id: number;
  username: string;
  is_online: boolean;
}

export interface WSError {
  type: 'error';
  message: string;
}

export type WSMessage = WSChatMessage | WSTypingIndicator | WSReadReceipt | WSUserOnline | WSError;

// ── Notification Types ──
export interface Notification {
  id: number;
  notification_type: 'message' | 'room_invite' | 'mention' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  room_id: number | null;
  created_at: string;
}

export interface WSNotification {
  type: 'new_notification';
  notification: Notification;
}

export interface WSUnreadCount {
  type: 'unread_count';
  count: number;
}

// ── API Response Types ──
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
