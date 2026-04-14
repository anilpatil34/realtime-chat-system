/* ============================================================
   MessageBubble — Responsive with enhanced read/seen/unread
   ============================================================ */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { Message } from '@/types';
import { formatMessageTime, getInitials } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isGroup: boolean;
}

export default function MessageBubble({ message, isOwn, showAvatar, isGroup }: MessageBubbleProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Determine read status
  const getReadStatus = () => {
    if (!isOwn) return null;

    if (message.read_receipts && message.read_receipts.length > 0) {
      // Has read receipts — seen by others
      return 'seen';
    }
    if (message.is_read) {
      // Marked as read
      return 'read';
    }
    if (message.id) {
      // Has an ID — delivered to server
      return 'delivered';
    }
    // Still sending
    return 'sending';
  };

  const readStatus = getReadStatus();

  const renderReadReceipt = () => {
    if (!isOwn || !readStatus) return null;

    switch (readStatus) {
      case 'sending':
        return (
          <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <Clock size={12} />
          </span>
        );
      case 'delivered':
        return (
          <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }} title="Delivered">
            <Check size={14} />
          </span>
        );
      case 'read':
      case 'seen':
        return (
          <span style={{ display: 'flex', alignItems: 'center', color: '#60a5fa' }} title="Seen">
            <CheckCheck size={14} />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: isMobile ? 6 : 8,
        marginTop: showAvatar ? 8 : 1,
        paddingLeft: isOwn ? (isMobile ? 40 : 60) : 0,
        paddingRight: isOwn ? 0 : (isMobile ? 40 : 60),
      }}
    >
      {/* Avatar (non-own messages) */}
      {!isOwn && (
        <div style={{
          width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
          borderRadius: isMobile ? 8 : 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: isMobile ? 10 : 12,
          opacity: showAvatar ? 1 : 0,
        }}>
          {message.sender_avatar ? (
            <img src={message.sender_avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
          ) : (
            getInitials(message.sender_username)
          )}
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: isMobile ? '85%' : '75%', position: 'relative' }}>
        {/* Sender name for group chats */}
        {isGroup && !isOwn && showAvatar && (
          <p style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--primary-400)',
            marginBottom: 3, marginLeft: isMobile ? 10 : 12,
          }}>
            {message.sender_username}
          </p>
        )}

        <div style={{
          padding: isMobile ? '8px 12px' : '10px 14px',
          borderRadius: isOwn
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          background: isOwn
            ? 'linear-gradient(135deg, #4f46e5, #5b5bd6)'
            : 'var(--bg-tertiary)',
          color: isOwn ? 'white' : 'var(--text-primary)',
          boxShadow: isOwn
            ? '0 2px 12px rgba(79,70,229,0.25)'
            : '0 1px 4px rgba(0,0,0,0.1)',
          border: isOwn ? 'none' : '1px solid var(--border-secondary)',
        }}>
          {message.attachment && (
            <div style={{ marginBottom: message.content ? 8 : 0 }}>
               {message.attachment.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                 <img src={message.attachment} alt="Attachment" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />
               ) : (
                 <a href={message.attachment} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: 8, color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}>
                   &#128206; {message.attachment.split('/').pop()?.split('?')[0]}
                 </a>
               )}
            </div>
          )}

          {message.content && (
            <p style={{
              fontSize: isMobile ? 13 : 14, lineHeight: 1.5,
              wordBreak: 'break-word', whiteSpace: 'pre-wrap',
            }}>
              {message.content}
            </p>
          )}

          {/* Timestamp + Read receipt */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 4, marginTop: 3,
          }}>
            <span style={{
              fontSize: isMobile ? 9 : 10,
              color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)',
            }}>
              {formatMessageTime(message.timestamp)}
            </span>

            {renderReadReceipt()}
          </div>
        </div>

        {/* Seen by tooltip for group chats */}
        {isOwn && isGroup && message.read_receipts && message.read_receipts.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 4, marginTop: 2, paddingRight: 4,
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Seen by {message.read_receipts.map(r => r.username).join(', ')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
