'use client';

import React from 'react';
import { Sparkles, CheckCircle2, History, ArrowRight } from 'lucide-react';

export default function ChangelogPage() {
  const releases = [
    {
      version: 'v2.0.0 — SaaS Architecture Rebuild',
      date: '14 September 2026',
      badge: 'Major Release',
      changes: [
        'Migrasi penuh dari Google Apps Script (GAS) & Google Sheets ke Next.js 15 App Router & Supabase.',
        'Penyempurnaan trigger Postgres kalkulasi metrik otomatis (recalc_metric_fields) sebagai single source of truth (Bug Fix #5).',
        'Validasi approval fase eksplisit (contentId + phase) dan pencegahan status bypass ke Published tanpa persetujuan (Bug Fix #1 & #2).',
        'Isolasi error AI di dalam komponen modal & chat tanpa freeze pada navigasi global (Bug Fix #3).',
        'Standardisasi feedback ketiadaan API Key dengan inline error banner dan tombol menuju Settings (Bug Fix #4).',
        'Dukungan Multi-tenant Organisasi dan Brand Switcher realtime.',
      ],
    },
    {
      version: 'v1.5.0 — Legacy GAS System',
      date: 'Agustus 2026',
      badge: 'Legacy',
      changes: [
        'Sistem content planning berbasis Google Sheets + Google Apps Script Web App.',
        'Ekstraksi metrik manual dan deduping formula sheet komposit.',
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catatan Rilis & Changelog</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Riwayat pembaruan sistem dan evolusi platform Socilift Plus.
        </p>
      </div>

      <div className="space-y-6">
        {releases.map(rel => (
          <div key={rel.version} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                  {rel.badge}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{rel.version}</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">{rel.date}</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700">
              {rel.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
