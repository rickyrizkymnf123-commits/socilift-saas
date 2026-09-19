'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Target,
  Shield,
  KeyRound,
  User,
} from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Brand', href: '/settings/brand', icon: Briefcase },
    { label: 'Goals', href: '/settings/goals', icon: Target },
    { label: 'Permission', href: '/settings/permissions', icon: Shield },
    { label: 'API Key', href: '/settings/api-key', icon: KeyRound },
    { label: 'Akun', href: '/settings/account', icon: User },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
          Kelola konfigurasi brand, target performa platform, hak akses tim, dan integrasi AI.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        {tabs.map(tab => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
