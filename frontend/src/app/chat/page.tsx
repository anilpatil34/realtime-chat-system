/* ============================================================
   Main Chat Page — Sidebar + Chat Window
   ============================================================ */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChatStore } from '@/stores/chatStore';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useNotifications } from '@/hooks/useNotifications';
import api from '@/lib/api';
import { ChatRoom, Message, PaginatedResponse } from '@/types';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import EmptyChat from '@/components/chat/EmptyChat';

export default function ChatPage() {
  const { user } = useAuth();
  const {
    rooms, setRooms, activeRoom, setActiveRoom,
    messages, setMessages, addMessage,
    isSidebarOpen, setSidebarOpen, updateRoom,
  } = useChatStore();

  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const { unreadCount } = useNotifications();
  const { sendChatMessage, sendTypingIndicator, sendReadReceipt, isConnected } = useChatSocket({
    roomId: activeRoom?.id || null,
  });

  // Fetch chat rooms
  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<ChatRoom>>('/chat/rooms/');
      setRooms(response.data.results || response.data as unknown as ChatRoom[]);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [setRooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Fetch messages when active room changes
  const fetchMessages = useCallback(async (roomId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await api.get<PaginatedResponse<Message>>(`/chat/rooms/${roomId}/messages/`);
      const msgs = response.data.results || response.data as unknown as Message[];
      setMessages(msgs.reverse());

      // Mark messages as read
      const unreadIds = msgs
        .filter((m) => !m.is_read && m.sender !== user?.id)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        sendReadReceipt(unreadIds);
        await api.post(`/chat/rooms/${roomId}/read/`);
      }
      
      // Update local room store immediately so the unread badge clears
      updateRoom(roomId, { unread_count: 0 });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [setMessages, user?.id, sendReadReceipt]);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id);
    }
  }, [activeRoom, fetchMessages]);

  // Handle room selection
  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    // On mobile, close sidebar when room is selected
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string, attachment?: File) => {
    if ((!content.trim() && !attachment) || !activeRoom) return;
    
    if (attachment) {
      try {
        const formData = new FormData();
        if (content.trim()) {
           formData.append('content', content);
        }
        formData.append('attachment', attachment);
        await api.post(`/chat/rooms/${activeRoom.id}/messages/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch(err) {
         console.error('Failed to send attachment:', err);
      }
    } else {
      sendChatMessage(content);
    }
  };

  // Handle creating a new direct chat
  const handleCreateDirectChat = async (userId: number) => {
    try {
      const response = await api.post<ChatRoom>('/chat/rooms/direct/', { user_id: userId });
      const room = response.data;
      setActiveRoom(room);
      await fetchRooms();
    } catch (err) {
      console.error('Failed to create direct chat:', err);
    }
  };

  // Handle creating a group chat
  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    try {
      const response = await api.post<ChatRoom>('/chat/rooms/group/', {
        name,
        member_ids: memberIds,
      });
      const room = response.data;
      setActiveRoom(room);
      await fetchRooms();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        onCreateDirectChat={handleCreateDirectChat}
        onCreateGroup={handleCreateGroup}
        isLoading={isLoadingRooms}
        unreadNotifications={unreadCount}
        isOpen={isSidebarOpen}
        onToggle={() => setSidebarOpen(!isSidebarOpen)}
      />

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        position: 'relative',
      }}>
        <AnimatePresence mode="wait">
          {activeRoom ? (
            <motion.div
              key={activeRoom.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <ChatWindow
                room={activeRoom}
                messages={messages}
                isLoading={isLoadingMessages}
                isConnected={isConnected}
                onSendMessage={handleSendMessage}
                onTyping={sendTypingIndicator}
                onBackClick={() => {
                  setActiveRoom(null);
                  setSidebarOpen(true);
                }}
              />
            </motion.div>
          ) : (
            <EmptyChat key="empty" />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
