'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AIChatSession, AIChatMessage, Content } from '@/types/database';
import {
  Sparkles,
  Plus,
  Send,
  Bot,
  User,
  MessageSquare,
  AlertCircle,
  Settings,
  Trash2,
  Copy,
  Check,
  PlusCircle,
  Kanban,
  FilePlus2,
  CheckCircle2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import ContentModal from '@/components/content/content-modal';

function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // Bold: **text** -> render bold cleanly without **
      parts.push(
        <strong key={`b-${key++}`} className="font-black text-slate-900 dark:text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // Italic: *text* -> render italic cleanly without *
      parts.push(
        <em key={`i-${key++}`} className="italic font-semibold text-slate-800 dark:text-slate-200">
          {match[3]}
        </em>
      );
    } else if (match[4] !== undefined) {
      // Inline code
      parts.push(
        <code
          key={`c-${key++}`}
          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold"
        >
          {match[4]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function FormattedChatMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();

        // Empty line
        if (!line) {
          return <div key={idx} className="h-1.5" />;
        }

        // Horizontal Rule
        if (line === '---' || line === '***' || line === '___') {
          return <hr key={idx} className="my-2.5 border-slate-200 dark:border-slate-700" />;
        }

        // Headings
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-black text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 pt-2 pb-0.5">
              {parseInlineFormatting(line.substring(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-black text-sm text-slate-900 dark:text-white pt-2 pb-0.5">
              {parseInlineFormatting(line.substring(3))}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-black text-base text-slate-900 dark:text-white pt-2 pb-0.5">
              {parseInlineFormatting(line.substring(2))}
            </h2>
          );
        }

        // Numbered List: e.g. "1. **Hook**: text" or "1. Hook text"
        const numMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black shrink-0 mt-0.5 shadow-2xs">
                {num}
              </span>
              <div className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                {parseInlineFormatting(rest)}
              </div>
            </div>
          );
        }

        // Bullet List: e.g. "* text", "- text", "• text"
        const bulletMatch = line.match(/^[\*\-\•]\s+(.*)/);
        if (bulletMatch) {
          const rest = bulletMatch[1];
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
              <div className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                {parseInlineFormatting(rest)}
              </div>
            </div>
          );
        }

        // Normal text line
        return (
          <p key={idx} className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {parseInlineFormatting(rawLine)}
          </p>
        );
      })}
    </div>
  );
}

export default function SociliftAIPage() {
  const { currentBrand, user } = useAuth();
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Content Modal state
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentToCreate, setContentToCreate] = useState<Partial<Content> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    'Bantu riset 5 hook video TikTok viral untuk niche edukasi bisnis',
    'Buatkan script naskah carousel Instagram 7 slide tentang funnel marketing',
    'Analisis mengapa konten video terakhir retention drop di detik ke-3',
    'Rekomendasikan ide topik konten BOFU untuk meningkatkan konversi',
  ];

  const fetchSessions = async () => {
    if (!currentBrand) return;
    try {
      const res = await fetch(`/api/ai/chat/sessions?brandId=${currentBrand.id}&userId=${user?.id || ''}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.sessions || [];
        setSessions(list);
        if (list.length > 0) {
          if (!activeSessionId || !list.some((s: AIChatSession) => s.id === activeSessionId)) {
            setActiveSessionId(list[0].id);
          }
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/ai/chat/${sessionId}/message`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentBrand, user?.id]);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateSession = async () => {
    if (!currentBrand) return;
    try {
      const res = await fetch('/api/ai/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          user_id: user?.id,
          title: 'Percakapan Baru ' + (sessions.length + 1),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessions([data.session, ...sessions]);
        setActiveSessionId(data.session.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || sending) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      if (!currentBrand) return;
      const res = await fetch('/api/ai/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          user_id: user?.id,
          title: text.slice(0, 30) + '...',
        }),
      });
      const data = await res.json();
      targetSessionId = data.session.id;
      setSessions([data.session, ...sessions]);
      setActiveSessionId(targetSessionId);
    }

    const tempUserMsg: AIChatMessage = {
      id: 'temp-' + Date.now(),
      session_id: targetSessionId!,
      brand_id: currentBrand?.id || '',
      role: 'user',
      message_text: text.trim(),
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInputMessage('');
    setSending(true);
    setInlineError(null);

    try {
      const res = await fetch(`/api/ai/chat/${targetSessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          brand_id: currentBrand?.id,
          user_id: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInlineError(data.error || 'Gagal memproses pesan');
      } else if (data.assistantMessage) {
        setMessages(prev => [...prev, data.assistantMessage]);
      }
    } catch (err: any) {
      setInlineError(err.message || 'Koneksi error.');
    } finally {
      setSending(false);
    }
  };

  // 1-Click Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to extract a smart title and hook from text
  const extractIdeaDetails = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let title = 'Ide Konten AI';
    let hook = '';
    let platform = 'TikTok';

    // Check for platform mentions
    const lower = text.toLowerCase();
    if (lower.includes('instagram') || lower.includes('carousel') || lower.includes('reels')) {
      platform = 'IG';
    } else if (lower.includes('youtube')) {
      platform = 'YouTube';
    }

    for (const line of lines) {
      if (line.toLowerCase().includes('judul') || line.startsWith('1.') || line.startsWith('-') || line.startsWith('**Judul')) {
        title = line.replace(/^[\d.-]+\s*|\*\*|\*|Judul\s*(Konten)?:\s*/gi, '').trim().slice(0, 80);
        break;
      }
    }

    for (const line of lines) {
      if (line.toLowerCase().includes('hook') || line.toLowerCase().includes('detik')) {
        hook = line.replace(/^[\d.-]+\s*|\*\*|\*|Hook\s*(3 Detik)?:\s*/gi, '').trim();
        break;
      }
    }

    return { title: title || lines[0]?.slice(0, 60) || 'Ide Konten Baru', hook, platform };
  };

  // 1-Click: Send to Kanban Backlog
  const handleSendToBacklog = async (text: string) => {
    if (!currentBrand) return;
    const { title, platform } = extractIdeaDetails(text);

    try {
      const res = await fetch('/api/backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          concept: title,
          platform,
          notes: text,
          created_by: user?.id,
        }),
      });

      if (res.ok) {
        setToastFeedback('✓ Ide berhasil dimasukkan ke antrean Kanban Backlog!');
        setTimeout(() => setToastFeedback(null), 3500);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Gagal menambahkan ke backlog');
      }
    } catch (e: any) {
      alert(e.message || 'Error menambahkan ke backlog');
    }
  };

  const handleOpenContentModalWithAI = (text: string) => {
    const { title, hook, platform } = extractIdeaDetails(text);
    setContentToCreate({
      title,
      platform: platform as any,
      hook: hook || text.slice(0, 150),
      script: text,
      status: 'ideation',
    });
    setContentModalOpen(true);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/chat/sessions?id=${id}`, { method: 'DELETE' });
      const remaining = sessions.filter(s => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden max-w-7xl mx-auto relative">
      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="absolute top-4 right-4 z-50 p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastFeedback}</span>
          <button onClick={() => setToastFeedback(null)} className="text-white/80 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Session Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Histori Chat</span>
          <button
            onClick={handleCreateSession}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            title="Chat Baru"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">
              Belum ada history chat.
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold truncate flex items-center justify-between gap-2 transition cursor-pointer group ${
                  activeSessionId === s.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  <MessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{s.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                  title="Hapus Percakapan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white">Socilift AI Assistant</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Dilengkapi Brand Awareness Context penuh untuk brand: <strong className="text-slate-800 dark:text-slate-200">{currentBrand?.name || 'Utama'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 && (
            <div className="max-w-md mx-auto my-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Mulai Diskusi dengan Socilift AI</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                  Pilih salah satu prompt bantuan cepat di bawah atau tulis instruksi Anda:
                </p>
              </div>

              {/* 4 Starter Suggestion Chips */}
              <div className="grid grid-cols-1 gap-2 pt-2 text-left">
                {starterPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-slate-800 dark:text-slate-200 text-xs font-semibold transition text-left flex items-center justify-between group shadow-2xs"
                  >
                    <span>{prompt}</span>
                    <span className="text-slate-400 group-hover:text-blue-500">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${
                msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-2 max-w-xl">
                <div
                  className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                  }`}
                >
                  <FormattedChatMessage content={msg.message_text} isUser={msg.role === 'user'} />
                </div>

                {/* 1-Click Action Buttons for AI Assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 px-1">
                    <button
                      onClick={() => handleCopyText(msg.message_text, msg.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                      title="Salin Teks Naskah"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Salin Naskah</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendToBacklog(msg.message_text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition shadow-2xs border border-indigo-200/60 dark:border-indigo-800/60"
                      title="Kirim ke antrean ide Kanban"
                    >
                      <Kanban className="w-3 h-3 text-indigo-500" />
                      <span>+ Ke Kanban</span>
                    </button>

                    <button
                      onClick={() => handleOpenContentModalWithAI(msg.message_text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60"
                      title="Buka form konten langsung terisi"
                    >
                      <FilePlus2 className="w-3 h-3 text-emerald-500" />
                      <span>+ Buat Konten</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Animated AI Thinking / Typing Bubble */}
          {sending && (
            <div className="flex gap-3 max-w-2xl mr-auto justify-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-bl-xs bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                  <span>Socilift AI sedang merumuskan naskah & strategi konten...</span>
                </span>
              </div>
            </div>
          )}

          {/* Inline Error within Thread */}
          {inlineError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center justify-between gap-3 max-w-xl mr-auto animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{inlineError}</span>
              </div>
              <Link
                href="/settings/api-key"
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 font-bold text-[11px] border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-slate-800 shadow-2xs"
              >
                <Settings className="w-3 h-3" />
                <span>Buka Settings</span>
              </Link>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Tulis pesan atau instruksi strategi konten untuk Socilift AI..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Mengirim...' : 'Kirim'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Content Modal for 1-Click Content Creation */}
      <ContentModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setContentToCreate(null);
        }}
        onSaved={() => {
          setToastFeedback('✓ Konten baru berhasil disimpan ke Database!');
          setTimeout(() => setToastFeedback(null), 3500);
        }}
        contentToEdit={contentToCreate as any}
      />
    </div>
  );
}
