'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { OrganizationMember, OrgRole } from '@/types/database';
import { Plus, Shield, UserPlus, X, Edit, Check } from 'lucide-react';

export default function PermissionsPage() {
  const { currentOrg, role } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('creator');
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail('');
        setModalOpen(false);
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: OrgRole) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const roleBadges: Record<OrgRole, { label: string; bg: string; text: string }> = {
    dashboard_admin: { label: 'Dashboard Admin', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300' },
    manager: { label: 'Manager', bg: 'bg-blue-100 dark:bg-blue-900/60', text: 'text-blue-800 dark:text-blue-300' },
    creator: { label: 'Creator', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
    view_only: { label: 'View Only', bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Hak Akses & Anggota Tim</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Atur peran pengguna untuk pembatasan approval dan pengelolaan konten.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Anggota</span>
        </button>
      </div>

      {/* Admin Users & Subscription Suite Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Pusat Kelola Pengguna & Langganan SaaS</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Akses modul admin lengkap untuk kelola status paket tier, perpanjangan massal, invite massal, dan hapus akun.
            </p>
          </div>
        </div>
        <a
          href="/admin/users"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
        >
          <span>Buka Kelola Pengguna</span>
          <span className="text-indigo-200">→</span>
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Nama / Email</th>
              <th className="py-3.5 px-3">Peran (Role)</th>
              <th className="py-3.5 px-3">Akses Brand</th>
              <th className="py-3.5 px-3">Akses Platform</th>
              <th className="py-3.5 px-4 text-right">Ubah Peran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map(m => {
              const badge = roleBadges[m.role] || roleBadges.creator;
              return (
                <tr key={m.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{m.profile?.display_name || m.user_id}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{m.profile?.email}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                    Semua Brand
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                    Semua Platform
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.user_id, e.target.value as OrgRole)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="dashboard_admin">Dashboard Admin</option>
                      <option value="manager">Manager</option>
                      <option value="creator">Creator</option>
                      <option value="view_only">View Only</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Undang Anggota Tim Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="nama@agensi.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Peran Hak Akses</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as OrgRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="creator">Creator (Buat Ide & Naskah)</option>
                  <option value="manager">Manager (Approve Tahap 1)</option>
                  <option value="dashboard_admin">Dashboard Admin (Akses Penuh & Final Publish)</option>
                  <option value="view_only">View Only (Hanya Lihat Laporan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {saving ? 'Mengirim...' : 'Kirim Undangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
