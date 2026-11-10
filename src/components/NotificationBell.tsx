'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/lib/mockData';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('notifications')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .select();
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').eq('id', id).update({ is_read: true });
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    for (const n of notifications.filter((n: Notification) => !n.is_read)) {
      await supabase.from('notifications').eq('id', n.id).update({ is_read: true });
    }
    setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, is_read: true })));
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'iuran': return '💰';
      case 'ujian': return '🥋';
      case 'turnamen': return '🏆';
      case 'absensi': return '📋';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}j lalu`;
    const days = Math.floor(hrs / 24);
    return `${days}h lalu`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Neumorphic Extruded Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
        style={
          isOpen
            ? {
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                border: '1px solid var(--neu-border)'
              }
            : {
                backgroundColor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-flat-sm)',
                border: '1px solid var(--neu-border)'
              }
        }
        aria-label="Notifikasi"
      >
        <svg 
          className="h-5 w-5 text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 hover:rotate-12" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Pulsing Tactile Unread Badge */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
            style={{
              background: 'var(--neu-accent-grad)',
              boxShadow: '0 0 10px rgba(255, 82, 82, 0.6), var(--neu-shadow-flat-sm)',
              border: '1.5px solid var(--neu-surface)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Neumorphic Dropdown Floating Slab */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border border-[var(--neu-border)] overflow-hidden z-[60] animate-m3-dialog-enter"
          style={{ 
            backgroundColor: 'var(--neu-surface-high)',
            boxShadow: 'var(--neu-shadow-flat-lg), 0 20px 40px rgba(0,0,0,0.45)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--neu-surface)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-flat-sm)]">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-84 overflow-y-auto p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div 
                  className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-xl mb-3"
                  style={{
                    backgroundColor: 'var(--neu-surface-low)',
                    boxShadow: 'var(--neu-shadow-pressed-sm)',
                    border: '1px solid var(--neu-border)'
                  }}
                >
                  🔔
                </div>
                <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Belum ada notifikasi baru</p>
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    !n.is_read 
                      ? 'border-[var(--neu-border)]' 
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={
                    !n.is_read
                      ? {
                          backgroundColor: 'var(--neu-surface-low)',
                          boxShadow: 'var(--neu-shadow-pressed-sm)',
                        }
                      : {
                          backgroundColor: 'transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--neu-surface)';
                    e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat-sm)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = !n.is_read ? 'var(--neu-surface-low)' : 'transparent';
                    e.currentTarget.style.boxShadow = !n.is_read ? 'var(--neu-shadow-pressed-sm)' : 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: 'var(--neu-surface)',
                        boxShadow: 'var(--neu-shadow-flat-sm)',
                        border: '1px solid var(--neu-border)'
                      }}
                    >
                      {typeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate ${!n.is_read ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-medium text-[var(--md-sys-color-on-surface-variant)]'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)] shadow-[0_0_8px_var(--md-sys-color-primary)] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[9px] font-semibold text-[var(--md-sys-color-primary)] mt-1.5 opacity-80">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
