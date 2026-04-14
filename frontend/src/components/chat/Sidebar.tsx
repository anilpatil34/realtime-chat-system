/* ============================================================
   Sidebar — Fully responsive with mobile drawer overlay
   ============================================================ */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Users, MessageCircle, LogOut, Moon, Sun,
  Bell, X, UserPlus, Hash, Check, CheckCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { ChatRoom, User } from '@/types';
import { formatChatListTime, truncate, getInitials } from '@/lib/utils';
import api from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import ProfileModal from './ProfileModal';
import NotificationDropdown from './NotificationDropdown';
import CreateUserModal from './CreateUserModal';

interface SidebarProps {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  onCreateDirectChat: (userId: number) => void;
  onCreateGroup: (name: string, memberIds: number[]) => void;
  isLoading: boolean;
  unreadNotifications: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  rooms, activeRoom, onSelectRoom, onCreateDirectChat,
  onCreateGroup, isLoading, unreadNotifications, isOpen, onToggle,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  // Track mobile state
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch users for new chat
  useEffect(() => {
    const fetchUsers = () => {
      api.get('/auth/users/').then((res) => {
        setAllUsers(res.data.results || res.data);
      }).catch(console.error);
    };
    fetchUsers();
    // Also re-fetch occasionally or when modal closes
  }, [showNewChat, showNewGroup]);

  const filteredRooms = rooms.filter((room) =>
    room.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = allUsers.filter((u) => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreateGroup(groupName.trim(), selectedMembers);
      setShowNewGroup(false);
      setGroupName('');
      setSelectedMembers([]);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    onSelectRoom(room);
  };

  // Sidebar content wrapper
  const sidebarContent = (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-secondary)',
      width: isMobile ? '100%' : 380,
      maxWidth: isMobile ? '100%' : 380,
      minWidth: isMobile ? '100%' : 320,
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '12px 16px' : '16px 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-secondary)',
        minHeight: isMobile ? 56 : 68,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageCircle size={isMobile ? 18 : 20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: 'var(--text-primary)' }}>Chats</h2>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.username}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} title="Notifications" style={{
            position: 'relative', width: 34, height: 34, borderRadius: 10,
            background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            <Bell size={16} />
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 18, height: 18, borderRadius: '50%',
                background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          <button onClick={toggleTheme} title="Toggle theme" style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button onClick={() => { setShowNewChat(true); setShowNewGroup(false); }}
            title="New Chat" style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: isMobile ? '10px 16px' : '12px 20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }} />
          <input
            id="chat-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="input-field"
            style={{ paddingLeft: 36, padding: '10px 12px 10px 36px', fontSize: 13, borderRadius: 10 }}
          />
        </div>
      </div>

      {/* New Group & Add User buttons */}
      <div style={{ padding: isMobile ? '0 16px 6px' : '0 20px 8px', display: 'flex', gap: 8 }}>
        <button onClick={() => { setShowNewGroup(true); setShowNewChat(false); }} style={{
          flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
          borderRadius: 10, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13,
        }}>
          <Users size={16} style={{ color: 'var(--primary-400)' }} />
          Group
        </button>
        <button onClick={() => setShowAddUserModal(true)} style={{
          flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
          borderRadius: 10, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13,
        }}>
          <UserPlus size={16} style={{ color: '#10b981' }} />
          New User
        </button>
      </div>

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '4px 6px' : '4px 8px' }}>
        {isLoading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px', marginBottom: 4,
                opacity: 0.5, animation: 'pulse 2s infinite',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-tertiary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 14, background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ width: '80%', height: 12, background: 'var(--bg-tertiary)', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <MessageCircle size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Click + to start chatting
            </p>
          </div>
        ) : (
          <div style={{ paddingBottom: 20 }}>
            {searchQuery && <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Chats</p>}
            
            <AnimatePresence>
              {filteredRooms.map((room, index) => {
                const hasUnread = room.unread_count > 0;
                const lastMsgIsOwn = room.last_message?.sender_username === user?.username;

                return (
                  <motion.div
                    key={`room-${room.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectRoom(room)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12,
                      padding: isMobile ? '10px 8px' : '12px', borderRadius: 12, cursor: 'pointer',
                      marginBottom: 2, transition: 'all 0.15s ease',
                      background: activeRoom?.id === room.id ? 'var(--bg-hover)' : hasUnread ? 'rgba(99,102,241,0.04)' : 'transparent',
                      borderLeft: activeRoom?.id === room.id ? '3px solid var(--primary-500)' : hasUnread ? '3px solid var(--primary-400)' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (activeRoom?.id !== room.id) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeRoom?.id !== room.id) {
                        (e.currentTarget as HTMLElement).style.background = hasUnread ? 'rgba(99,102,241,0.04)' : 'transparent';
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: isMobile ? 44 : 48, height: isMobile ? 44 : 48, borderRadius: 14,
                        background: room.room_type === 'group'
                          ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                          : 'linear-gradient(135deg, #4f46e5, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: isMobile ? 14 : 16,
                      }}>
                        {room.room_type === 'group' ? (
                          <Users size={isMobile ? 18 : 20} />
                        ) : room.display_avatar ? (
                          <img src={room.display_avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                        ) : (
                          getInitials(room.display_name || 'U')
                        )}
                      </div>
                      {room.room_type === 'direct' && room.members.some((m) => m.id !== user?.id && m.is_online) && (
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: 13, height: 13, borderRadius: '50%',
                          background: '#22c55e', border: '2px solid var(--bg-secondary)',
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{
                          fontSize: isMobile ? 13 : 14, fontWeight: hasUnread ? 700 : 500,
                          color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {room.display_name || 'Unknown'}
                        </span>
                        {room.last_message && (
                          <span style={{
                            fontSize: 11,
                            color: hasUnread ? 'var(--primary-400)' : 'var(--text-tertiary)',
                            flexShrink: 0, fontWeight: hasUnread ? 600 : 400,
                          }}>
                            {formatChatListTime(room.last_message.timestamp)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          flex: 1, minWidth: 0,
                        }}>
                          {/* Read receipt icon in sidebar */}
                          {lastMsgIsOwn && room.last_message && (
                            <span style={{
                              display: 'flex', alignItems: 'center', flexShrink: 0,
                              color: room.last_message.is_read ? '#60a5fa' : 'var(--text-tertiary)',
                            }}>
                              {room.last_message.is_read ? <CheckCheck size={14} /> : <Check size={14} />}
                            </span>
                          )}
                          <span style={{
                            fontSize: isMobile ? 12 : 13,
                            color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: hasUnread ? 500 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {room.last_message
                              ? `${room.room_type === 'group' && !lastMsgIsOwn ? room.last_message.sender_username + ': ' : ''}${truncate(room.last_message.content, isMobile ? 25 : 35)}`
                              : 'No messages yet'}
                          </span>
                        </div>
                        {hasUnread && (
                          <span style={{
                            minWidth: 20, height: 20, borderRadius: 10,
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            color: 'white', fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0 6px', flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                          }}>
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {searchQuery && filteredContacts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contacts</p>
                {filteredContacts.map(u => (
                  <div key={`contact-${u.id}`} onClick={() => { onCreateDirectChat(u.id); setSearchQuery(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 14,
                      }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                        ) : (
                          getInitials(u.username)
                        )}
                      </div>
                      {u.is_online && (
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: 11, height: 11, borderRadius: '50%',
                          background: '#22c55e', border: '2px solid var(--bg-secondary)',
                        }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{u.bio || 'Available'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User footer */}
      <div style={{
        padding: isMobile ? '10px 16px' : '12px 20px',
        borderTop: '1px solid var(--border-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => setShowProfileModal(true)}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 13,
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            ) : (
              getInitials(user?.username || 'U')
            )}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</p>
            <p style={{ fontSize: 11, color: '#22c55e' }}>● Online (Profile)</p>
          </div>
        </div>
        <button onClick={logout} title="Logout" style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'all 0.2s',
        }}>
          <LogOut size={16} />
        </button>
      </div>

      <NotificationDropdown 
        isOpen={showNotifDropdown} 
        onClose={() => setShowNotifDropdown(false)} 
        notifications={notifications}
        unreadCount={unreadNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
      
      <AnimatePresence>
        {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAddUserModal && (
          <CreateUserModal 
            onClose={() => setShowAddUserModal(false)}
            onSuccess={() => {
              // Trigger refetch of users list by toggling new chat mode briefly
              setShowNewChat(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: isMobile ? 12 : 20,
            }}
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%', maxWidth: isMobile ? '95%' : 380,
                maxHeight: isMobile ? '85vh' : '70vh',
                display: 'flex', flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '16px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <UserPlus size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  New Chat
                </h3>
                <button onClick={() => setShowNewChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
                {allUsers.map((u) => (
                  <div key={u.id} onClick={() => { onCreateDirectChat(u.id); setShowNewChat(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                      borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                      ) : (
                        getInitials(u.username)
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</p>
                      <p style={{ fontSize: 12, color: u.is_online ? '#22c55e' : 'var(--text-tertiary)' }}>
                        {u.is_online ? '● Online' : u.bio || 'Offline'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Group Modal */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: isMobile ? 12 : 20,
            }}
            onClick={() => setShowNewGroup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%', maxWidth: isMobile ? '95%' : 380,
                maxHeight: isMobile ? '85vh' : '80vh',
                display: 'flex', flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '16px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Hash size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  New Group
                </h3>
                <button onClick={() => setShowNewGroup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '0 16px 10px' }}>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name" className="input-field" />
              </div>
              <p style={{ padding: '0 16px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Select members:</p>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
                {allUsers.map((u) => (
                  <label key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px',
                    borderRadius: 10, cursor: 'pointer',
                  }}>
                    <input type="checkbox" checked={selectedMembers.includes(u.id)}
                      onChange={(e) => {
                        setSelectedMembers(
                          e.target.checked
                            ? [...selectedMembers, u.id]
                            : selectedMembers.filter((id) => id !== u.id)
                        );
                      }}
                      style={{ accentColor: 'var(--primary-500)', width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{u.username}</span>
                  </label>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-secondary)' }}>
                <button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedMembers.length === 0}
                  className="btn-primary" style={{ fontSize: 13 }}>
                  Create Group ({selectedMembers.length} members)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // MOBILE: Render as full-screen overlay
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onToggle}
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                  zIndex: 49,
                }}
              />
              {/* Sidebar panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                  position: 'fixed', top: 0, left: 0, bottom: 0,
                  width: '85%', maxWidth: 380, zIndex: 50,
                  boxShadow: '4px 0 30px rgba(0,0,0,0.3)',
                }}
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile FAB toggle */}
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onToggle}
            style={{
              position: 'fixed', bottom: 24, left: 20, zIndex: 40,
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              border: 'none', cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
            }}
          >
            <MessageCircle size={22} />
          </motion.button>
        )}
      </>
    );
  }

  // DESKTOP: Render inline
  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 380 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        height: '100vh', overflow: 'hidden', flexShrink: 0,
        borderRight: '1px solid var(--border-secondary)',
      }}
    >
      {sidebarContent}
    </motion.div>
  );
}
