'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Bell, Plus, Sun, Moon } from 'lucide-react';
import NotificationModal from './notification-modal';

export default function Topbar({ onOpenNewContent }: { onOpenNewContent?: () => void }) {
  const { currentBrand, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(1);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/notifications?userId=${user?.id || ''}`)
      .then(res => res.ok ? res.json() : { notifications: [] })
      .then(data => {
        const unread = (data.notifications || []).filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [user]);

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: currentBrand?.color || '#2563EB' }}
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {currentBrand?.name || 'Socilift Studio'}
            </span>
          </div>
          <span className="hidden md:inline-block text-xs text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden md:inline-block text-xs text-slate-600 dark:text-slate-400 font-semibold">
            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => {
              setNotifOpen(true);
              setUnreadCount(0);
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 relative transition"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Quick Add Content Button */}
          <button
            onClick={onOpenNewContent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Konten Baru</span>
          </button>
        </div>
      </header>

      <NotificationModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        userId={user?.id}
      />
    </>
  );
}
