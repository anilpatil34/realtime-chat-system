/* ============================================================
   Chat WebSocket Hook — Handles chat-specific WS events
   ============================================================ */
'use client';

import { useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/contexts/AuthContext';
import { WSMessage, Message } from '@/types';

interface UseChatSocketOptions {
  roomId: number | null;
}

export function useChatSocket({ roomId }: UseChatSocketOptions) {
  const { user } = useAuth();
  const {
    addMessage,
    setTypingUser,
    updateMessageReadStatus,
    setUserOnline,
    updateRoom,
  } = useChatStore();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessage = useCallback(
    (data: unknown) => {
      const wsData = data as WSMessage;

      switch (wsData.type) {
        case 'chat_message': {
          const newMessage: Message = {
            id: wsData.message_id,
            room: Number(wsData.room_id),
            sender: wsData.sender_id,
            sender_username: wsData.sender_username,
            sender_avatar: wsData.sender_avatar,
            content: wsData.message,
            attachment: wsData.attachment || null,
            timestamp: wsData.timestamp,
            is_read: false,
            read_receipts: [],
            is_own_message: wsData.sender_id === user?.id,
          };
          addMessage(newMessage);

          // Update room's last message
          updateRoom(Number(wsData.room_id), {
            last_message: {
              id: wsData.message_id,
              content: wsData.message,
              sender_username: wsData.sender_username,
              timestamp: wsData.timestamp,
              is_read: false,
            },
          });
          break;
        }

        case 'typing': {
          setTypingUser(wsData.user_id, wsData.username, wsData.is_typing);

          // Auto-clear typing after 3 seconds
          if (wsData.is_typing) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setTypingUser(wsData.user_id, wsData.username, false);
            }, 3000);
          }
          break;
        }

        case 'read_receipt': {
          updateMessageReadStatus(wsData.message_ids);
          break;
        }

        case 'user_online': {
          setUserOnline(wsData.user_id, wsData.is_online);
          break;
        }

        case 'error': {
          console.error('[Chat WS] Error:', wsData.message);
          break;
        }
      }
    },
    [user?.id, addMessage, setTypingUser, updateMessageReadStatus, setUserOnline, updateRoom]
  );

  const { sendMessage, isConnected } = useWebSocket({
    path: `ws/chat/${roomId}/`,
    onMessage: handleMessage,
    enabled: !!roomId,
  });

  const sendChatMessage = useCallback(
    (message: string) => {
      sendMessage({ type: 'chat_message', message });
    },
    [sendMessage]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      sendMessage({ type: 'typing', is_typing: isTyping });
    },
    [sendMessage]
  );

  const sendReadReceipt = useCallback(
    (messageIds: number[]) => {
      sendMessage({ type: 'read_receipt', message_ids: messageIds });
    },
    [sendMessage]
  );

  return {
    sendChatMessage,
    sendTypingIndicator,
    sendReadReceipt,
    isConnected,
  };
}
