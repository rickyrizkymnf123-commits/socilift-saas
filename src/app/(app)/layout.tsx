'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import ContentModal from '@/components/content/content-modal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Global Sidebar */}
      <Sidebar onOpenNewContent={() => setModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
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
          // Dispatches custom event to notify current active page
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('socilift:content-saved'));
          }
        }}
      />
    </div>
  );
}
