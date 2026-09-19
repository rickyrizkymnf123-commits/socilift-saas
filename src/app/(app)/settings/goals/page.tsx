'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Goal, PlatformCode } from '@/types/database';
import { Plus, Target, Trash2, Edit, Calendar, X } from 'lucide-react';

export default function GoalsSettingsPage() {
  const { currentBrand } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [platform, setPlatform] = useState<PlatformCode>('TikTok');
  const [metric, setMetric] = useState('Views');
  const [target, setTarget] = useState('');
  const [baselineCurrent, setBaselineCurrent] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  const metricTypes = [
    'Followers',
    'Views',
    'Impressions',
    'Engagement Rate %',
    'Click Rate %',
    'Hook Rate %',
    'Hold Rate %',
    'Subscribers',
    'Likes',
    'Clicks',
    'GMV / Purchase Value',
  ];

  const fetchGoals = async () => {
    if (!currentBrand) return;
    try {
      const res = await fetch(`/api/goals?brandId=${currentBrand.id}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [currentBrand]);

  const openCreate = () => {
    setEditingGoal(null);
    setPlatform('TikTok');
    setMetric('Views');
    setTarget('');
    setBaselineCurrent('');
    setDeadline(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditingGoal(g);
    setPlatform(g.platform);
    setMetric(g.metric);
    setTarget(String(g.target));
    setBaselineCurrent(String(g.baseline_current));
    setDeadline(g.deadline);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand) return;
    setSaving(true);

    try {
      const payload = {
        brand_id: currentBrand.id,
        platform,
        metric,
        target: Number(target),
        baseline_current: Number(baselineCurrent) || 0,
        deadline,
      };

      if (editingGoal) {
        await fetch('/api/goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingGoal.id, ...payload }),
        });
      } else {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      fetchGoals();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus goal ini?')) return;
    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Target & Goal Platform</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Tetapkan sasaran performa spesifik per platform untuk memantau Goal Health.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Goal Baru</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
        {goals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">Belum ada goal yang dikonfigurasi.</div>
        ) : (
          goals.map(g => {
            const current = Number(g.baseline_current) || 0;
            const targetVal = Number(g.target) || 1;
            const pct = Math.min(100, Math.round((current / targetVal) * 100));

            return (
              <div key={g.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-black text-[10px] uppercase">
                      {g.platform}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{g.metric}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Deadline: {g.deadline}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="max-w-md">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
                      <span>Progress: {pct}%</span>
                      <span>
                        {current.toLocaleString('id-ID')} / {targetVal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openEdit(g)}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    title="Ubah"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Goal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {editingGoal ? 'Ubah Goal' : 'Tambah Goal Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Platform <span className="text-red-500">*</span></label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as PlatformCode)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="IG">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="FB">Facebook</option>
                  <option value="X">X (Twitter)</option>
                  <option value="Threads">Threads</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Metrik <span className="text-red-500">*</span></label>
                <select
                  value={metric}
                  onChange={e => setMetric(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  {metricTypes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Angka <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  required
                  placeholder="Contoh: 50000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Realisasi Saat Ini (Baseline)</label>
                <input
                  type="number"
                  value={baselineCurrent}
                  onChange={e => setBaselineCurrent(e.target.value)}
                  placeholder="Contoh: 12500"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Batas Waktu (Deadline) <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
