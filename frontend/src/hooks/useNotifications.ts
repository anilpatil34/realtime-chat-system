/* ============================================================
   Notifications Hook — Real-time notification via WebSocket
   ============================================================ */
'use client';

import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { Notification } from '@/types';
import toast from 'react-hot-toast';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMessage = useCallback((data: unknown) => {
    const wsData = data as { type: string; notification?: Notification; count?: number };

    switch (wsData.type) {
      case 'new_notification': {
        if (wsData.notification) {
          setNotifications((prev) => [wsData.notification!, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast(wsData.notification.title, {
            icon: '🔔',
            style: {
              background: '#1e1b4b',
              color: '#e0e7ff',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            },
          });
        }
        break;
      }
      case 'unread_count': {
        if (wsData.count !== undefined) {
          setUnreadCount(wsData.count);
        }
        break;
      }
    }
  }, []);

  const { sendMessage, isConnected } = useWebSocket({
    path: 'ws/notifications/',
    onMessage: handleMessage,
  });

  const markAsRead = useCallback(
    (notificationId: number) => {
      sendMessage({ type: 'mark_read', notification_id: notificationId });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    },
    [sendMessage]
  );

  const markAllAsRead = useCallback(() => {
    sendMessage({ type: 'mark_all_read' });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [sendMessage]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
  };
}
