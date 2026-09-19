'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, ImpersonatedUser, DeviceMode } from '@/lib/auth/auth-context';
import {
  Eye,
  Shield,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  X,
  Zap,
  UserCheck,
  Users
} from 'lucide-react';

interface UserInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserInspectorModal({ isOpen, onClose }: UserInspectorModalProps) {
  const {
    isImpersonating,
    impersonatedUser,
    startImpersonation,
    stopImpersonation,
    deviceMode,
    setDeviceMode
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'devices' | 'matrix'>('users');
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      fetch('/api/admin/users')
        .then(res => res.ok ? res.json() : { users: [] })
        .then(data => {
          setRealUsers(data.users || []);
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'preset_creator_pro',
      name: 'Budi Kreator (Pro Tier)',
      email: 'creator@socilift.local',
      role: 'creator',
      tier: 'pro',
      status: 'active',
      desc: 'Tampilan kreator aktif: Akses penuh ke Studio Konten, AI Assistant, Kanban & Kalender.',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'preset_manager',
      name: 'Siti Manager (Pro Lead)',
      email: 'manager@socilift.local',
      role: 'manager',
      tier: 'pro',
      status: 'active',
      desc: 'Tampilan manajer: Akses persetujuan (approval) naskah, analitik lanjutan & laporan pivot.',
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
    },
    {
      id: 'preset_trial',
      name: 'User Trial Baru (Basic)',
      email: 'trial.user@socilift.local',
      role: 'creator',
      tier: 'basic',
      status: 'trial',
      desc: 'Tampilan pengguna baru dalam masa percobaan dengan kuota basic.',
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
    },
    {
      id: 'preset_expired',
      name: 'Akun Kedaluwarsa (Expired)',
      email: 'expired.account@socilift.local',
      role: 'creator',
      tier: 'basic',
      status: 'expired',
      desc: 'Tampilan akun yang masa langganannya telah habis untuk menguji flow perpanjangan/paywall.',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
    },
    {
      id: 'preset_view_only',
      name: 'Klien Reviewer (View-Only)',
      email: 'client.viewer@socilift.local',
      role: 'view_only',
      tier: 'basic',
      status: 'active',
      desc: 'Tampilan klien atau peninjau tanpa akses membuat konten atau menyunting data.',
      badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
    }
  ];

  const devices: { mode: DeviceMode; label: string; icon: any; width: string; desc: string }[] = [
    {
      mode: 'desktop',
      label: 'Desktop Lebar (100%)',
      icon: Monitor,
      width: '100% Fluid',
      desc: 'Tampilan monitor desktop penuh standar'
    },
    {
      mode: 'laptop',
      label: 'Laptop 14" (1280px)',
      icon: Laptop,
      width: '1280px',
      desc: 'Tampilan resolusi layar laptop kerja'
    },
    {
      mode: 'tablet',
      label: 'Tablet iPad (768px)',
      icon: Tablet,
      width: '768px',
      desc: 'Tampilan tablet vertikal dengan layout adaptif'
    },
    {
      mode: 'mobile',
      label: 'Mobile iPhone (375px)',
      icon: Smartphone,
      width: '375px',
      desc: 'Tampilan ponsel dengan sidebar drawer ringkas'
    }
  ];

  const handleApplyPreset = (preset: any) => {
    startImpersonation({
      id: preset.id,
      email: preset.email,
      display_name: preset.name,
      role: preset.role as any,
      tier: preset.tier,
      status: preset.status
    });
    onClose();
  };

  const handleApplyRealUser = () => {
    const found = realUsers.find(u => u.id === selectedUser);
    if (found) {
      startImpersonation({
        id: found.id,
        email: found.email,
        display_name: found.display_name,
        role: found.role,
        tier: found.subscription?.tier || 'free',
        status: found.subscription?.status || 'active'
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Pusat Simulasi & Intip Tampilan Pengguna
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Uji dan lihat aplikasi persis seperti yang dialami oleh role, paket langganan, atau perangkat tertentu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-100/40 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Intip Role & Akun</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'devices'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>2. Simulasi Perangkat</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>3. Matriks Hak Akses</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PRESET & REAL USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Current Active Status Alert */}
              {isImpersonating && impersonatedUser ? (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Sedang mengintip tampilan akun:
                      </p>
                      <p className="text-sm font-black text-amber-950 dark:text-white">
                        {impersonatedUser.display_name || impersonatedUser.email} ({impersonatedUser.role.toUpperCase()} • {impersonatedUser.tier?.toUpperCase() || 'FREE'})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      stopImpersonation();
                      onClose();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Keluar ke Super Admin
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Saat ini Anda login sebagai <strong>Super Admin</strong> dengan hak akses penuh. Pilih preset di bawah untuk mensimulasikan perspektif pengguna lain.</span>
                </div>
              )}

              {/* Quick Presets Grid */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Preset Cepat Berdasarkan Role & Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleApplyPreset(p)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                            {p.name}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${p.badgeColor}`}>
                            {p.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">{p.email}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                          Intip Tampilan →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Or Select Real User From Database */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  Atau Intip Akun Pengguna Nyata di Database
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="">-- Pilih Akun Terdaftar ({realUsers.length} akun) --</option>
                    {realUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.display_name || u.email} — {u.role?.toUpperCase()} ({u.subscription?.tier?.toUpperCase() || 'FREE'} • {u.subscription?.status || 'active'})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyRealUser}
                    disabled={!selectedUser}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-md transition shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Intip Akun Terpilih</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVICE SIMULATOR */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>Simulasi Resolusi Perangkat:</strong> Anda dapat menguji responsivitas antarmuka Socilift SaaS pada berbagai ukuran layar (Desktop, Tablet, Mobile) tanpa perlu memperkecil jendela browser.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {devices.map(d => {
                  const Icon = d.icon;
                  const isSelected = deviceMode === d.mode;
                  return (
                    <div
                      key={d.mode}
                      onClick={() => setDeviceMode(d.mode)}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/10 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-slate-900 dark:text-white">
                              {d.label}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              Lebar: {d.width}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {d.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    Mode Aktif: <span className="uppercase text-amber-500 font-black">{deviceMode}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bingkai simulator akan aktif membungkus konten utama.
                  </p>
                </div>
                {deviceMode !== 'desktop' && (
                  <button
                    onClick={() => setDeviceMode('desktop')}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Reset ke Desktop
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berikut adalah matriks batasan hak akses dan fitur yang diatur berdasarkan peran pengguna:
              </p>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200">
                      <th className="py-3 px-4 font-black">Fitur / Halaman</th>
                      <th className="py-3 px-3 font-black text-center text-amber-500">Super Admin</th>
                      <th className="py-3 px-3 font-black text-center text-blue-500">Manager</th>
                      <th className="py-3 px-3 font-black text-center text-emerald-500">Creator</th>
                      <th className="py-3 px-3 font-black text-center text-slate-500">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold">Dashboard & Goal Health</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Penuh</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Penuh</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Penuh</td>
                      <td className="py-3 px-3 text-center text-slate-400">Hanya Baca</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold">Studio Naskah & Ide Konten</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Edit</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Edit</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Edit</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Tidak</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold">Persetujuan (Approval) Naskah</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Setujui</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Setujui</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Ajukan Saja</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Tidak</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold">Socilift AI Assistant & OCR Extractor</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Unlimited</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Kuota Tim</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Kuota Pro</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Tidak</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold">Pusat Kelola Pengguna (`/admin/users`)</td>
                      <td className="py-3 px-3 text-center text-emerald-500 font-bold">✓ Akses Penuh</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Terkunci</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Terkunci</td>
                      <td className="py-3 px-3 text-center text-rose-500">✗ Terkunci</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Perubahan mode intip & perangkat aktif secara instan tanpa perlu reload.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
