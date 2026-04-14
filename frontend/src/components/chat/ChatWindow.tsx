/* ============================================================
   ChatWindow — Responsive main chat area
   ============================================================ */
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChatRoom, Message } from '@/types';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/contexts/AuthContext';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { ChevronDown } from 'lucide-react';

interface ChatWindowProps {
  room: ChatRoom;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  onSendMessage: (content: string, attachment?: File) => void;
  onTyping: (isTyping: boolean) => void;
  onBackClick: () => void;
}

export default function ChatWindow({
  room, messages, isLoading, isConnected,
  onSendMessage, onTyping, onBackClick,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { typingUsers } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setNewMessageCount(0);
    } else if (!isAtBottom && messages.length > 0) {
      // Count new unread messages when not at bottom
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender !== user?.id) {
        setNewMessageCount(prev => prev + 1);
      }
    }
  }, [messages, isAtBottom, user?.id]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMessageCount(0);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0);
  };

  // Get typing users for this room (exclude self)
  const activeTypingUsers = Array.from(typingUsers.entries())
    .filter(([id]) => id !== user?.id)
    .map(([, name]) => name);

  // Count unread messages visible
  const unreadMsgCount = messages.filter(m => !m.is_read && m.sender !== user?.id).length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-primary)',
    }}>
      {/* Header */}
      <ChatHeader room={room} isConnected={isConnected} onBackClick={onBackClick} />

      {/* Unread messages banner */}
      {unreadMsgCount > 0 && (
        <div style={{
          padding: '4px 16px',
          background: 'rgba(99,102,241,0.1)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--primary-400)',
          fontWeight: 500,
        }}>
          {unreadMsgCount} unread message{unreadMsgCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '12px 10px' : '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 4,
          background: `
            radial-gradient(ellipse at 10% 90%, rgba(99,102,241,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 10%, rgba(139,92,246,0.03) 0%, transparent 50%),
            var(--bg-primary)
          `,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start',
                width: `${Math.random() * 30 + 30}%`,
                height: 44, borderRadius: 16,
                background: 'var(--bg-tertiary)', opacity: 0.4,
                animation: 'pulse 2s infinite',
              }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5,
            padding: isMobile ? '20px 10px' : '20px',
          }}>
            <div style={{
              width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: 20,
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: isMobile ? 24 : 28 }}>&#128075;</span>
            </div>
            <p style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center' }}>
              No messages yet
            </p>
            <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Send the first message to start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender === user?.id || message.is_own_message;
              const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  isGroup={room.room_type === 'group'}
                />
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {activeTypingUsers.length > 0 && (
          <TypingIndicator usernames={activeTypingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom / New messages floating button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: isMobile ? 70 : 80,
            right: isMobile ? 16 : 24,
            minWidth: 40, height: 40, borderRadius: 20,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 4, padding: newMessageCount > 0 ? '0 12px' : '0',
            color: 'var(--text-secondary)', boxShadow: 'var(--shadow-md)', zIndex: 10,
            fontSize: 12, fontWeight: 600,
          }}
        >
          {newMessageCount > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: 'white', borderRadius: 10,
              padding: '2px 6px', fontSize: 11, fontWeight: 700,
            }}>
              {newMessageCount} new
            </span>
          )}
          <ChevronDown size={18} />
        </button>
      )}

      {/* Message Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} />
    </div>
  );
}
