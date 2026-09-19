'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import ContentModal from '@/components/content/content-modal';
import UserInspectorModal from '@/components/layout/user-inspector-modal';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Eye,
  X,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  SlidersHorizontal,
  UserCheck
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    isImpersonating,
    impersonatedUser,
    startImpersonation,
    stopImpersonation,
    deviceMode,
    setDeviceMode,
    isInspectorOpen,
    setIsInspectorOpen
  } = useAuth();

  const getDeviceContainerClass = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[390px] mx-auto my-4 rounded-[40px] border-[8px] border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 min-h-[calc(100vh-140px)]';
      case 'tablet':
        return 'max-w-[768px] mx-auto my-4 rounded-[28px] border-[6px] border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 min-h-[calc(100vh-140px)]';
      case 'laptop':
        return 'max-w-[1280px] mx-auto my-2 rounded-2xl border-2 border-slate-300 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Global Sidebar */}
      <Sidebar onOpenNewContent={() => setModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Impersonation Banner (Mode Intip Aktif) */}
        {isImpersonating && impersonatedUser && (
          <div className="bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-md backdrop-blur-md sticky top-0 z-50 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <span>Mode Intip: </span>
                <strong className="text-amber-950 dark:text-white font-black underline decoration-amber-400">
                  {impersonatedUser.display_name || impersonatedUser.email}
                </strong>{' '}
                <span className="text-[11px] opacity-80">
                  (<span className="uppercase font-black">{impersonatedUser.role}</span> •{' '}
                  <span className="uppercase font-black">{impersonatedUser.tier || 'Free'}</span>)
                </span>
              </div>
            </div>

            {/* Quick Switcher Controls on Banner */}
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="hidden lg:flex items-center gap-1 bg-amber-500/20 p-0.5 rounded-lg border border-amber-500/30">
                <button
                  onClick={() => startImpersonation({ id: 'creator_pro', email: 'creator@socilift.local', display_name: 'Budi Kreator', role: 'creator', tier: 'pro', status: 'active' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition ${impersonatedUser.role === 'creator' && impersonatedUser.tier === 'pro' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-900 dark:text-amber-200 hover:bg-amber-500/30'}`}
                >
                  Creator Pro
                </button>
                <button
                  onClick={() => startImpersonation({ id: 'manager_ent', email: 'manager@socilift.local', display_name: 'Siti Manager', role: 'manager', tier: 'enterprise', status: 'active' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition ${impersonatedUser.role === 'manager' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-900 dark:text-amber-200 hover:bg-amber-500/30'}`}
                >
                  Manager
                </button>
                <button
                  onClick={() => startImpersonation({ id: 'trial_starter', email: 'trial.user@socilift.local', display_name: 'User Trial', role: 'creator', tier: 'starter', status: 'trial' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition ${impersonatedUser.status === 'trial' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-900 dark:text-amber-200 hover:bg-amber-500/30'}`}
                >
                  Trial
                </button>
                <button
                  onClick={() => startImpersonation({ id: 'expired_user', email: 'expired@socilift.local', display_name: 'Akun Expired', role: 'creator', tier: 'starter', status: 'expired' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition ${impersonatedUser.status === 'expired' ? 'bg-rose-500 text-white shadow-xs' : 'text-amber-900 dark:text-amber-200 hover:bg-amber-500/30'}`}
                >
                  Expired
                </button>
              </div>

              {/* Open Inspector Modal */}
              <button
                onClick={() => setIsInspectorOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-950 dark:text-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Buka Pusat Simulasi & Matriks Akses"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pusat Intip</span>
              </button>

              {/* Exit Impersonation */}
              <button
                onClick={stopImpersonation}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Kembali ke akun Super Admin"
              >
                <X className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        <Topbar onOpenNewContent={() => setModalOpen(true)} />

        {/* Scrollable Main Body with Responsive Device Viewport Containment */}
        <main className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 ${deviceMode !== 'desktop' ? 'p-3 sm:p-6 bg-slate-200 dark:bg-slate-900/60' : 'p-6 lg:p-8'}`}>
          <div className={`${getDeviceContainerClass()} transition-all duration-300`}>
            {deviceMode !== 'desktop' && (
              <div className="bg-slate-800 text-slate-400 px-4 py-2 text-[11px] font-mono flex items-center justify-between border-b border-slate-700">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  Simulasi: {deviceMode.toUpperCase()} ({deviceMode === 'mobile' ? '390px' : deviceMode === 'tablet' ? '768px' : '1280px'})
                </span>
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Kembalikan ke Desktop ✕
                </button>
              </div>
            )}
            {children}
          </div>
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

      {/* Global User & Device Inspector Modal */}
      <UserInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
