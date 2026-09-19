'use client';

import React, { useState, useEffect } from 'react';
import { Content, PlatformCode, ContentStatus } from '@/types/database';
import { useAuth } from '@/lib/auth/auth-context';
import {
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Calendar,
  AlertCircle,
  Settings,
  Check,
  Film,
  Layers,
  ShoppingBag,
  ExternalLink,
  Sliders,
  Send,
} from 'lucide-react';
import Link from 'next/link';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (content: Content) => void;
  contentToEdit?: Content | Partial<Content> | null;
  initialScheduledDate?: string | null;
}

export default function ContentModal({
  isOpen,
  onClose,
  onSaved,
  contentToEdit,
  initialScheduledDate,
}: ContentModalProps) {
  const { currentBrand, user, role } = useAuth();

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<PlatformCode>('TikTok');
  const [format, setFormat] = useState('Video');
  const [durationSlides, setDurationSlides] = useState('');
  const [pillar, setPillar] = useState('');
  const [funnel, setFunnel] = useState('');
  const [objective, setObjective] = useState('');
  const [status, setStatus] = useState<ContentStatus>('ideation');
  const [scheduledDate, setScheduledDate] = useState('');
  const [cartTitle, setCartTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');

  // AI Prompt & inline error state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);

  // Script & Visual pairs
  const [hook, setHook] = useState('');
  const [hookVisual, setHookVisual] = useState('');
  const [script, setScript] = useState('');
  const [bodyVisual, setBodyVisual] = useState('');
  const [cta, setCta] = useState('');
  const [ctaVisual, setCtaVisual] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');

  // Maximize editor state
  const [maximizedField, setMaximizedField] = useState<{ title: string; field: string; value: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper to strip markdown asterisks and noise
  const cleanField = (text?: string | null) => {
    if (!text) return '';
    return text
      .split('***').join('')
      .split('**').join('')
      .split('###').join('')
      .split('##').join('')
      .trim();
  };

  useEffect(() => {
    if (contentToEdit && (contentToEdit as Content).id) {
      setTitle(cleanField(contentToEdit.title));
      setPlatform(contentToEdit.platform || 'TikTok');
      setFormat(contentToEdit.format || 'Video');
      setDurationSlides(contentToEdit.duration_slides || '');
      setPillar(contentToEdit.pillar || (currentBrand?.pillars[0] || ''));
      setFunnel(contentToEdit.funnel || (currentBrand?.funnels[0] || ''));
      setObjective(contentToEdit.objective || (currentBrand?.objectives[0] || ''));
      setStatus(contentToEdit.status || 'ideation');
      setScheduledDate(contentToEdit.scheduled_date ? new Date(contentToEdit.scheduled_date).toISOString().slice(0, 16) : '');
      setCartTitle(contentToEdit.cart_title || '');
      setReferenceUrl(contentToEdit.content_reference_url || '');
      setAiPrompt(contentToEdit.ai_prompt || '');
      setHook(cleanField(contentToEdit.hook));
      setHookVisual(cleanField(contentToEdit.hook_visual));
      setScript(cleanField(contentToEdit.script));
      setBodyVisual(cleanField(contentToEdit.body_visual));
      setCta(cleanField(contentToEdit.cta));
      setCtaVisual(cleanField(contentToEdit.cta_visual));
      setCaption(cleanField(contentToEdit.caption));
      setNotes(cleanField(contentToEdit.notes));
    } else {
      setTitle(cleanField(contentToEdit?.title));
      setPlatform(contentToEdit?.platform || 'TikTok');
      setFormat(contentToEdit?.format || 'Video');
      setDurationSlides(contentToEdit?.duration_slides || '');
      setPillar(contentToEdit?.pillar || currentBrand?.pillars[0] || 'Edukasi & Tutorial');
      setFunnel(contentToEdit?.funnel || currentBrand?.funnels[0] || 'TOFU (Top of Funnel)');
      setObjective(contentToEdit?.objective || currentBrand?.objectives[0] || 'Brand Awareness');
      setStatus(contentToEdit?.status || (initialScheduledDate ? 'scheduled' : 'ideation'));
      
      let dateVal = '';
      if (contentToEdit?.scheduled_date) {
        try {
          dateVal = new Date(contentToEdit.scheduled_date).toISOString().slice(0, 16);
        } catch {
          dateVal = String(contentToEdit.scheduled_date);
        }
      } else if (initialScheduledDate) {
        dateVal = initialScheduledDate.includes('T') ? initialScheduledDate.slice(0, 16) : `${initialScheduledDate}T09:00`;
      }
      setScheduledDate(dateVal);

      setCartTitle(contentToEdit?.cart_title || '');
      setReferenceUrl(contentToEdit?.content_reference_url || '');
      setAiPrompt(contentToEdit?.ai_prompt || '');
      setHook(cleanField(contentToEdit?.hook));
      setHookVisual(cleanField(contentToEdit?.hook_visual));
      setScript(cleanField(contentToEdit?.script));
      setBodyVisual(cleanField(contentToEdit?.body_visual));
      setCta(cleanField(contentToEdit?.cta));
      setCtaVisual(cleanField(contentToEdit?.cta_visual));
      setCaption(cleanField(contentToEdit?.caption));
      setNotes(cleanField(contentToEdit?.notes));
    }
    setAiError(null);
    setAiSuccess(false);
    setSubmitError(null);
  }, [contentToEdit, currentBrand, isOpen, initialScheduledDate]);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(false);

    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          platform,
          format,
          pillar,
          funnel,
          objective,
          prompt: aiPrompt,
          brand_id: currentBrand?.id,
          user_id: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'Gagal generate naskah dengan AI');
      } else if (data.result) {
        if (data.result.hook) setHook(cleanField(data.result.hook));
        if (data.result.hook_visual) setHookVisual(cleanField(data.result.hook_visual));
        if (data.result.script) setScript(cleanField(data.result.script));
        if (data.result.body_visual) setBodyVisual(cleanField(data.result.body_visual));
        if (data.result.cta) setCta(cleanField(data.result.cta));
        if (data.result.cta_visual) setCtaVisual(cleanField(data.result.cta_visual));
        if (data.result.caption) setCaption(cleanField(data.result.caption));
        setAiSuccess(true);
      }
    } catch (e: any) {
      setAiError(e.message || 'Koneksi ke server gagal.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Judul / topik konten wajib diisi');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      brand_id: currentBrand?.id,
      title: title.trim(),
      platform,
      format,
      duration_slides: durationSlides,
      pillar,
      funnel,
      objective,
      status,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      cart_title: cartTitle,
      content_reference_url: referenceUrl,
      ai_prompt: aiPrompt,
      hook,
      hook_visual: hookVisual,
      script,
      body_visual: bodyVisual,
      cta,
      cta_visual: ctaVisual,
      caption,
      notes,
      created_by: user?.id,
      userRole: role,
    };

    try {
      const isEditing = Boolean(contentToEdit && (contentToEdit as Content).id);
      const url = isEditing ? `/api/contents/${(contentToEdit as Content).id}` : '/api/contents';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        setSubmitError(result.error || 'Gagal menyimpan konten');
      } else {
        onSaved(result.content);
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyMaximized = (val: string) => {
    if (!maximizedField) return;
    switch (maximizedField.field) {
      case 'hook': setHook(val); break;
      case 'hookVisual': setHookVisual(val); break;
      case 'script': setScript(val); break;
      case 'bodyVisual': setBodyVisual(val); break;
      case 'cta': setCta(val); break;
      case 'ctaVisual': setCtaVisual(val); break;
      case 'caption': setCaption(val); break;
      case 'notes': setNotes(val); break;
    }
    setMaximizedField(null);
  };

  // Reusable label styling with crisp contrast
  const labelClass = "block font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-xs tracking-tight";
  // Reusable input styling with high contrast in both themes
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {contentToEdit && (contentToEdit as Content).id ? 'Edit Konten Terdaftar' : 'Studio Perencanaan Konten Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Brand:{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {currentBrand?.name || 'Socilift Studio'}
                </span>
                {scheduledDate && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                    📅 {new Date(scheduledDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Card 1: Informasi Pokok & Platform */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Informasi Pokok & Platform
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Judul / Topik Konten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Contoh: 3 Rumus Hook FYP TikTok yang Jarang Dibongkar"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Platform Target <span className="text-rose-500">*</span>
                </label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as PlatformCode)}
                  className={inputClass}
                >
                  <option value="TikTok">TikTok</option>
                  <option value="IG">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="FB">Facebook</option>
                  <option value="X">X (Twitter)</option>
                  <option value="Threads">Threads</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Format Konten</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className={inputClass}
                >
                  <option value="Video">Video (Shorts/Reels/TikTok)</option>
                  <option value="Carousel">Carousel (Slideshow)</option>
                  <option value="Image">Single Image</option>
                  <option value="Post">Feed Post</option>
                  <option value="Utas">Utas / Thread</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Durasi / Jumlah Slide</label>
                <input
                  type="text"
                  value={durationSlides}
                  onChange={e => setDurationSlides(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: 60s atau 7 slides"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Strategi & Funneling */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Strategi Konten, Funnel & Status
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Pilar Konten</label>
                <select
                  value={pillar}
                  onChange={e => setPillar(e.target.value)}
                  className={inputClass}
                >
                  {(currentBrand?.pillars || ['Edukasi & Tutorial', 'Behind The Scene', 'Product Review']).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tahapan Funnel</label>
                <select
                  value={funnel}
                  onChange={e => setFunnel(e.target.value)}
                  className={inputClass}
                >
                  {(currentBrand?.funnels || ['TOFU (Top of Funnel)', 'MOFU (Middle of Funnel)', 'BOFU (Bottom of Funnel)']).map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Objective Konten</label>
                <select
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  className={inputClass}
                >
                  {(currentBrand?.objectives || ['Brand Awareness', 'Engagement', 'Sales & Conversion']).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Status Alur Produksi</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ContentStatus)}
                  className={`${inputClass} font-bold text-blue-600 dark:text-blue-400`}
                >
                  <option value="ideation">1. Ideation</option>
                  <option value="scripting">2. Scripting</option>
                  <option value="take_konten">3. Take Konten</option>
                  <option value="editing">4. Editing</option>
                  <option value="scheduled">5. Scheduled</option>
                  <option value="published">6. Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Jadwal & Link Komersial */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Jadwal Posting & Referensi Penjualan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Tanggal & Jam Posting</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Judul Keranjang / Produk Afiliasi</label>
                <input
                  type="text"
                  value={cartTitle}
                  onChange={e => setCartTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: Template Socilift Pro"
                />
              </div>
              <div>
                <label className={labelClass}>Referensi Konten (URL Inspirasi)</label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={e => setReferenceUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </div>
          </div>

          {/* Card 4: Socilift AI Studio (Prompt & Generator) */}
          <div className="p-4.5 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-yellow-400 animate-pulse" />
                <span className="font-bold text-xs text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                  Socilift AI Studio Generator
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{aiLoading ? 'AI Sedang Menyusun Naskah...' : 'Generate with Socilift AI'}</span>
              </button>
            </div>

            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
              placeholder="Berikan arahan opsional (misal: 'Bikin gaya bahasa santai ala Gen Z, pakai analogi makanan, beri call to action save konten')..."
            />

            {/* Bug Fix #4: Inline Error + Manual Settings Link */}
            {aiError && (
              <div className="p-3 rounded-xl bg-red-100/90 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{aiError}</span>
                </div>
                <Link
                  href="/settings/api-key"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 font-bold text-xs border border-red-300 dark:border-red-700 hover:bg-red-50 transition shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Buka Settings API</span>
                </Link>
              </div>
            )}

            {aiSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Naskah berhasil dibuat! Kolom Hook, Body, CTA, dan Caption di bawah otomatis terisi.</span>
              </div>
            )}
          </div>

          {/* Card 5: Production Script & Visuals */}
          <div className="space-y-4">
            {/* Hook Pair */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Hook / Opening Teks (0-3 Detik)</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Hook / Opening Teks', field: 'hook', value: hook })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={hook}
                  onChange={e => setHook(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Contoh: Stop scrolling! Ini alasan kenapa video kamu stuck di 200 views..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Visual Arahan Hook</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Visual Arahan Hook', field: 'hookVisual', value: hookVisual })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={hookVisual}
                  onChange={e => setHookVisual(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Contoh: Wajah kaget, ekspresi menunjuk layar smartphone dengan grafik merah..."
                />
              </div>
            </div>

            {/* Body Pair */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Body / Naskah Inti Video</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Body / Naskah Inti', field: 'script', value: script })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={script}
                  onChange={e => setScript(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Tulis naskah lengkap atau poin penting yang dibawakan..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Visual Arahan Body (B-Roll & Editing)</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Visual Arahan Body', field: 'bodyVisual', value: bodyVisual })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={bodyVisual}
                  onChange={e => setBodyVisual(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Contoh: Screen record tutorial CapCut, infografis langkah demi langkah..."
                />
              </div>
            </div>

            {/* CTA Pair */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Call to Action (CTA)</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Call to Action (CTA)', field: 'cta', value: cta })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={cta}
                  onChange={e => setCta(e.target.value)}
                  rows={2}
                  className={inputClass}
                  placeholder="Contoh: Komen 'HOOK' untuk dapatkan panduan template gratis!"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Visual Arahan CTA</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Visual Arahan CTA', field: 'ctaVisual', value: ctaVisual })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={ctaVisual}
                  onChange={e => setCtaVisual(e.target.value)}
                  rows={2}
                  className={inputClass}
                  placeholder="Contoh: Panah animasi bergerak menunjuk kolom komentar..."
                />
              </div>
            </div>

            {/* Caption & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Caption Lengkap & Hashtags</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Caption Lengkap', field: 'caption', value: caption })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Tulis caption postingan beserta hashtag relevan..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Catatan Tim / Notes Internal</label>
                  <button
                    type="button"
                    onClick={() => setMaximizedField({ title: 'Catatan Tim', field: 'notes', value: notes })}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Catatan untuk video editor, talent, atau jadwal take..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 text-xs cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : (contentToEdit ? 'Simpan Perubahan' : 'Tambah Konten ke Planner')}
            </button>
          </div>
        </form>
      </div>

      {/* Maximize Fullscreen Overlay Modal */}
      {maximizedField && (
        <div className="fixed inset-0 bg-black/85 z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[82vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Fullscreen Editor: {maximizedField.title}
              </h3>
              <button
                onClick={() => setMaximizedField(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex-1 bg-white dark:bg-slate-900">
              <textarea
                value={maximizedField.value}
                onChange={e => setMaximizedField({ ...maximizedField, value: e.target.value })}
                className="w-full h-full p-4 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none font-sans leading-relaxed bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setMaximizedField(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                onClick={() => handleApplyMaximized(maximizedField.value)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                Terapkan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
