'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import ContentModal from '@/components/content/content-modal';
import { useAuth } from '@/lib/auth/auth-context';
import { Eye, X } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { isImpersonating, impersonatedUser, stopImpersonation } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Global Sidebar */}
      <Sidebar onOpenNewContent={() => setModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Impersonation Banner (Mode Intip) */}
        {isImpersonating && impersonatedUser && (
          <div className="bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-md backdrop-blur-md sticky top-0 z-50 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <span>Mode Intip Akun Aktif: Anda sedang melihat tampilan sebagai </span>
                <strong className="text-amber-950 dark:text-white font-black underline decoration-amber-400">
                  {impersonatedUser.email}
                </strong>{' '}
                <span className="text-[11px] opacity-80">
                  (Role: <span className="uppercase font-extrabold">{impersonatedUser.role}</span> • Paket:{' '}
                  <span className="uppercase font-extrabold">{impersonatedUser.tier || 'Free'}</span>)
                </span>
              </div>
            </div>

            <button
              onClick={stopImpersonation}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
              title="Kembali ke akun Super Admin"
            >
              <X className="w-3.5 h-3.5" />
              <span>Keluar dari Mode Intip</span>
            </button>
          </div>
        )}

        <Topbar onOpenNewContent={() => setModalOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>

      {/* Global Add Content Modal */}
      <ContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('socilift:content-saved'));
          }
        }}
      />
    </div>
  );
}
