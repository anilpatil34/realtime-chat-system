/* ============================================================
   ChatHeader — Responsive with mobile back nav
   ============================================================ */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Video, MoreVertical, Users, Wifi, WifiOff } from 'lucide-react';
import { ChatRoom } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatLastSeen, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  room: ChatRoom;
  isConnected: boolean;
  onBackClick: () => void;
}

export default function ChatHeader({ room, isConnected, onBackClick }: ChatHeaderProps) {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showRinging, setShowRinging] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const otherUser = room.room_type === 'direct'
    ? room.members.find((m) => m.id !== user?.id)
    : null;

  const statusText = room.room_type === 'group'
    ? `${room.members.length} members`
    : otherUser?.is_online
      ? 'Online'
      : otherUser?.last_seen
        ? `Last seen ${formatLastSeen(otherUser.last_seen)}`
        : 'Offline';

  const handlePhoneClick = () => {
    if (room.room_type === 'group') {
      toast.error('Group calls are not supported yet.');
      return;
    }
    setCallType('audio');
    setShowRinging(true);
  };

  const handleVideoClick = () => {
    if (room.room_type === 'group') {
      toast.error('Group video calls are not supported yet.');
      return;
    }
    setCallType('video');
    setShowRinging(true);
  };

  const handleMoreClick = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <>
      <div style={{
        padding: isMobile ? '8px 10px' : '12px 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-secondary)',
        background: 'var(--bg-secondary)',
        minHeight: isMobile ? 52 : 68,
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flex: 1, minWidth: 0 }}>
          <button onClick={onBackClick} style={{
            width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10,
            background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0,
          }}>
            <ArrowLeft size={isMobile ? 16 : 18} />
          </button>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 12,
              background: room.room_type === 'group'
                ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                : 'linear-gradient(135deg, #4f46e5, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: isMobile ? 13 : 15,
            }}>
              {room.room_type === 'group' ? <Users size={isMobile ? 16 : 18} /> : room.display_avatar ? (
                <img src={room.display_avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              ) : getInitials(room.display_name || 'U')}
            </div>
            {otherUser?.is_online && (
              <div style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 11, height: 11, borderRadius: '50%',
                background: '#22c55e', border: '2px solid var(--bg-secondary)',
              }} />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? 14 : 15, fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {room.display_name || 'Chat'}
            </h3>
            <span style={{
              fontSize: isMobile ? 11 : 12,
              color: otherUser?.is_online ? '#22c55e' : 'var(--text-tertiary)',
            }}>
              {statusText}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 2 : 4, alignItems: 'center', flexShrink: 0 }}>
          {/* Connection status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: isMobile ? '3px 6px' : '4px 8px', borderRadius: 8,
            background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            fontSize: isMobile ? 10 : 11,
            color: isConnected ? '#22c55e' : '#ef4444',
          }}>
            {isConnected ? <Wifi size={isMobile ? 10 : 12} /> : <WifiOff size={isMobile ? 10 : 12} />}
            {!isMobile && (isConnected ? 'Live' : 'Offline')}
          </div>

          {!isMobile && (
            <>
              <button 
                onClick={handlePhoneClick}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
                title="Voice Call"
              >
                <Phone size={16} />
              </button>
              <button 
                onClick={handleVideoClick}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
                title="Video Call"
              >
                <Video size={16} />
              </button>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <button 
              onClick={handleMoreClick}
              style={{
                width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10,
                background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
              title="More Options"
            >
              <MoreVertical size={16} />
            </button>
            <AnimatePresence>
              {showDropdown && (
                <>
                  <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: -10 }} 
                    style={{ position: 'absolute', top: isMobile ? 44 : 48, right: 0, width: 180, background: 'var(--bg-secondary)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '1px solid var(--border-secondary)', padding: '8px 0', zIndex: 50 }}
                  >
                    {['Contact info', 'Select messages', 'Close chat', 'Mute notifications', 'Clear chat', 'Report'].map(opt => (
                      <button 
                        key={opt} 
                        onClick={() => { setShowDropdown(false); toast(opt, { icon: '⚙️' }); }} 
                        style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }} 
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} 
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Ringing Modal Overlay */}
      <AnimatePresence>
        {showRinging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 24, boxShadow: '0 0 40px rgba(79, 70, 229, 0.4)' }}>
              {room.display_avatar ? <img src={room.display_avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : getInitials(room.display_name || 'U')}
            </div>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{room.display_name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 60, fontSize: 16 }}>{callType === 'video' ? 'Calling video...' : 'Calling audio...'}</p>
            
            <div style={{ display: 'flex', gap: 32 }}>
              <button 
                onClick={() => setShowRinging(false)} 
                style={{ width: 64, height: 64, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}
                title="End Call"
              >
                <Phone size={28} style={{ transform: 'rotate(135deg)' }} />
              </button>
              <button 
                onClick={() => { setShowRinging(false); toast.success('Call functionally connected!'); }} 
                style={{ width: 64, height: 64, borderRadius: '50%', background: '#22c55e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)' }}
                title="Accept"
              >
                {callType === 'video' ? <Video size={28} /> : <Phone size={28} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
