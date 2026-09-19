'use client';

import React, { useState, useEffect } from 'react';
import { Content, ContentApproval, ContentComment } from '@/types/database';
import { useAuth } from '@/lib/auth/auth-context';
import {
  X,
  CheckCircle2,
  Hourglass,
  Send,
  Check,
  Copy,
  Edit,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Film,
} from 'lucide-react';

interface ContentDetailModalProps {
  isOpen: boolean;
  contentId: string | null;
  onClose: () => void;
  onEdit: (content: Content) => void;
  onDuplicate: (content: Content) => void;
  onContentUpdated: () => void;
}

export default function ContentDetailModal({
  isOpen,
  contentId,
  onClose,
  onEdit,
  onDuplicate,
  onContentUpdated,
}: ContentDetailModalProps) {
  const { user, canApprove, role } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [approvals, setApprovals] = useState<ContentApproval[]>([]);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setApprovals(data.approvals || []);
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && contentId) {
      fetchDetail(contentId);
    }
  }, [isOpen, contentId]);

  if (!isOpen || !contentId || !content) return null;

  const currentPhaseApproved = approvals.some(a => a.phase === content.status);

  // Bug Fix #1: Approve action with explicit contentId and phase parameters
  const handleApprove = async () => {
    if (!contentId || !content) return;
    try {
      const res = await fetch(`/api/contents/${contentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: content.status,
          approvedBy: user?.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(`✓ Fase "${content.status}" berhasil disetujui!`);
        fetchDetail(contentId);
        onContentUpdated();
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(`Gagal approve: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (e: any) {
      setToastMessage(`Error: ${e.message}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !contentId) return;

    try {
      const res = await fetch(`/api/contents/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: newComment.trim(),
          userId: user?.id,
        }),
      });

      if (res.ok) {
        setNewComment('');
        fetchDetail(contentId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/contents/${contentId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          resolvedBy: user?.id,
        }),
      });

      if (res.ok) {
        fetchDetail(contentId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase">
              {content.platform}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
              {content.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-between shrink-0 shadow-md">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Status</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase mt-0.5 inline-block text-xs">{content.status}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Format</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{content.format || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pilar</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{content.pillar || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Funnel</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{content.funnel || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Objective</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{content.objective || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Durasi / Slide</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{content.duration_slides || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Jadwal Tayang</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">
                {content.scheduled_date ? new Date(content.scheduled_date).toLocaleString('id-ID') : '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Keranjang / Produk</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{content.cart_title || '-'}</span>
            </div>
          </div>

          {/* Section: Hook / Script / CTA */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="font-extrabold text-slate-900 dark:text-white block mb-1">Hook / Opening (0-3s)</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{content.hook || '-'}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 shadow-2xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Visual (Hook)</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{content.hook_visual || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="font-extrabold text-slate-900 dark:text-white block mb-1">Body / Naskah Inti</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{content.script || '-'}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 shadow-2xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Visual (Body)</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{content.body_visual || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="font-extrabold text-slate-900 dark:text-white block mb-1">CTA</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{content.cta || '-'}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 shadow-2xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Visual (CTA)</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{content.cta_visual || '-'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="font-extrabold text-slate-900 dark:text-white block mb-1">Caption Lengkap & Hashtags</span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{content.caption || '-'}</p>
            </div>
          </div>

          {/* Section: Approval & History */}
          <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                  Approval & Riwayat Persetujuan
                </h3>
              </div>
              <div>
                {currentPhaseApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Fase {content.status} Disetujui
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                    <Hourglass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Menunggu Persetujuan
                  </span>
                )}
              </div>
            </div>

            {/* Approval Action Button */}
            {canApprove && !currentPhaseApproved && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Setujui fase saat ini?</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Menandai fase "{content.status}" sebagai disetujui resmi oleh Dashboard Admin/Manager.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  Approve Fase {content.status}
                </button>
              </div>
            )}

            {/* Approved Phases List */}
            {approvals.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Riwayat Fase yang Disetujui
                </span>
                <div className="flex flex-wrap gap-2">
                  {approvals.map(a => (
                    <span
                      key={a.id}
                      className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {a.phase} ({new Date(a.approved_at).toLocaleDateString('id-ID')})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comment Thread */}
            <div className="space-y-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-white">Komentar & Revisi Tim ({comments.length})</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Belum ada komentar.</p>
                ) : (
                  comments.map(c => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border text-xs ${
                        c.resolved
                          ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{c.user_email || 'Anggota Tim'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {canApprove && !c.resolved && (
                            <button
                              onClick={() => handleResolveComment(c.id)}
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                            >
                              Resolve
                            </button>
                          )}
                          {c.resolved && (
                            <span className="text-[10px] text-slate-500 font-semibold">Selesai</span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{c.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Tulis catatan revisi atau feedback tim..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDuplicate(content)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplikat
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(content);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Konten
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
