'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Content, BacklogItem, ContentStatus, PlatformCode } from '@/types/database';
import {
  Plus,
  CheckCircle2,
  Hourglass,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Calendar,
  Sparkles,
  X,
  Eye,
} from 'lucide-react';
import ContentModal from '@/components/content/content-modal';
import ContentDetailModal from '@/components/content/content-detail-modal';

interface ColumnDef {
  id: string;
  title: string;
  color: string;
}

export default function KanbanPage() {
  const { currentBrand, user, role } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New/Edit Idea modal state
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [editingBacklogItem, setEditingBacklogItem] = useState<BacklogItem | null>(null);
  const [newConcept, setNewConcept] = useState('');
  const [newPlatform, setNewPlatform] = useState<PlatformCode>('TikTok');
  const [newNotes, setNewNotes] = useState('');

  // Universal Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<Content | null>(null);

  // Dragging state
  const [draggedContentId, setDraggedContentId] = useState<string | null>(null);
  const [draggedBacklogId, setDraggedBacklogId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const columns: ColumnDef[] = [
    { id: 'backlog', title: 'Backlog Ide', color: 'border-slate-400 dark:border-slate-600' },
    { id: 'ideation', title: 'Ideation', color: 'border-blue-500' },
    { id: 'scripting', title: 'Scripting', color: 'border-amber-500' },
    { id: 'take_konten', title: 'Take Konten', color: 'border-cyan-500' },
    { id: 'editing', title: 'Editing', color: 'border-indigo-500' },
    { id: 'scheduled', title: 'Scheduled', color: 'border-purple-500' },
    { id: 'published', title: 'Published', color: 'border-emerald-500' },
  ];

  const fetchData = async () => {
    if (!currentBrand) return;
    setLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([
        fetch(`/api/contents?brandId=${currentBrand.id}`),
        fetch(`/api/backlog?brandId=${currentBrand.id}`),
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setContents(cData.contents || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBacklogItems(bData.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentBrand]);

  // Create or Update Backlog idea
  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept.trim() || !currentBrand) return;

    try {
      if (editingBacklogItem) {
        const res = await fetch('/api/backlog', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBacklogItem.id,
            concept: newConcept.trim(),
            platform: newPlatform,
            notes: newNotes.trim(),
          }),
        });

        if (res.ok) {
          setEditingBacklogItem(null);
          setNewConcept('');
          setNewNotes('');
          setIdeaModalOpen(false);
          fetchData();
        }
      } else {
        const res = await fetch('/api/backlog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: currentBrand.id,
            concept: newConcept.trim(),
            platform: newPlatform,
            notes: newNotes.trim(),
            created_by: user?.id,
          }),
        });

        if (res.ok) {
          setNewConcept('');
          setNewNotes('');
          setIdeaModalOpen(false);
          fetchData();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Promote backlog item to real content
  const promoteBacklogItem = async (item: BacklogItem, targetStatus: ContentStatus = 'ideation') => {
    if (!currentBrand) return;
    try {
      const res = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          title: item.concept,
          platform: item.platform,
          status: targetStatus,
          notes: item.notes,
          created_by: user?.id,
        }),
      });

      if (res.ok) {
        await fetch(`/api/backlog?id=${item.id}`, { method: 'DELETE' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedContentId(null);
    setDraggedBacklogId(null);
    setDragOverColumn(null);
    setTimeout(() => setIsDragging(false), 120);
  };

  const handleDropOnColumn = async (columnId: string) => {
    setDragOverColumn(null);

    // 1. Moving Content Card
    if (draggedContentId) {
      const contentToMove = contents.find(c => c.id === draggedContentId);
      if (!contentToMove || !currentBrand) {
        handleDragEnd();
        return;
      }

      // Moving back to "Backlog Ide" column
      if (columnId === 'backlog') {
        // Optimistic UI update
        setContents(prev => prev.filter(c => c.id !== contentToMove.id));
        const tempBacklogItem: BacklogItem = {
          id: 'temp-' + Date.now(),
          brand_id: currentBrand.id,
          concept: contentToMove.title,
          platform: contentToMove.platform,
          notes: contentToMove.notes || contentToMove.hook || contentToMove.caption || '',
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
        };
        setBacklogItems(prev => [tempBacklogItem, ...prev]);

        try {
          // Create in backlog table
          await fetch('/api/backlog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand_id: currentBrand.id,
              concept: contentToMove.title,
              platform: contentToMove.platform,
              notes: contentToMove.notes || contentToMove.hook || contentToMove.caption || '',
              created_by: user?.id,
            }),
          });
          // Delete from contents table
          await fetch(`/api/contents/${contentToMove.id}`, { method: 'DELETE' });
          fetchData();
        } catch (e) {
          console.error(e);
          fetchData();
        }
        handleDragEnd();
        return;
      }

      // Moving between content columns
      const targetStatus = columnId as ContentStatus;
      if (contentToMove.status === targetStatus) {
        handleDragEnd();
        return;
      }

      // Optimistic update
      setContents(prev => prev.map(c => c.id === draggedContentId ? { ...c, status: targetStatus } : c));
      try {
        await fetch(`/api/contents/${draggedContentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: targetStatus,
            userRole: role,
          }),
        });
      } catch (e) {
        console.error(e);
        fetchData();
      }
      handleDragEnd();
    } 
    // 2. Moving Backlog Idea Item
    else if (draggedBacklogId) {
      const item = backlogItems.find(b => b.id === draggedBacklogId);
      if (!item || !currentBrand) {
        handleDragEnd();
        return;
      }

      if (columnId !== 'backlog') {
        const targetStatus = columnId as ContentStatus;
        // Optimistic update
        setBacklogItems(prev => prev.filter(b => b.id !== item.id));
        const tempContent: Content = {
          id: 'temp-c-' + Date.now(),
          brand_id: currentBrand.id,
          title: item.concept,
          platform: item.platform,
          status: targetStatus,
          pillar: currentBrand.pillars[0] || 'Edukasi & Tutorial',
          funnel: currentBrand.funnels[0] || 'TOFU (Top of Funnel)',
          objective: currentBrand.objectives[0] || 'Brand Awareness',
          notes: item.notes,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setContents(prev => [...prev, tempContent]);

        try {
          await fetch('/api/contents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand_id: currentBrand.id,
              title: item.concept,
              platform: item.platform,
              status: targetStatus,
              notes: item.notes,
              created_by: user?.id,
            }),
          });
          await fetch(`/api/backlog?id=${item.id}`, { method: 'DELETE' });
          fetchData();
        } catch (e) {
          console.error(e);
          fetchData();
        }
      }
      handleDragEnd();
    }
  };

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kanban Board</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Visualisasikan alur produksi konten dari ide mentah, naskah, take video, hingga rilis di media sosial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingBacklogItem(null);
              setNewConcept('');
              setNewNotes('');
              setIdeaModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>+ Catat Ide</span>
          </button>

          <button
            onClick={() => {
              setContentToEdit(null);
              setContentModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Konten Baru</span>
          </button>
        </div>
      </div>

      {/* Kanban Columns (Horizontally Scrollable) */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 items-start min-h-[calc(100vh-220px)]">
        {columns.map(col => {
          const isBacklog = col.id === 'backlog';
          const items = isBacklog ? backlogItems : contents.filter(c => c.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDropOnColumn(col.id)}
              className={`w-72 shrink-0 bg-slate-100/80 dark:bg-slate-900/60 border rounded-2xl flex flex-col max-h-[calc(100vh-240px)] shadow-xs transition-all duration-200 ease-out ${
                isOver
                  ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 shadow-lg scale-[1.01]'
                  : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl border-t-4 ${col.color}`}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900 dark:text-white">{col.title}</span>
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-black flex items-center justify-center">
                    {items.length}
                  </span>
                </div>
                {isBacklog && (
                  <button
                    onClick={() => {
                      setEditingBacklogItem(null);
                      setNewConcept('');
                      setNewNotes('');
                      setIdeaModalOpen(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 p-1 rounded-md transition"
                    title="Tambah Ide Cepat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Card List */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 min-h-[160px]">
                {/* Active Drop Placeholder when dragging over column */}
                {isOver && (draggedContentId || draggedBacklogId) && (
                  <div className="p-3 border-2 border-dashed border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300 rounded-xl text-center text-xs font-bold animate-pulse flex items-center justify-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lepaskan kartu di {col.title}</span>
                  </div>
                )}

                {items.length === 0 && !isOver ? (
                  <div className="h-28 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500 text-center px-4">
                    Tarik kartu ke sini
                  </div>
                ) : isBacklog ? (
                  /* Backlog Items */
                  (items as BacklogItem[]).map(item => {
                    const isBeingDragged = draggedBacklogId === item.id;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedBacklogId(item.id);
                          setIsDragging(true);
                          e.dataTransfer.setData('text/plain', item.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (!isDragging) {
                            setEditingBacklogItem(item);
                            setNewConcept(item.concept);
                            setNewPlatform(item.platform);
                            setNewNotes(item.notes || '');
                            setIdeaModalOpen(true);
                          }
                        }}
                        title="Klik untuk langsung edit ide"
                        className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer space-y-2 group select-none ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-blue-500 shadow-none'
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                            {item.platform}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-0.5">
                              <Edit className="w-3 h-3" /> Edit
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                promoteBacklogItem(item, 'ideation');
                              }}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
                              title="Promote ke Ideation"
                            >
                              Promote →
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{item.concept}</p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">{item.notes}</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  /* Real Content Cards */
                  (items as Content[]).map(c => {
                    const isBeingDragged = draggedContentId === c.id;
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedContentId(c.id);
                          setIsDragging(true);
                          e.dataTransfer.setData('text/plain', c.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (!isDragging) {
                            setContentToEdit(c);
                            setContentModalOpen(true);
                          }
                        }}
                        title="Klik untuk langsung edit konten & naskah"
                        className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer space-y-2.5 select-none group ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-blue-500 shadow-none'
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-black">
                            {c.platform}
                          </span>
                          {c.status === 'published' ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                              <Hourglass className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {c.title}
                        </h4>

                        {c.hook && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60 line-clamp-2">
                            "{c.hook}"
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                            {c.funnel ? c.funnel.split(' ')[0] : 'TOFU'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedContentId(c.id);
                                setDetailModalOpen(true);
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500"
                              title="Lihat Detail & Persetujuan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setContentToEdit(c);
                                setContentModalOpen(true);
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold transition flex items-center gap-1"
                              title="Edit Konten"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tambah / Edit Ide Backlog Modal */}
      {ideaModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingBacklogItem ? 'Edit Ide Backlog' : '+ Catat Ide Mentah'}
              </h3>
              <button
                onClick={() => {
                  setIdeaModalOpen(false);
                  setEditingBacklogItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIdea} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Konsep / Ide</label>
                <input
                  type="text"
                  value={newConcept}
                  onChange={e => setNewConcept(e.target.value)}
                  required
                  placeholder="Contoh: 5 Kesalahan Fatal Saat Bikin Video TikTok..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Platform</label>
                <select
                  value={newPlatform}
                  onChange={e => setNewPlatform(e.target.value as PlatformCode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="IG">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="FB">Facebook</option>
                  <option value="X">X</option>
                  <option value="Threads">Threads</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Singkat</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="Referensi hook, sound trending, poin penting naskah..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdeaModalOpen(false);
                    setEditingBacklogItem(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 hover:bg-blue-700"
                >
                  {editingBacklogItem ? 'Simpan Perubahan' : 'Simpan ke Backlog'}
                </button>
              </div>
            </form>
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
        onContentUpdated={fetchData}
      />

      {/* Universal Add / Edit Modal */}
      <ContentModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setContentToEdit(null);
        }}
        onSaved={fetchData}
        contentToEdit={contentToEdit}
      />
    </div>
  );
}
