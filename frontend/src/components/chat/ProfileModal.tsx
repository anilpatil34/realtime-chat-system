/* ============================================================
   ProfileModal — Manage user profile details including Mobile Number
   ============================================================ */
'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, User as UserIcon, Mail, Phone, Info } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user } = useAuth();
  
  // Local state for edits
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    mobile_number: user?.mobile_number || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formDataObj = new FormData();
      if (formData.username) formDataObj.append('username', formData.username);
      if (formData.bio !== undefined) formDataObj.append('bio', formData.bio);
      if (formData.mobile_number !== undefined) formDataObj.append('mobile_number', formData.mobile_number);
      
      if (avatarFile) {
        formDataObj.append('avatar', avatarFile);
      }

      // Setting Content-Type to undefined forces Axios to drop the 'application/json' 
      // default and lets the browser properly attach 'multipart/form-data; boundary=...'
      const response = await api.patch('/auth/profile/', formDataObj, {
        headers: {
          'Content-Type': undefined
        }
      });
      
      // Update AuthContext and localStorage with the new user profile data (including the new avatar URL)
      if (response.data) {
        // Find updateUser from AuthContext
        // We'll update localStorage explicitly just in case updateUser is not extracted above
        localStorage.setItem('user', JSON.stringify(response.data));
      }

      toast.success('Profile updated successfully!');
      
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to refresh chat rooms & messages with the new avatar
      }, 1000);
    } catch (err: any) {
      let errorMsg = 'Failed to update profile';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          // Flatten DRF error dict down to the first available string message
          const firstError = Object.values(err.response.data).flat()[0];
          if (typeof firstError === 'string') {
            errorMsg = firstError;
          } else if (err.response.data.detail) {
            errorMsg = err.response.data.detail;
          }
        }
      }
      toast.error(errorMsg);
      console.warn('Profile update error:', err.response?.data || err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card"
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg-secondary)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Your Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleAvatarChange} 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: 24, cursor: 'pointer',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 32, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)', position: 'relative'
              }}
              title="Click to change avatar"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(user.username)
              )}
            </div>
            <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>● Online</p>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <UserIcon size={14} /> Username
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <Mail size={14} /> Email Address (Read-only)
              </label>
              <input
                name="email"
                value={formData.email}
                readOnly
                className="input-field"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <Phone size={14} /> Mobile Number
              </label>
              <input
                name="mobile_number"
                placeholder="+1 234 567 8900"
                value={formData.mobile_number}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <Info size={14} /> Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-field"
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn-primary" 
            style={{ marginTop: 8 }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
