'use client';

import React, { useState, useEffect } from 'react';
import { Notification } from '@/types/database';
import { Bell, CheckCheck, Info, AlertTriangle, Sparkles, X } from 'lucide-react';

interface NotificationWithRead extends Notification {
  is_read?: boolean;
}

export default function NotificationModal({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const [notifications, setNotifications] = useState<NotificationWithRead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId || ''}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen, userId]);

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, userId }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-end p-4 sm:p-6 z-50 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mt-12 mr-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-slate-800">Notifikasi</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Memuat notifikasi...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Belum ada notifikasi baru</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 hover:bg-slate-50/80 transition cursor-pointer ${
                  !n.is_read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'feature_update' ? (
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    ) : n.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
