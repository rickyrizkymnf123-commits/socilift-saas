'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  CreditCard, 
  Sparkles, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Edit2,
  Zap,
  X,
  Crown
} from 'lucide-react';
import { 
  SubscriptionTier, 
  SubscriptionStatus, 
  OrgRole,
  UserAdminListItem 
} from '@/types/database';

interface AdminStats {
  total: number;
  active: number;
  trial: number;
  expired: number;
  admins: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdminListItem[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    active: 0,
    trial: 0,
    expired: 0,
    admins: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals state
  const [isBulkInviteOpen, setIsBulkInviteOpen] = useState(false);
  const [isBulkSubOpen, setIsBulkSubOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeEditingUser, setActiveEditingUser] = useState<{
    id: string;
    email: string;
    display_name: string;
    role: OrgRole;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    is_free_access: boolean;
    end_date: string;
    notes: string;
  } | null>(null);
  const [deletingUsers, setDeletingUsers] = useState<UserAdminListItem[]>([]);

  // Bulk Invite Form State
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('creator');
  const [inviteTier, setInviteTier] = useState<SubscriptionTier>('pro');
  const [inviteDurationDays, setInviteDurationDays] = useState(30);
  const [inviteIsLifetime, setInviteIsLifetime] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Bulk Sub Form State
  const [bulkSubTier, setBulkSubTier] = useState<SubscriptionTier>('pro');
  const [bulkSubMode, setBulkSubMode] = useState<'smart' | 'now'>('smart');
  const [bulkSubDays, setBulkSubDays] = useState(30);
  const [bulkSubIsLifetime, setBulkSubIsLifetime] = useState(false);
  const [bulkSubNotes, setBulkSubNotes] = useState('');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('subscription', statusFilter);
      if (tierFilter !== 'all') params.append('tier', tierFilter);

      const res = await fetch('/api/admin/users?' + params.toString());
      if (!res.ok) throw new Error('Gagal mengambil data user');
      const data = await res.json();
      setUsers(data.users || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      showToast(err.message || 'Error saat memuat data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, tierFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = users.length > 0 && selectedIds.length === users.length;

  // Single Quick Extend
  const handleQuickExtend = async (userId: string, days: number = 30) => {
    try {
      const res = await fetch('/api/admin/users/bulk-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [userId],
          mode: 'smart',
          days,
          notes: 'Perpanjangan Cepat 30 Hari via Quick Action'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperpanjang');
      showToast(`Berhasil memperpanjang langganan +${days} hari!`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Invite Submit
  const handleBulkInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmails.trim()) {
      showToast('Masukkan minimal satu alamat email', 'error');
      return;
    }
    try {
      setIsSubmittingInvite(true);
      const emailsList = inviteEmails
        .split(/[\n,]/)
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const res = await fetch('/api/admin/users/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailsList,
          role: inviteRole,
          tier: inviteTier,
          days: inviteDurationDays,
          isFree: inviteIsLifetime,
          notes: 'Undangan Massal via Admin Suite'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim undangan massal');
      showToast(`Sukses memproses ${data.createdCount + data.existingCount} pengguna!`);
      setIsBulkInviteOpen(false);
      setInviteEmails('');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Bulk Subscription Submit
  const handleBulkSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      showToast('Pilih minimal satu pengguna terlebih dahulu', 'error');
      return;
    }
    try {
      setIsSubmittingSub(true);
      const res = await fetch('/api/admin/users/bulk-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedIds,
          tier: bulkSubTier,
          mode: bulkSubMode,
          days: bulkSubDays,
          isFree: bulkSubIsLifetime,
          notes: bulkSubNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui langganan massal');
      showToast(`Sukses memperbarui ${data.updatedCount} akun langganan!`);
      setIsBulkSubOpen(false);
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // Bulk / Single Delete Submit
  const handleDeleteConfirmSubmit = async () => {
    try {
      const idsToDelete = deletingUsers.map(u => u.id);
      const res = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: idsToDelete })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna');
      showToast(`Berhasil menghapus ${data.deletedCount} pengguna!`);
      setIsDeleteConfirmOpen(false);
      setDeletingUsers([]);
      setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Edit Single User Submit
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${activeEditingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeEditingUser.display_name,
          role: activeEditingUser.role,
          subscription: {
            tier: activeEditingUser.tier,
            status: activeEditingUser.status,
            is_free_access: activeEditingUser.is_free_access,
            end_date: activeEditingUser.end_date,
            notes: activeEditingUser.notes
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan user');
      showToast('Data pengguna berhasil diperbarui!');
      setIsEditUserOpen(false);
      setActiveEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Format Helper for Dates
  const formatDateDisplay = (dateStr?: string | null, isLifetime?: boolean) => {
    if (isLifetime) {
      return { text: 'Seumur Hidup (Lifetime)', subtext: 'Tanpa batas kedaluwarsa', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    }
    if (!dateStr) {
      return { text: 'Belum diatur', subtext: '-', badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500' };
    }
    const end = new Date(dateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (diffDays < 0) {
      return {
        text: formatted,
        subtext: `Kedaluwarsa ${Math.abs(diffDays)} hari lalu`,
        badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      };
    } else if (diffDays <= 7) {
      return {
        text: formatted,
        subtext: `Sisa ${diffDays} hari lagi`,
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      };
    } else {
      return {
        text: formatted,
        subtext: `Sisa ${diffDays} hari`,
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      };
    }
  };

  // Tier Colors
  const getTierBadge = (tier?: SubscriptionTier) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
      case 'agency':
        return 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30';
      case 'pro':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30';
      case 'starter':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30';
      case 'free':
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  // Status Colors
  const getStatusBadge = (status?: SubscriptionStatus, isPendingInvite?: boolean) => {
    if (isPendingInvite) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Pending Invite
        </span>
      );
    }
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Zap className="w-3 h-3" />
            Trial
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertTriangle className="w-3 h-3" />
            Kedaluwarsa
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <XCircle className="w-3 h-3" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            Free / Starter
          </span>
        );
    }
  };

  const getRoleLabel = (role: OrgRole) => {
    switch (role) {
      case 'dashboard_admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'creator':
        return 'Creator';
      case 'view_only':
        return 'View Only';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' 
            : 'bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kelola Langganan & Akses Pengguna</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Atur durasi masa aktif langganan, paket tier (Pro/Enterprise), akses gratis (Lifetime), perpanjangan massal, dan undangan user.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="p-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsBulkInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Undang Massal</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pengguna</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{stats.total}</span>
            <span className="text-xs text-slate-500">user terdaftar</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Langganan Aktif</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</span>
            <span className="text-xs text-slate-500">akun aktif</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Trial & Pending</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.trial}</span>
            <span className="text-xs text-slate-500">masa uji coba / invite</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Kedaluwarsa</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.expired}</span>
            <span className="text-xs text-slate-500">perlu perpanjangan</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Filter:</span>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Role</option>
              <option value="dashboard_admin">Dashboard Admin</option>
              <option value="manager">Manager</option>
              <option value="creator">Creator</option>
              <option value="view_only">View Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="trial">Trial</option>
              <option value="expired">Kedaluwarsa</option>
              <option value="lifetime">Lifetime</option>
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Paket</option>
              <option value="enterprise">Enterprise</option>
              <option value="agency">Agency</option>
              <option value="pro">Pro</option>
              <option value="starter">Starter</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">Pengguna</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Paket Langganan</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Masa Berlaku</th>
                <th className="py-4 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <span>Tidak ada pengguna yang sesuai dengan filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const dateInfo = formatDateDisplay(user.subscription?.end_date, user.subscription?.is_free_access);
                  const isSelected = selectedIds.includes(user.id);
                  const isPendingInvite = !user.is_registered;

                  return (
                    <tr 
                      key={user.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(user.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                        />
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                            {user.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {user.display_name || user.email.split('@')[0]}
                              </span>
                              {user.subscription?.is_free_access && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" />
                                  LIFETIME
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border ${getTierBadge(user.subscription?.tier)}`}>
                          <Sparkles className="w-3 h-3" />
                          {user.subscription?.tier || 'free'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(user.subscription?.status, isPendingInvite)}
                      </td>

                      {/* Period / End Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {dateInfo.text}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dateInfo.subtext}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Extend +30d */}
                          {!user.subscription?.is_free_access && (
                            <button
                              onClick={() => handleQuickExtend(user.id, 30)}
                              title="Tambah Masa Aktif +30 Hari"
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">+30h</span>
                            </button>
                          )}

                          {/* Edit Modal Button */}
                          <button
                            onClick={() => {
                              setActiveEditingUser({
                                id: user.id,
                                email: user.email,
                                display_name: user.display_name || '',
                                role: user.role,
                                tier: user.subscription?.tier || 'pro',
                                status: user.subscription?.status || 'active',
                                is_free_access: Boolean(user.subscription?.is_free_access),
                                end_date: user.subscription?.end_date || new Date().toISOString(),
                                notes: user.subscription?.notes || ''
                              });
                              setIsEditUserOpen(true);
                            }}
                            title="Edit Pengguna"
                            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Single Delete Button */}
                          <button
                            onClick={() => {
                              setDeletingUsers([user]);
                              setIsDeleteConfirmOpen(true);
                            }}
                            title="Hapus Pengguna"
                            className="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom duration-200">
          <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 px-2.5 py-1 rounded-lg">
            {selectedIds.length} terpilih
          </span>

          <div className="h-4 w-px bg-slate-700" />

          {/* Bulk Manage Subscription */}
          <button
            onClick={() => setIsBulkSubOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kelola Paket Massal</span>
          </button>

          {/* Quick +30 Days Bulk */}
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/users/bulk-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userIds: selectedIds,
                    mode: 'smart',
                    days: 30,
                    notes: 'Perpanjangan Massal +30 Hari'
                  })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                showToast(`Sukses memperpanjang ${selectedIds.length} pengguna +30 hari!`);
                fetchUsers();
              } catch (err: any) {
                showToast(err.message, 'error');
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>+30 Hari Massal</span>
          </button>

          {/* Bulk Delete */}
          <button
            onClick={() => {
              const selectedUsers = users.filter(u => selectedIds.includes(u.id));
              setDeletingUsers(selectedUsers);
              setIsDeleteConfirmOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-all border border-rose-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Massal</span>
          </button>

          {/* Deselect All */}
          <button
            onClick={() => setSelectedIds([])}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Batalkan Pilihan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL 1: Bulk Invite */}
      {isBulkInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Undang Pengguna Massal</h2>
                  <p className="text-xs text-slate-500">Kirimkan akses & paket langganan sekaligus ke banyak email.</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Alamat Email (Pisahkan dengan baris baru atau koma)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={`budi@agency.com\nsiti@creator.id\nteam@socilift.com`}
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Role Pengguna
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="creator">Creator</option>
                    <option value="manager">Manager</option>
                    <option value="dashboard_admin">Dashboard Admin</option>
                    <option value="view_only">View Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Paket Langganan
                  </label>
                  <select
                    value={inviteTier}
                    onChange={(e) => setInviteTier(e.target.value as SubscriptionTier)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Akses Seumur Hidup (Lifetime)
                  </label>
                  <input
                    type="checkbox"
                    checked={inviteIsLifetime}
                    onChange={(e) => setInviteIsLifetime(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                </div>

                {!inviteIsLifetime && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Durasi Langganan (Hari)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={3650}
                        value={inviteDurationDays}
                        onChange={(e) => setInviteDurationDays(parseInt(e.target.value) || 30)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                      />
                      <div className="flex gap-1.5">
                        {[30, 90, 365].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setInviteDurationDays(d)}
                            className="px-2 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                          >
                            {d}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkInviteOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingInvite && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Kirim Undangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Manage Subscription */}
      {isBulkSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Kelola Langganan Massal</h2>
                  <p className="text-xs text-slate-500">
                    Perbarui paket untuk <strong>{selectedIds.length} pengguna</strong> terpilih.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkSubOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Ubah Paket Tier
                  </label>
                  <select
                    value={bulkSubTier}
                    onChange={(e) => setBulkSubTier(e.target.value as SubscriptionTier)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Metode Perpanjangan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setBulkSubMode('smart'); setBulkSubIsLifetime(false); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkSubMode === 'smart' && !bulkSubIsLifetime
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">Smart Extend</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Tambah hari ke sisa masa aktif</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setBulkSubMode('now'); setBulkSubIsLifetime(false); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkSubMode === 'now' && !bulkSubIsLifetime
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">Reset dari Hari Ini</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Mulai masa aktif baru</div>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jadikan Lifetime (Tanpa Batas Waktu)
                  </label>
                  <input
                    type="checkbox"
                    checked={bulkSubIsLifetime}
                    onChange={(e) => setBulkSubIsLifetime(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                </div>

                {!bulkSubIsLifetime && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Jumlah Hari Ditambahkan / Ditetapkan
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={3650}
                        value={bulkSubDays}
                        onChange={(e) => setBulkSubDays(parseInt(e.target.value) || 30)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                      />
                      <div className="flex gap-1.5">
                        {[30, 60, 90, 365].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setBulkSubDays(d)}
                            className="px-2 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                          >
                            +{d}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Catatan Admin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Promo Flash Sale / Upgrade Massal Agency"
                  value={bulkSubNotes}
                  onChange={(e) => setBulkSubNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkSubOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSub}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingSub && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Terapkan ke {selectedIds.length} Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Single User */}
      {isEditUserOpen && activeEditingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Edit Detail Pengguna</h2>
                  <p className="text-xs text-slate-500">{activeEditingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  value={activeEditingUser.display_name}
                  onChange={(e) => setActiveEditingUser({ ...activeEditingUser, display_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Role
                  </label>
                  <select
                    value={activeEditingUser.role}
                    onChange={(e) => setActiveEditingUser({ ...activeEditingUser, role: e.target.value as OrgRole })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  >
                    <option value="dashboard_admin">Dashboard Admin</option>
                    <option value="manager">Manager</option>
                    <option value="creator">Creator</option>
                    <option value="view_only">View Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Paket Tier
                  </label>
                  <select
                    value={activeEditingUser.tier}
                    onChange={(e) => setActiveEditingUser({ ...activeEditingUser, tier: e.target.value as SubscriptionTier })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Status Langganan
                  </label>
                  <select
                    value={activeEditingUser.status}
                    onChange={(e) => setActiveEditingUser({ ...activeEditingUser, status: e.target.value as SubscriptionStatus })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Kedaluwarsa Sampai
                  </label>
                  <input
                    type="date"
                    disabled={activeEditingUser.is_free_access}
                    value={activeEditingUser.end_date ? activeEditingUser.end_date.split('T')[0] : ''}
                    onChange={(e) => setActiveEditingUser({ ...activeEditingUser, end_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="edit_lifetime"
                  checked={activeEditingUser.is_free_access}
                  onChange={(e) => setActiveEditingUser({ ...activeEditingUser, is_free_access: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                />
                <label htmlFor="edit_lifetime" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Akses Seumur Hidup (Lifetime)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Catatan Admin
                </label>
                <input
                  type="text"
                  value={activeEditingUser.notes}
                  onChange={(e) => setActiveEditingUser({ ...activeEditingUser, notes: e.target.value })}
                  placeholder="Catatan khusus admin..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation (Single or Bulk) */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Konfirmasi Penghapusan</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Anda akan menghapus <strong>{deletingUsers.length} pengguna</strong> beserta seluruh data langganan, hak akses, dan profil terkait.
            </p>

            <div className="max-h-32 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 mb-5 text-xs text-slate-600 dark:text-slate-400 font-mono">
              {deletingUsers.map(u => (
                <div key={u.id} className="truncate">• {u.email} ({u.display_name || 'No Name'})</div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsDeleteConfirmOpen(false); setDeletingUsers([]); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmSubmit}
                className="px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/20"
              >
                Hapus {deletingUsers.length} Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
