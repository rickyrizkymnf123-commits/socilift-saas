'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, RefreshCw, Trash2, ShieldCheck, Sparkles } from 'lucide-react';

export default function ApiKeySettingsPage() {
  const [maskedKey, setMaskedKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [status, setStatus] = useState('Not Connected');
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini-settings');
      if (res.ok) {
        const data = await res.json();
        setMaskedKey(data.settings?.masked_key || '');
        setSelectedModel(data.settings?.selected_model || 'gemini-2.5-flash');
        setStatus(data.settings?.status || 'Not Connected');
        setLastTestedAt(data.settings?.last_tested_at || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!apiKeyInput && !maskedKey) {
      setFeedback({ type: 'error', text: 'Masukkan API Key terlebih dahulu.' });
      return;
    }
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/gemini-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          apiKey: apiKeyInput,
          selectedModel,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMaskedKey(data.masked_key);
        setApiKeyInput('');
        setStatus(data.status);
        setFeedback({ type: 'success', text: 'API Key berhasil disimpan dengan aman (enkripsi server-side).' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Gagal menyimpan API Key.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTest = async () => {
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/gemini-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          apiKey: apiKeyInput || undefined,
          selectedModel,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
        setLastTestedAt(data.last_tested_at);
        setFeedback({ type: 'success', text: '✓ ' + data.message });
      } else {
        setStatus('Connection Failed');
        setFeedback({ type: 'error', text: data.error || 'Koneksi gagal diuji.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Hapus konfigurasi Gemini API Key?')) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/gemini-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });

      if (res.ok) {
        setMaskedKey('');
        setApiKeyInput('');
        setStatus('Not Connected');
        setLastTestedAt(null);
        setFeedback({ type: 'success', text: 'API Key berhasil dihapus dari server.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black text-slate-900 dark:text-white">Google Gemini API Key</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
          Kunci API disimpan secara aman di sisi server (never exposed to browser) untuk mentenagai Socilift AI dan AI Extractor.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5 text-xs">
        {/* Status indicator */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Status Koneksi API</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {lastTestedAt
                  ? `Terakhir diuji: ${new Date(lastTestedAt).toLocaleString('id-ID')}`
                  : 'Belum pernah diuji'}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
              status.includes('Active') || status.includes('Connected')
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Input Gemini API Key */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder={maskedKey ? `Tersimpan: ${maskedKey}` : 'Tempel Google Gemini API Key di sini (AIza...)'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs font-semibold"
            />
          </div>
          {maskedKey && !apiKeyInput && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Kunci saat ini: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{maskedKey}</span> (Kunci disembunyikan untuk privasi).
            </p>
          )}
        </div>

        {/* Model AI Selector */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Model AI yang Dipilih
          </label>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Cepat & Hemat - Rekomendasi)</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Super Cepat)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Penalaran Mendalam / Advanced Copywriting)</option>
            <option value="auto">Auto (Otomatis)</option>
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Dapat disesuaikan per-organisasi sesuai kebutuhan kecepatan dan kedalaman script konten.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSave}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition disabled:opacity-50"
            >
              Simpan API Key
            </button>
            <button
              onClick={handleTest}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Test Koneksi</span>
            </button>
          </div>

          {maskedKey && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Kunci</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
