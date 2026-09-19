'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Sparkles,
  CheckCircle2,
  X,
  Zap,
  Crown,
  ShieldCheck,
  ArrowRight,
  Bot,
  Calendar,
  Layers,
  BarChart3
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [upgraded, setUpgraded] = useState(false);

  if (!isOpen) return null;

  const handleSimulateUpgrade = () => {
    setUpgraded(true);
    setTimeout(() => {
      onClose();
      setUpgraded(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header Hero */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            Upgrade Akun
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Tingkatkan ke <span className="text-amber-300">Socilift Pro</span>
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-lg leading-relaxed">
            Buka seluruh potensi pembuatan konten, asisten AI tanpa batas, dan analitik performa multi-platform untuk melejitkan audiens Anda.
          </p>
        </div>

        {/* Comparison Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Basic Tier Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between opacity-80">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Paket Basic</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Saat Ini
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white mb-4">
                  Rp 0 <span className="text-xs font-normal text-slate-400">/ selamanya</span>
                </p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Maksimal 5 Konten / Bulan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>10x AI Script Generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>1 Brand Profil</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Tampilan Kalender Standar</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Tier Card */}
            <div className="p-4 rounded-2xl border-2 border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                Rekomendasi
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Paket Pro
                  </h3>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white mb-4">
                  Rp 99.000 <span className="text-xs font-normal text-slate-400">/ bulan</span>
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>Unlimited</strong> Konten & Kanban Board</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><strong>Unlimited</strong> Socilift AI Assistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>AI Metrics OCR Extractor Batch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Ekspor CSV & Kalender .ICS Google Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Analisis Funnel & Pivot Table Lengkap</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Aman & instan aktif tanpa proses verifikasi manual.</span>
            </div>
            <button
              onClick={handleSimulateUpgrade}
              disabled={upgraded}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {upgraded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>Berhasil Diupgrade ke Pro!</span>
                </>
              ) : (
                <>
                  <span>Upgrade ke Pro Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
