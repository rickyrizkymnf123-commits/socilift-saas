'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme-context';
import {
  LayoutDashboard,
  CalendarDays,
  Database,
  Kanban,
  BarChart3,
  FileSpreadsheet,
  ScanText,
  BotMessageSquare,
  History,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Users,
  Crown,
  Sun,
  Moon,
} from 'lucide-react';
import SociliftLogo from '@/components/ui/socilift-logo';

export default function Sidebar({ onOpenNewContent }: { onOpenNewContent?: () => void }) {
  const pathname = usePathname();
  const { user, currentOrg, currentBrand, brands, role, switchBrand, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Kalender', href: '/calendar', icon: CalendarDays },
    { label: 'Database', href: '/content', icon: Database },
    { label: 'Kanban Board', href: '/backlog', icon: Kanban },
    { label: 'Analisis', href: '/analytics', icon: BarChart3 },
    { label: 'Laporan', href: '/report', icon: FileSpreadsheet },
    { label: 'AI Extractor', href: '/ai-extractor', icon: ScanText },
    { label: 'Socilift AI', href: '/socilift-ai', icon: BotMessageSquare },
    { label: 'Kelola Langganan', href: '/admin/users', icon: Crown },
    { label: 'Changelog', href: '/changelog', icon: History },
    { label: 'Pengaturan', href: '/settings/brand', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none transition-colors duration-200">
      {/* App Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="block hover:opacity-90 transition">
          <SociliftLogo size="md" subtitle={currentOrg?.name || 'SaaS Agency'} />
        </Link>
      </div>

      {/* Brand Switcher */}
      <div className="p-3 border-b border-slate-800/80 relative">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
          Brand Aktif
        </div>
        <button
          onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 text-left transition shadow-xs"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: currentBrand?.color || '#2563EB' }}
            />
            <span className="text-xs font-bold text-white truncate">
              {currentBrand?.name || 'Pilih Brand'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {brandDropdownOpen && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
            {brands.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  switchBrand(b.id);
                  setBrandDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-700/60 transition ${
                  currentBrand?.id === b.id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300 font-medium'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="truncate">{b.name}</span>
              </button>
            ))}
            <div className="border-t border-slate-700/80 mt-1 pt-1">
              <Link
                href="/settings/brand"
                onClick={() => setBrandDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-slate-700/60 font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Kelola / Tambah Brand</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Role Switcher */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 relative">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/40 transition">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.display_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user?.display_name || user?.email}</p>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                {role === 'dashboard_admin' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <UserCheck className="w-3 h-3" /> Creator
                  </span>
                )}
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          <button
            onClick={logout}
            title="Keluar"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {roleDropdownOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Ganti Role Test</div>
            <button
              onClick={() => {
                switchRole('dashboard_admin');
                setRoleDropdownOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 text-emerald-400 font-bold"
            >
              Dashboard Admin (Full Access)
            </button>
            <button
              onClick={() => {
                switchRole('creator');
                setRoleDropdownOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 text-slate-300 font-medium"
            >
              Creator (No Approval Rights)
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
