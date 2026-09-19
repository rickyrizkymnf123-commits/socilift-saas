'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Content, ContentStatus } from '@/types/database';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  Hourglass,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  AlertCircle,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import ContentModal from '@/components/content/content-modal';
import ContentDetailModal from '@/components/content/content-detail-modal';
import { exportToCSV, parseCSV, downloadContentCSVTemplate, CSVColumn } from '@/lib/csv-helper';

export default function ContentDatabasePage() {
  const { currentBrand, role } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ContentStatus>('scripting');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [funnelFilter, setFunnelFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentToEdit, setContentToEdit] = useState<Content | null>(null);
  
  // CSV Import Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<Partial<Content>>>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status feedback toast
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  const fetchContents = async () => {
    if (!currentBrand) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contents?brandId=${currentBrand.id}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    setSelectedIds([]);
  }, [currentBrand]);

  // Filter logic
  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.script && c.script.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.hook && c.hook.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchPlatform = platformFilter === 'All' || c.platform === platformFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchFunnel = funnelFilter === 'All' || c.funnel === funnelFilter;
      return matchSearch && matchPlatform && matchStatus && matchFunnel;
    });
  }, [contents, searchQuery, platformFilter, statusFilter, funnelFilter]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredContents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContents.map(c => c.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Status Update
  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/contents/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          ids: selectedIds,
          status: bulkStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setContents(prev =>
          prev.map(item =>
            selectedIds.includes(item.id) ? { ...item, status: bulkStatus } : item
          )
        );
        setStatusSuccess(`Berhasil mengubah status ${selectedIds.length} konten menjadi ${bulkStatus}.`);
        setTimeout(() => setStatusSuccess(null), 3500);
        setSelectedIds([]);
      } else {
        setStatusError(data.error || 'Gagal mengubah status massal');
        setTimeout(() => setStatusError(null), 4000);
      }
    } catch (e: any) {
      setStatusError(e.message || 'Error processing bulk status');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedIds.length} konten terpilih secara permanen?`)) return;
    
    setBulkProcessing(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/contents/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ids: selectedIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setContents(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setStatusSuccess(`Berhasil menghapus ${selectedIds.length} konten.`);
        setTimeout(() => setStatusSuccess(null), 3500);
        setSelectedIds([]);
      } else {
        setStatusError(data.error || 'Gagal menghapus konten terpilih');
        setTimeout(() => setStatusError(null), 4000);
      }
    } catch (e: any) {
      setStatusError(e.message || 'Error processing bulk delete');
    } finally {
      setBulkProcessing(false);
    }
  };

  // CSV Export Definition
  const contentColumns: CSVColumn<Content>[] = [
    { key: 'title', label: 'Judul Konten' },
    { key: 'platform', label: 'Platform' },
    { key: 'format', label: 'Format' },
    { key: 'pillar', label: 'Pilar Konten' },
    { key: 'funnel', label: 'Funnel' },
    { key: 'hook', label: 'Hook' },
    { key: 'hook_visual', label: 'Visual Hook' },
    { key: 'script', label: 'Naskah / Script' },
    { key: 'body_visual', label: 'Visual Body' },
    { key: 'cta', label: 'CTA' },
    { key: 'cta_visual', label: 'Visual CTA' },
    { key: 'caption', label: 'Caption' },
    { 
      key: 'scheduled_date', 
      label: 'Tanggal Jadwal',
      format: (val) => val ? new Date(val).toISOString().split('T')[0] : ''
    },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Catatan' },
  ];

  // Export Selected / Filtered CSV
  const handleExportCSV = (selectedOnly: boolean = false) => {
    const targetContents = selectedOnly
      ? contents.filter(c => selectedIds.includes(c.id))
      : filteredContents;

    if (targetContents.length === 0) {
      alert('Tidak ada data konten untuk di-export.');
      return;
    }

    const brandName = currentBrand?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'socilift';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${brandName}_content_database_${timestamp}`;
    
    exportToCSV(filename, contentColumns, targetContents);
    setStatusSuccess(`Berhasil mengunduh ${targetContents.length} baris konten ke CSV.`);
    setTimeout(() => setStatusSuccess(null), 3000);
  };

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const { headers, rows } = parseCSV(text);

        if (rows.length === 0) {
          setImportError('File CSV kosong atau format header tidak valid.');
          setParsedRows([]);
          return;
        }

        // Map parsed rows flexible
        const mappedItems: Array<Partial<Content>> = rows.map(r => {
          // Normalize keys
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(r).find(
                col => col.trim().toLowerCase().includes(k.toLowerCase())
              );
              if (matchedKey && r[matchedKey] !== undefined) {
                return r[matchedKey].trim();
              }
            }
            return '';
          };

          const rawStatus = getVal('status').toLowerCase();
          const validStatus: ContentStatus = ['ideation', 'scripting', 'take_konten', 'editing', 'scheduled', 'published'].includes(rawStatus)
            ? (rawStatus as ContentStatus)
            : 'ideation';

          const rawPlatform = getVal('platform') || 'TikTok';
          const platform = rawPlatform.toLowerCase().includes('ig') || rawPlatform.toLowerCase().includes('insta')
            ? 'IG'
            : rawPlatform.toLowerCase().includes('you')
            ? 'YouTube'
            : rawPlatform.toLowerCase().includes('face')
            ? 'FB'
            : rawPlatform.toLowerCase().includes('thread')
            ? 'Threads'
            : rawPlatform.toLowerCase().includes('x') || rawPlatform.toLowerCase().includes('twitter')
            ? 'X'
            : 'TikTok';

          return {
            title: getVal('judul', 'title') || 'Konten Tanpa Judul',
            platform: platform as any,
            format: (getVal('format') || 'Video') as any,
            pillar: getVal('pilar', 'pillar') || null,
            funnel: getVal('funnel') || null,
            hook: getVal('hook'),
            hook_visual: getVal('visual hook', 'hook_visual'),
            script: getVal('naskah', 'script'),
            body_visual: getVal('visual body', 'body_visual'),
            cta: getVal('cta'),
            cta_visual: getVal('visual cta', 'cta_visual'),
            caption: getVal('caption'),
            scheduled_date: getVal('tanggal', 'date', 'scheduled') || null,
            status: validStatus,
          };
        }).filter(item => item.title && item.title.trim().length > 0);

        if (mappedItems.length === 0) {
          setImportError('Tidak ada baris konten yang valid ditemukan dalam file CSV.');
          setParsedRows([]);
        } else {
          setParsedRows(mappedItems);
        }
      } catch (err: any) {
        setImportError(`Gagal membaca file: ${err.message}`);
        setParsedRows([]);
      }
    };
    reader.readAsText(file);
  };

  // Submit parsed CSV to database
  const handleSaveImportedContents = async () => {
    if (!currentBrand || parsedRows.length === 0) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await fetch('/api/contents/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          items: parsedRows,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusSuccess(`Berhasil mengimpor ${data.count || parsedRows.length} konten baru!`);
        setTimeout(() => setStatusSuccess(null), 4000);
        setUploadModalOpen(false);
        setImportFile(null);
        setParsedRows([]);
        fetchContents();
      } else {
        setImportError(data.error || 'Gagal menyimpan data ke database');
      }
    } catch (err: any) {
      setImportError(err.message || 'Terjadi kesalahan saat mengimpor data');
    } finally {
      setIsImporting(false);
    }
  };

  // Inline Status Change with Bug Fix #2 Enforced
  const handleInlineStatusChange = async (content: Content, newStatus: ContentStatus) => {
    setStatusError(null);
    try {
      const res = await fetch(`/api/contents/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userRole: role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error || 'Gagal mengubah status');
        setTimeout(() => setStatusError(null), 4000);
      } else {
        setContents(prev => prev.map(item => item.id === content.id ? { ...item, status: newStatus } : item));
      }
    } catch (e: any) {
      setStatusError(e.message || 'Error updating status');
      setTimeout(() => setStatusError(null), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus konten ini?')) return;
    try {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContents(prev => prev.filter(c => c.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAllSelected = filteredContents.length > 0 && selectedIds.length === filteredContents.length;
  const isSomeSelected = selectedIds.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Toast Alert Feedback */}
      {statusError && (
        <div className="p-3.5 bg-red-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusError}</span>
          </div>
          <button onClick={() => setStatusError(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {statusSuccess && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusSuccess}</span>
          </div>
          <button onClick={() => setStatusSuccess(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Content Database</h1>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-black">
              {filteredContents.length} Konten
            </span>
            {selectedIds.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-xs font-black animate-pulse">
                {selectedIds.length} Terpilih
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Daftar seluruh materi, naskah hook & visual, format pilar, ekspor CSV, dan status persetujuan konten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download CSV Template */}
          <button
            onClick={downloadContentCSVTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
            title="Download template CSV untuk impor massal"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Template CSV</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={() => handleExportCSV(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
            title="Export data database konten ke CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Upload CSV */}
          <button
            onClick={() => {
              setImportFile(null);
              setParsedRows([]);
              setImportError(null);
              setUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Impor CSV</span>
          </button>

          {/* Add Content */}
          <button
            onClick={() => {
              setContentToEdit(null);
              setContentModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Konten</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul, hook, atau isi naskah konten..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="All">Semua Platform</option>
            <option value="TikTok">TikTok</option>
            <option value="IG">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="FB">Facebook</option>
            <option value="X">X</option>
            <option value="Threads">Threads</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="All">Semua Status</option>
            <option value="ideation">Ideation</option>
            <option value="scripting">Scripting</option>
            <option value="take_konten">Take Konten</option>
            <option value="editing">Editing</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>

          <select
            value={funnelFilter}
            onChange={e => setFunnelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="All">Semua Funnel</option>
            <option value="TOFU (Top of Funnel)">TOFU</option>
            <option value="MOFU (Middle of Funnel)">MOFU</option>
            <option value="BOFU (Bottom of Funnel)">BOFU</option>
          </select>

          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="p-1 rounded text-slate-500 hover:text-blue-600 transition"
                      title={isAllSelected ? 'Batalkan pilih semua' : 'Pilih semua'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Judul Konten</th>
                  <th className="py-3.5 px-3">Platform</th>
                  <th className="py-3.5 px-3">Format</th>
                  <th className="py-3.5 px-3">Pilar</th>
                  <th className="py-3.5 px-3">Funnel</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Approval</th>
                  <th className="py-3.5 px-3">Tanggal</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
                      Tidak ada konten yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredContents.map(c => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition group cursor-pointer ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
                        }`}
                        onClick={() => {
                          setSelectedContentId(c.id);
                          setDetailModalOpen(true);
                        }}
                      >
                        <td className="py-3.5 px-3 text-center" onClick={e => handleToggleSelect(c.id, e)}>
                          <button className="p-1 rounded text-slate-500 hover:text-blue-600 transition">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {c.title}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-black text-[10px]">
                            {c.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">{c.format || '-'}</td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[120px]">{c.pillar || '-'}</td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">{c.funnel ? c.funnel.split(' ')[0] : '-'}</td>
                        <td className="py-3.5 px-3" onClick={e => e.stopPropagation()}>
                          <select
                            value={c.status}
                            onChange={e => handleInlineStatusChange(c, e.target.value as ContentStatus)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-white dark:bg-slate-900 ${
                              c.status === 'published'
                                ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                                : c.status === 'scheduled'
                                ? 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400'
                                : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <option value="ideation">Ideation</option>
                            <option value="scripting">Scripting</option>
                            <option value="take_konten">Take Konten</option>
                            <option value="editing">Editing</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-3">
                          {c.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                              <Hourglass className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                          {c.scheduled_date
                            ? new Date(c.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setContentToEdit(c);
                                setContentModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContents.map(c => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedContentId(c.id);
                  setDetailModalOpen(true);
                }}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/50 dark:hover:border-blue-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => handleToggleSelect(c.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-black text-[10px]">
                        {c.platform}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {c.title}
                  </h3>
                  {c.hook && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      "{c.hook}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span>{c.format || 'Video'} • {c.funnel ? c.funnel.split(' ')[0] : 'TOFU'}</span>
                  <span>
                    {c.scheduled_date ? new Date(c.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'No date'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Sticky Bulk Actions Bar */}
      {isSomeSelected && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-6">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700 rounded-2xl shadow-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 max-w-4xl w-full backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black">
                {selectedIds.length}
              </span>
              <div>
                <p className="text-xs font-bold leading-none">Konten Terpilih</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Terapkan aksi serentak ke seluruh konten yang dicentang</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Bulk Change Status */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value as ContentStatus)}
                  className="bg-transparent text-xs font-bold text-white px-2 py-1 outline-none"
                >
                  <option value="ideation" className="bg-slate-900 text-white">Ideation</option>
                  <option value="scripting" className="bg-slate-900 text-white">Scripting</option>
                  <option value="take_konten" className="bg-slate-900 text-white">Take Konten</option>
                  <option value="editing" className="bg-slate-900 text-white">Editing</option>
                  <option value="scheduled" className="bg-slate-900 text-white">Scheduled</option>
                  <option value="published" className="bg-slate-900 text-white">Published</option>
                </select>
                <button
                  onClick={handleBulkStatusChange}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Ubah Status
                </button>
              </div>

              {/* Bulk Export Selected */}
              <button
                onClick={() => handleExportCSV(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                title="Export hanya konten yang dipilih"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export ({selectedIds.length})</span>
              </button>

              {/* Bulk Delete */}
              <button
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-xs font-bold transition flex items-center gap-1.5 text-white disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              {/* Cancel Selection */}
              <button
                onClick={() => setSelectedIds([])}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
                title="Batalkan Pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Detail Modal */}
      <ContentDetailModal
        isOpen={detailModalOpen}
        contentId={selectedContentId}
        onClose={() => setDetailModalOpen(false)}
        onEdit={content => {
          setContentToEdit(content);
          setContentModalOpen(true);
        }}
        onDuplicate={content => {
          const dup = { ...content, title: `${content.title} (Copy)`, id: '' };
          setContentToEdit(dup as any);
          setContentModalOpen(true);
        }}
        onContentUpdated={fetchContents}
      />

      {/* Universal Add / Edit Modal */}
      <ContentModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setContentToEdit(null);
        }}
        onSaved={fetchContents}
        contentToEdit={contentToEdit}
      />

      {/* Upload Konten CSV / XLSX Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Impor Konten Massal (CSV)</h3>
              </div>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setImportFile(null);
                  setParsedRows([]);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {parsedRows.length === 0 ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Klik atau Drag & Drop file CSV ke sini
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Mendukung file .csv terstruktur dari Google Sheets / Excel
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
                  >
                    Pilih File CSV
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                  <div className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                    Belum punya format template? Unduh template resmi Socilift di sini.
                  </div>
                  <button
                    onClick={downloadContentCSVTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Pratinjau Data ({parsedRows.length} Konten Ditemukan)
                  </span>
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setImportFile(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Ganti File
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Judul Konten</th>
                        <th className="py-2 px-3">Platform</th>
                        <th className="py-2 px-3">Format</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold truncate max-w-xs">{row.title}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[10px] font-black">
                              {row.platform}
                            </span>
                          </td>
                          <td className="py-2 px-3">{row.format || 'Video'}</td>
                          <td className="py-2 px-3 capitalize">{row.status || 'ideation'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setImportFile(null);
                  setParsedRows([]);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              {parsedRows.length > 0 && (
                <button
                  onClick={handleSaveImportedContents}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan & Masukkan ke Database ({parsedRows.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
