'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { User, Shield, Check, LogOut } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user, currentOrg, role, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black text-slate-900 dark:text-white">Profil & Akun Pengguna</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Informasi login, nama tampilan, dan hak akses aktif Anda.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 text-xs max-w-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xl shadow-xs">
            {user?.display_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">{user?.display_name || 'Admin'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
              {role.toUpperCase()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Tampilan</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Terdaftar</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organisasi Aktif</label>
            <input
              type="text"
              value={currentOrg?.name || 'Socilift Media Agency'}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
            />
          </div>

          {saved && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Profil berhasil diperbarui.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition"
            >
              Simpan Profil
            </button>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
