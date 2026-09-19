'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Content, PlatformCode, ContentStatus } from '@/types/database';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Calendar as CalendarIcon,
  X,
  Download,
  Filter,
  Move,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ContentDetailModal from '@/components/content/content-detail-modal';
import ContentModal from '@/components/content/content-modal';
import { downloadCalendarICS } from '@/lib/ical-helper';

export default function CalendarPage() {
  const { currentBrand, role } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filtering states
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Drag and Drop states
  const [draggedContentId, setDraggedContentId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Modals & Navigation
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<Content | null>(null);
  const [initialScheduledDate, setInitialScheduledDate] = useState<string | null>(null);
  
  // Feedback Toasts
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const fetchContents = async () => {
    if (!currentBrand) return;
    try {
      const res = await fetch(`/api/contents?brandId=${currentBrand.id}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [currentBrand]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (dateStr: string) => {
    setContentToEdit(null);
    setInitialScheduledDate(dateStr);
    setContentModalOpen(true);
  };

  // Platform color badge mapping for light and dark
  const platformColors: Record<PlatformCode, { bg: string; text: string; dot: string }> = {
    IG: { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-200', dot: '#E1306C' },
    TikTok: { bg: 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700', text: 'text-white', dot: '#38bdf8' },
    YouTube: { bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200', dot: '#FF0000' },
    FB: { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200', dot: '#1877F2' },
    X: { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700', text: 'text-slate-900 dark:text-slate-100', dot: '#64748b' },
    Threads: { bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700', text: 'text-zinc-900 dark:text-zinc-100', dot: '#a1a1aa' },
  };

  // Filtered Contents based on active filters
  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      const matchPlatform = platformFilter === 'All' || c.platform === platformFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchPlatform && matchStatus;
    });
  }, [contents, platformFilter, statusFilter]);

  // Group contents by date string YYYY-MM-DD
  const contentsByDate = useMemo(() => {
    const map: Record<string, Content[]> = {};
    filteredContents.forEach(c => {
      if (c.scheduled_date) {
        const dateStr = new Date(c.scheduled_date).toISOString().split('T')[0];
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(c);
      }
    });
    return map;
  }, [filteredContents]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, content: Content) => {
    e.dataTransfer.setData('text/plain', content.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedContentId(content.id);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (dateStr: string) => {
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDropToDate = async (e: React.DragEvent, newDateStr: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);
    const contentId = e.dataTransfer.getData('text/plain') || draggedContentId;
    setDraggedContentId(null);

    if (!contentId) return;
    const targetContent = contents.find(c => c.id === contentId);
    if (!targetContent) return;

    const oldDateStr = targetContent.scheduled_date
      ? new Date(targetContent.scheduled_date).toISOString().split('T')[0]
      : null;

    if (oldDateStr === newDateStr) return; // No change

    const newIsoDate = `${newDateStr}T00:00:00.000Z`;

    // Optimistic UI update
    setContents(prev =>
      prev.map(c => (c.id === contentId ? { ...c, scheduled_date: newIsoDate } : c))
    );

    const formattedTarget = new Date(newDateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    setToastMessage({
      type: 'success',
      text: `Konten "${targetContent.title}" berhasil dijadwalkan ulang ke ${formattedTarget}.`,
    });
    setTimeout(() => setToastMessage(null), 4000);

    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: newIsoDate,
          userRole: role,
        }),
      });
      if (!res.ok) {
        // Rollback on failure
        fetchContents();
        setToastMessage({
          type: 'error',
          text: 'Gagal memperbarui jadwal di server. Dikembalikan ke posisi semula.',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      fetchContents();
    }
  };

  const handleICSDownload = () => {
    const scheduled = contents.filter(c => c.scheduled_date);
    if (scheduled.length === 0) {
      setToastMessage({
        type: 'info',
        text: 'Belum ada konten dengan tanggal terjadwal untuk diekspor ke Kalender.',
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    downloadCalendarICS(currentBrand?.name || 'Socilift', contents);
    setToastMessage({
      type: 'success',
      text: `Berhasil mengunduh kalender (${scheduled.length} jadwal) dalam format .ICS siap impor.`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600'
              : toastMessage.type === 'error'
              ? 'bg-red-600'
              : 'bg-indigo-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Month Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kalender Konten</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Geser (drag & drop) kartu konten untuk reschedule tanggal dengan instan.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-slate-900 dark:text-white min-w-[120px] text-center">
              {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentDate)}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs"
          >
            Hari Ini
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download ICS */}
          <button
            onClick={handleICSDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
            title="Download file kalender .ICS untuk Google / Apple / Outlook Calendar"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Download .ICS (iCal)</span>
          </button>

          {/* Sync GCal Direct */}
          <button
            onClick={() => {
              window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank');
              setToastMessage({
                type: 'info',
                text: 'Buka menu Settings Google Calendar dan pilih "Import" lalu pilih file .ICS yang Anda unduh.',
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sync Google Calendar</span>
          </button>

          {/* Add Content */}
          <button
            onClick={() => {
              setContentToEdit(null);
              setInitialScheduledDate(null);
              setContentModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Konten Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Filter Platform:</span>
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold outline-none"
            >
              <option value="All">Semua Platform</option>
              <option value="TikTok">TikTok</option>
              <option value="IG">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="FB">Facebook</option>
              <option value="X">X</option>
              <option value="Threads">Threads</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold outline-none"
            >
              <option value="All">Semua Status</option>
              <option value="ideation">Ideation</option>
              <option value="scripting">Scripting</option>
              <option value="take_konten">Take Konten</option>
              <option value="editing">Editing</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          <Move className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Tarik kartu konten ke tanggal lain untuk mengubah jadwal posting</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/80 text-center py-2.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <span className="text-red-600 dark:text-red-400">Min</span>
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span className="text-blue-600 dark:text-blue-400">Sab</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800 min-h-[600px]">
          {/* Empty prefix days */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/40 dark:bg-slate-950/30 p-2 min-h-[110px]" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayContents = contentsByDate[dateStr] || [];
            const isToday =
              new Date().toDateString() === new Date(year, month, dayNum).toDateString();
            const isDragTarget = dragOverDate === dateStr;

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => handleDayClick(dateStr)}
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDragLeave={() => handleDragLeave(dateStr)}
                onDrop={(e) => handleDropToDate(e, dateStr)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDayClick(dateStr);
                  }
                }}
                className={`p-2 min-h-[110px] flex flex-col justify-between cursor-pointer transition-all duration-150 group relative select-none ${
                  isDragTarget
                    ? 'bg-blue-100/70 dark:bg-blue-900/50 ring-2 ring-blue-500 ring-inset scale-[1.01] z-10'
                    : isToday
                    ? 'bg-blue-50/40 dark:bg-blue-950/25'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
                title={`Klik tanggal ${dayNum} untuk tambah konten baru atau drop kartu ke sini`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {/* Quick Add badge indicator on hover */}
                    <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/90 dark:bg-blue-950/90 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition">
                      <Plus className="w-2.5 h-2.5" /> +
                    </span>
                  </div>
                  {dayContents.length > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {dayContents.length} post
                    </span>
                  )}
                </div>

                {/* Content Chips */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                  {dayContents.map(c => {
                    const styling = platformColors[c.platform] || {
                      bg: 'bg-slate-100 dark:bg-slate-800',
                      text: 'text-slate-800 dark:text-slate-200',
                      dot: '#64748b',
                    };
                    const isBeingDragged = draggedContentId === c.id;

                    return (
                      <div
                        key={c.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, c)}
                        onDragEnd={() => {
                          setDraggedContentId(null);
                          setDragOverDate(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContentId(c.id);
                          setDetailModalOpen(true);
                        }}
                        className={`w-full text-left p-1.5 rounded-lg border text-[11px] font-bold truncate transition block shadow-2xs cursor-grab active:cursor-grabbing hover:scale-[1.02] ${
                          styling.bg
                        } ${styling.text} ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed border-blue-500' : ''
                        }`}
                        title={`Tarik kartu ini untuk memindahkan tanggal. Klik untuk detail.`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: styling.dot }}
                          />
                          <span className="truncate">{c.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Legend */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-center gap-6 text-xs text-slate-700 dark:text-slate-300">
        <span className="font-black text-slate-900 dark:text-white">Platform Legend:</span>
        {Object.entries(platformColors).map(([code, style]) => (
          <div key={code} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.dot }} />
            <span className="font-bold">{code}</span>
          </div>
        ))}
      </div>

      {/* Universal Detail Modal */}
      <ContentDetailModal
        isOpen={detailModalOpen}
        contentId={selectedContentId}
        onClose={() => setDetailModalOpen(false)}
        onEdit={content => {
          setContentToEdit(content);
          setInitialScheduledDate(null);
          setContentModalOpen(true);
        }}
        onDuplicate={content => {
          const duplicated = { ...content, title: `${content.title} (Copy)`, id: '' };
          setContentToEdit(duplicated as any);
          setInitialScheduledDate(null);
          setContentModalOpen(true);
        }}
        onContentUpdated={fetchContents}
      />

      {/* Universal Edit / Add Modal */}
      <ContentModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setContentToEdit(null);
          setInitialScheduledDate(null);
        }}
        onSaved={fetchContents}
        contentToEdit={contentToEdit}
        initialScheduledDate={initialScheduledDate}
      />
    </div>
  );
}
