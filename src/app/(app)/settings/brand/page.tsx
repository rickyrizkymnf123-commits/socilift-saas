'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Brand } from '@/types/database';
import { Plus, Edit, Check, Briefcase, X } from 'lucide-react';

export default function BrandSettingsPage() {
  const { brands, currentBrand, switchBrand, refreshBrands, user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingBrand(null);
    setName('');
    setColor('#2563EB');
    setNiche('');
    setTargetAudience('');
    setToneOfVoice('');
    setModalOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setColor(b.color);
    setNiche(b.details?.niche || '');
    setTargetAudience(b.details?.targetAudience || '');
    setToneOfVoice(b.details?.toneOfVoice || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const details = {
        niche,
        targetAudience,
        toneOfVoice,
      };

      if (editingBrand) {
        await fetch('/api/brands', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBrand.id,
            name,
            color,
            details,
          }),
        });
      } else {
        await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            color,
            details,
            created_by: user?.id,
          }),
        });
      }

      await refreshBrands();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Daftar Brand Organisasi</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Brand yang terdaftar di organisasi ini.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Brand Baru</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
        {brands.map(b => {
          const isCurrent = currentBrand?.id === b.id;
          return (
            <div key={b.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-3.5">
                <span className="w-5 h-5 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: b.color }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{b.name}</span>
                    {isCurrent ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
                        Aktif
                      </span>
                    ) : (
                      <button
                        onClick={() => switchBrand(b.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                      >
                        Pilih Aktif
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Niche: <span className="font-semibold text-slate-700 dark:text-slate-300">{b.details?.niche || '-'}</span> • Tone: <span className="font-semibold text-slate-700 dark:text-slate-300">{b.details?.toneOfVoice || '-'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => openEdit(b)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Brand Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {editingBrand ? 'Edit Informasi Brand' : 'Tambah Brand Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Brand</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Socilift Studio"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Warna Aksen</label>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full h-9 p-1 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Niche / Industri</label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="Contoh: Digital Marketing & Creator Growth"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audiens</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="Contoh: Social media specialist, UMKM, solopreneur"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tone of Voice</label>
                <input
                  type="text"
                  value={toneOfVoice}
                  onChange={e => setToneOfVoice(e.target.value)}
                  placeholder="Contoh: Santai, Edukatif, To-the-point"
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
