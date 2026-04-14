/* ============================================================
   EmptyChat — Responsive empty state placeholder
   ============================================================ */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Shield, Zap, Globe } from 'lucide-react';

export default function EmptyChat() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.05) 0%, transparent 50%),
          var(--bg-primary)
        `,
        padding: isMobile ? 20 : 40,
      }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
        style={{
          width: isMobile ? 72 : 100, height: isMobile ? 72 : 100,
          borderRadius: isMobile ? 20 : 28,
          background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: isMobile ? 16 : 24, border: '1px solid var(--border-primary)',
        }}
      >
        <MessageCircle size={isMobile ? 34 : 48} style={{ color: 'var(--primary-400)' }} />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: isMobile ? 20 : 24, fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center',
        }}
      >
        Welcome to ChatApp
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: isMobile ? 13 : 15, color: 'var(--text-secondary)',
          marginBottom: isMobile ? 24 : 40, textAlign: 'center', maxWidth: 400,
        }}
      >
        Select a conversation or start a new one to begin chatting
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 10 : 16, maxWidth: 500, width: '100%',
        }}
      >
        {[
          { icon: <Shield size={isMobile ? 18 : 22} />, label: 'End-to-end Secure' },
          { icon: <Zap size={isMobile ? 18 : 22} />, label: 'Real-time Messaging' },
          { icon: <Globe size={isMobile ? 18 : 22} />, label: 'Always Connected' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: isMobile ? '12px 16px' : '20px 16px',
            borderRadius: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
            textAlign: 'center',
            display: isMobile ? 'flex' : 'block',
            alignItems: 'center', gap: isMobile ? 12 : 0,
          }}>
            <div style={{
              color: 'var(--primary-400)', marginBottom: isMobile ? 0 : 10,
              display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center',
            }}>
              {item.icon}
            </div>
            <p style={{
              fontSize: 12, color: 'var(--text-tertiary)',
              lineHeight: 1.4,
            }}>
              {item.label}
            </p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
