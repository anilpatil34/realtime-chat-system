/* ============================================================
   CreateUserModal — Add a new user with mobile number
   ============================================================ */
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Mail, Phone, Lock, User as UserIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile_number: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/users/create/', {
        username: formData.username,
        email: formData.email,
        mobile_number: formData.mobile_number,
        password: formData.password,
        password_confirm: formData.password,
      });
      toast.success(`User ${formData.username} added successfully!`);
      onSuccess(); // Trigger a refresh of the users list if needed
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.username?.[0] || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={20} className="text-primary-400" /> Add New User
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <UserIcon size={14} /> Full Name / Username <span style={{color: '#ef4444'}}>*</span>
            </label>
            <input
              name="username"
              placeholder="e.g. John Doe"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <Mail size={14} /> Email Address <span style={{color: '#ef4444'}}>*</span>
            </label>
            <input
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
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
              <Lock size={14} /> Initial Password <span style={{color: '#ef4444'}}>*</span>
            </label>
            <input
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="btn-primary" 
            style={{ marginTop: 8 }}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
