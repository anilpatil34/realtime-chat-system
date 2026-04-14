/* ============================================================
   NotificationDropdown — Popover for recent notifications
   ============================================================ */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Bell, MessageCircle } from 'lucide-react';
import { Notification } from '@/types';
import { formatChatListTime } from '@/lib/utils';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationDropdown({
  isOpen, onClose, notifications, unreadCount, onMarkAsRead, onMarkAllAsRead
}: NotificationDropdownProps) {
  
  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to close dropdown */}
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
        onClick={onClose} 
      />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="glass-card"
        style={{
          position: 'absolute', top: 56, right: 20, zIndex: 100,
          width: 'calc(100vw - 40px)', maxWidth: 320, maxHeight: 400,
          background: 'var(--bg-secondary)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ 
          padding: '16px', borderBottom: '1px solid var(--border-secondary)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} /> Notifications
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444', color: 'white', borderRadius: 10,
                padding: '2px 8px', fontSize: 11, fontWeight: 700,
              }}>
                {unreadCount} new
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead} 
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                color: 'var(--primary-400)', fontSize: 13, fontWeight: 600 
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
              <Bell size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!notification.is_read) onMarkAsRead(notification.id);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-secondary)',
                    background: notification.is_read ? 'transparent' : 'rgba(99,102,241,0.05)',
                    cursor: 'pointer', display: 'flex', gap: 12,
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                    color: 'var(--primary-400)'
                  }}>
                    <MessageCircle size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: notification.is_read ? 500 : 700, color: 'var(--text-primary)' }}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', marginTop: 4, flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>
                      {notification.message}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatChatListTime(notification.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </>
  );
}
