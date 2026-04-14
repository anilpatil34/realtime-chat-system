/* ============================================================
   MessageInput — Responsive chat input bar
   ============================================================ */
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
  onSend: (content: string, attachment?: File) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleSend = useCallback(() => {
    if (!message.trim() && !attachment) return;
    onSend(message.trim(), attachment || undefined);
    setMessage('');
    setAttachment(null);
    setShowEmoji(false);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    inputRef.current?.focus();
  }, [message, attachment, onSend, onTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div ref={emojiRef} style={{ position: 'absolute', bottom: '100%', left: 10, zIndex: 50, marginBottom: 10 }}>
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* Attachment Preview Chip */}
      {attachment && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 10, zIndex: 40, marginBottom: 10,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
          borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)', fontSize: 13,
        }}>
          <Paperclip size={16} color="var(--primary-500)" />
          <span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {attachment.name}
          </span>
          <button
            onClick={() => setAttachment(null)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{
        padding: isMobile ? '8px 10px' : '12px 20px',
        paddingBottom: isMobile ? 'max(8px, env(safe-area-inset-bottom))' : '12px',
        borderTop: '1px solid var(--border-secondary)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'flex-end', gap: isMobile ? 6 : 10,
      }}>
        {/* Emoji Button */}
        {!isMobile && (
          <button
            onClick={() => setShowEmoji((prev) => !prev)}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <Smile size={20} />
          </button>
        )}

        {/* Attachment Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 10, flexShrink: 0,
            background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}
        >
          <Paperclip size={isMobile ? 18 : 20} />
        </button>

        {/* Text Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={inputRef}
            id="message-input"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              width: '100%', padding: isMobile ? '8px 12px' : '10px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12, color: 'var(--text-primary)',
              fontSize: isMobile ? 14 : 14, resize: 'none', outline: 'none',
              maxHeight: 100, lineHeight: 1.5,
              transition: 'border-color 0.2s',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
          />
        </div>

        {/* Send Button */}
        <button
          id="send-message-btn"
          onClick={handleSend}
          disabled={!message.trim() && !attachment}
          style={{
            width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
            borderRadius: 12, flexShrink: 0,
            background: (message.trim() || attachment)
              ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
              : 'var(--bg-tertiary)',
            border: 'none', cursor: (message.trim() || attachment) ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: (message.trim() || attachment) ? 'white' : 'var(--text-tertiary)',
            transition: 'all 0.2s ease',
            transform: (message.trim() || attachment) ? 'scale(1)' : 'scale(0.95)',
            boxShadow: (message.trim() || attachment) ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          <Send size={isMobile ? 18 : 20} />
        </button>
      </div>
    </div>
  );
}
