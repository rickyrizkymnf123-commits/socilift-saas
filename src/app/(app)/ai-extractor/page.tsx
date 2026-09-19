'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AIExtractorJob, Content, PlatformCode, Metric } from '@/types/database';
import {
  Upload,
  Sparkles,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Edit,
  Save,
  X,
  Target,
  Layers,
  Trash2,
} from 'lucide-react';

export default function AIExtractorPage() {
  const router = useRouter();
  const { currentBrand, user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<AIExtractorJob[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form state for Multi-file batch
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [platform, setPlatform] = useState<PlatformCode>('TikTok');
  const [dateLogged, setDateLogged] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Review & Confirm state
  const [reviewJob, setReviewJob] = useState<AIExtractorJob | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [editableMetrics, setEditableMetrics] = useState<Partial<Metric>>({});
  const [importing, setImporting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Check API Key
  const checkKey = async () => {
    try {
      const res = await fetch('/api/gemini-settings');
      if (res.ok) {
        const data = await res.json();
        const has = data.settings?.has_key;
        setHasApiKey(has);
        if (!has) {
          setToast('Butuh konfigurasi Gemini API Key dulu...');
          setTimeout(() => {
            router.push('/settings/api-key');
          }, 1800);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobsAndContents = async () => {
    if (!currentBrand) return;
    setLoading(true);
    try {
      const [jRes, cRes] = await Promise.all([
        fetch(`/api/ai/extractor/upload-init?brandId=${currentBrand.id}`),
        fetch(`/api/contents?brandId=${currentBrand.id}`),
      ]);

      if (jRes.ok) {
        const jData = await jRes.json();
        setJobs(jData.jobs || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setContents(cData.contents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
    fetchJobsAndContents();
  }, [currentBrand]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Cap at 10 files
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !currentBrand) return;
    setUploading(true);
    setBatchProgress({ current: 1, total: selectedFiles.length });

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setBatchProgress({ current: i + 1, total: selectedFiles.length });

        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 1. Init Job
        const res = await fetch('/api/ai/extractor/upload-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: currentBrand.id,
            user_id: user?.id,
            file_name: file.name,
            file_mime_type: file.type || 'image/png',
            file_size: file.size,
            file_base64: base64Data,
            platform,
            date_logged: dateLogged,
          }),
        });

        const data = await res.json();
        if (res.ok && data.job) {
          // 2. Start Processing Job
          await fetch(`/api/ai/extractor/${data.job.id}/process`, { method: 'POST' });
        }
      }

      setSelectedFiles([]);
      fetchJobsAndContents();
      setToast(`✓ Berhasil memproses ${selectedFiles.length} screenshot dengan Gemini AI!`);
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      console.error(err);
      setToast(`Terjadi error saat ekstraksi: ${err.message}`);
    } finally {
      setUploading(false);
      setBatchProgress(null);
    }
  };

  const openReview = (job: AIExtractorJob) => {
    setReviewJob(job);
    const extracted = job.result?.extractedRows?.[0] || {};
    setEditableMetrics(extracted);

    // Auto-select matched content if detected by backend, or fallback to first matching content
    const matchedId =
      job.result?.matchedContentId ||
      (extracted as any).matched_content_id ||
      contents.find(c => c.platform === job.platform)?.id ||
      contents[0]?.id ||
      '';

    setSelectedContentId(matchedId);
  };

  const handleConfirmImport = async () => {
    if (!reviewJob || !selectedContentId) return;
    setImporting(true);

    try {
      const res = await fetch(`/api/ai/extractor/${reviewJob.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: selectedContentId,
          metricData: editableMetrics,
        }),
      });

      if (res.ok) {
        setReviewJob(null);
        fetchJobsAndContents();
        setToast('✓ Metrik berhasil diimpor dan disimpan ke database!');
        setTimeout(() => setToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ready_to_review':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Ready to Review</span>;
      case 'imported':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Imported</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">Processing...</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {toast && (
        <div className="p-3.5 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Metrics Extractor</h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
          Ekstrak angka analitik otomatis dari screenshot (hingga 10 file sekaligus) dan auto-match ke judul konten di database secara cerdas.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Upload Screenshot Metrik (Batch 1-10 Files)</h2>
          {selectedFiles.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-black">
              {selectedFiles.length} file dipilih
            </span>
          )}
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Platform Media Sosial</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as PlatformCode)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="TikTok">TikTok Analytics</option>
                <option value="IG">Instagram Professional Dashboard</option>
                <option value="YouTube">YouTube Studio</option>
                <option value="FB">Facebook Meta Business Suite</option>
                <option value="X">X (Twitter) Analytics</option>
                <option value="Threads">Threads Analytics</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Data Diambil</label>
              <input
                type="date"
                value={dateLogged}
                onChange={e => setDateLogged(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          {/* Drag & drop upload area with multiple file support */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Tarik & lepas hingga 10 screenshot metrik ke sini, atau klik untuk memilih file
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Format: PNG, JPG, JPEG (Mendukung upload multi-file sekaligus)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              id="file-screenshot"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-300 dark:border-slate-700 shadow-xs"
            >
              Pilih Gambar
            </button>
          </div>

          {/* Selected File Chips */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Antrean File:</span>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 font-semibold"
                  >
                    <FileImage className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="max-w-[150px] truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-slate-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {batchProgress ? (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                Sedang mengekstrak screenshot {batchProgress.current} dari {batchProgress.total}...
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={selectedFiles.length === 0 || uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengekstrak Batch ({batchProgress?.current}/{batchProgress?.total})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Proses {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Ekstraksi AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Jobs Queue List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Riwayat Antrean Ekstraksi ({jobs.length})</h2>
          <button onClick={fetchJobsAndContents} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">Belum ada file yang diunggah.</div>
          ) : (
            jobs.map(job => {
              const matchedTitle = job.result?.matchedContentTitle;
              return (
                <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{job.file_name}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                          {job.platform}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Tanggal data: {job.date_logged} • Progress: {job.progress}%
                        {matchedTitle && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                            🎯 Auto-match: {matchedTitle}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {statusBadge(job.status)}
                    {job.status === 'ready_to_review' && (
                      <button
                        onClick={() => openReview(job)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        Review & Impor →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Modal with Auto-Match Banner */}
      {reviewJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Review Data Hasil Ekstraksi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Periksa angka sebelum dimasukkan ke database metrik.
                </p>
              </div>
              <button onClick={() => setReviewJob(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Auto-Match Indicator Callout */}
              {reviewJob.result?.detectedTitle && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black">AI Auto-Match Terdeteksi:</span> Teks terbaca pada screenshot: <em>"{reviewJob.result.detectedTitle}"</em>.
                    {reviewJob.result.matchedContentTitle && (
                      <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                        Otomatis dipasangkan dengan konten: <strong>{reviewJob.result.matchedContentTitle}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Target Content Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hubungkan dengan Konten Terdaftar <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedContentId}
                  onChange={e => setSelectedContentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="">-- Pilih Konten --</option>
                  {contents.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.platform}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Editable Extracted Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['views', 'impressions', 'likes', 'comments', 'shares', 'saves', 'clicks', 'watch_time', 'thru_plays'].map(key => (
                  <div key={key}>
                    <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 text-[10px]">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="number"
                      value={(editableMetrics as any)[key] ?? ''}
                      onChange={e => setEditableMetrics({ ...editableMetrics, [key]: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                ))}
              </div>

              {reviewJob.result?.extractionSummary && (
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold">
                  {reviewJob.result.extractionSummary}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReviewJob(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || !selectedContentId}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {importing ? 'Menyimpan...' : 'Konfirmasi & Impor ke Metrik'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
