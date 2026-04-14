/* ============================================================
   TypingIndicator — Animated dots showing who's typing
   ============================================================ */
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  usernames: string[];
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  const text = usernames.length === 1
    ? `${usernames[0]} is typing`
    : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are typing`
      : `${usernames[0]} and ${usernames.length - 1} others are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 0', marginLeft: 40,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: '16px 16px 16px 4px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-secondary)',
      }}>
        {/* Animated dots */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="typing-dot"
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--primary-400)',
              }}
            />
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {text}
        </span>
      </div>
    </motion.div>
  );
}
