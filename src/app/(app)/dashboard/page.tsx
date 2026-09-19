'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Content, Goal, Metric, PlatformCode } from '@/types/database';
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Megaphone,
  Heart,
  Bookmark,
  Share2,
  MousePointer,
  DollarSign,
  Timer,
  Crosshair,
  Anchor,
  Magnet,
  Users,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Link from 'next/link';

// Available KPI Metric Options matching user spec (Image 2)
interface KPIMetricOption {
  id: string;
  label: string;
  iconName: string;
  subtext: string;
  color: string;
}

const KPI_METRIC_OPTIONS: KPIMetricOption[] = [
  { id: 'total_konten', label: 'Total Konten (Hanya Dashboard)', iconName: 'file', subtext: 'Seluruh fase alur kerja', color: 'blue' },
  { id: 'published', label: 'Dipublikasikan (Hanya Dashboard)', iconName: 'check', subtext: 'Sudah live di media sosial', color: 'emerald' },
  { id: 'scheduled', label: 'Terjadwal (Hanya Dashboard)', iconName: 'clock', subtext: 'Siap posting otomatis', color: 'purple' },
  { id: 'views', label: 'Tayangan', iconName: 'eye', subtext: 'Total penayangan video & konten', color: 'blue' },
  { id: 'impressions', label: 'Total Impresi', iconName: 'megaphone', subtext: 'Frekuensi konten tampil di feed', color: 'amber' },
  { id: 'likes', label: 'Total Suka', iconName: 'heart', subtext: 'Jumlah likes dari audiens', color: 'rose' },
  { id: 'saves', label: 'Total Disimpan', iconName: 'bookmark', subtext: 'Konten disimpan ke bookmark', color: 'indigo' },
  { id: 'shares', label: 'Total Dibagikan', iconName: 'share', subtext: 'Jumlah share ke teman & DM', color: 'teal' },
  { id: 'clicks', label: 'Total Klik', iconName: 'mouse', subtext: 'Klik tautan eksternal / bio', color: 'sky' },
  { id: 'gmv', label: 'GMV / Purchase Value', iconName: 'dollar', subtext: 'Estimasi nilai konversi penjualan', color: 'amber' },
  { id: 'engagement', label: 'Rata-rata Engagement', iconName: 'chart', subtext: 'Kombinasi interaksi audiens', color: 'amber' },
  { id: 'retention', label: 'Rata-rata Retensi', iconName: 'timer', subtext: 'Ketahanan tonton 15 detik', color: 'purple' },
  { id: 'click_rate', label: 'Click Rate', iconName: 'target', subtext: 'Rasio klik per impresi', color: 'cyan' },
  { id: 'hook_rate', label: 'Hook Rate', iconName: 'hook', subtext: 'Rasio tonton 3 detik pertama', color: 'violet' },
  { id: 'hold_rate', label: 'Hold Rate', iconName: 'magnet', subtext: 'Rasio retensi thru-plays', color: 'pink' },
];

// Available Trend Variables matching user spec (Image 4 & 5)
interface TrendVariable {
  id: string;
  label: string;
  color: string;
  unit: string;
  isRate?: boolean;
}

const ALL_TREND_VARIABLES: TrendVariable[] = [
  { id: 'engagement', label: 'Engagement Rate (%)', color: '#3b82f6', unit: '%', isRate: true },
  { id: 'impressions', label: 'Impressions', color: '#06b6d4', unit: '' },
  { id: 'views', label: 'Tayangan (Views)', color: '#2563eb', unit: '' },
  { id: 'likes', label: 'Likes', color: '#f43f5e', unit: '' },
  { id: 'shares', label: 'Shares', color: '#10b981', unit: '' },
  { id: 'clicks', label: 'Clicks', color: '#0ea5e9', unit: '' },
  { id: 'gmv', label: 'GMV / Purchase Value', color: '#f59e0b', unit: 'Rp' },
  { id: 'click_rate', label: 'Click Rate', color: '#38bdf8', unit: '%', isRate: true },
  { id: 'hook_rate', label: 'Hook Rate', color: '#a855f7', unit: '%', isRate: true },
  { id: 'hold_rate', label: 'Hold Rate', color: '#34d399', unit: '%', isRate: true },
  { id: 'avg_watch_time', label: 'Avg Watch Time', color: '#fb923c', unit: 's' },
  { id: 'new_followers', label: 'New Followers', color: '#c084fc', unit: '' },
];

// Time Periods matching user requirement
const TIME_PERIODS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: '7d', label: '7 Hari Terakhir' },
  { id: '30d', label: '30 Hari Terakhir' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'last_month', label: 'Bulan Lalu' },
  { id: 'custom', label: 'Custom' },
];

export default function DashboardPage() {
  const { currentBrand } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // 4 KPI Card Slot Selection State (persistable)
  const [cardSlots, setCardSlots] = useState<string[]>(['total_konten', 'published', 'scheduled', 'engagement']);
  const [modalSlotIndex, setModalSlotIndex] = useState<number | null>(null);
  const [tempSelectedMetric, setTempSelectedMetric] = useState<string>('');

  // Trend Chart Variables Selection State (multi-select / single-select with popover)
  const [selectedTrendVars, setSelectedTrendVars] = useState<string[]>(['engagement']);
  const [trendVarDropdownOpen, setTrendVarDropdownOpen] = useState(false);
  const trendDropdownRef = useRef<HTMLDivElement>(null);

  // Time Period State & Custom Date Range
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [customRangeModalOpen, setCustomRangeModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Load persisted card metrics from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('socilift:dashboard:kpi_slots');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 4) {
            setCardSlots(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Close trend dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trendDropdownRef.current && !trendDropdownRef.current.contains(e.target as Node)) {
        setTrendVarDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    if (!currentBrand) return;
    setLoading(true);
    try {
      const [cRes, gRes, mRes] = await Promise.all([
        fetch(`/api/contents?brandId=${currentBrand.id}`),
        fetch(`/api/goals?brandId=${currentBrand.id}`),
        fetch(`/api/metrics?brandId=${currentBrand.id}`),
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setContents(cData.contents || []);
      }
      if (gRes.ok) {
        const gData = await gRes.json();
        setGoals(gData.goals || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to global content saved event
    const handleSaved = () => fetchData();
    window.addEventListener('socilift:content-saved', handleSaved);
    return () => window.removeEventListener('socilift:content-saved', handleSaved);
  }, [currentBrand]);

  // Filter contents by platform
  const filteredContents = useMemo(() => {
    if (selectedPlatform === 'All') return contents;
    return contents.filter(c => c.platform === selectedPlatform);
  }, [contents, selectedPlatform]);

  const filteredGoals = useMemo(() => {
    if (selectedPlatform === 'All') return goals;
    return goals.filter(g => g.platform === selectedPlatform);
  }, [goals, selectedPlatform]);

  const filteredMetrics = useMemo(() => {
    if (selectedPlatform === 'All') return metrics;
    return metrics.filter(m => m.platform === selectedPlatform);
  }, [metrics, selectedPlatform]);

  // Calculations for metric values
  const getMetricData = (id: string) => {
    switch (id) {
      case 'total_konten':
        return {
          value: filteredContents.length.toString(),
          display: filteredContents.length.toString(),
          colorClass: 'text-slate-900 dark:text-white',
        };
      case 'published': {
        const count = filteredContents.filter(c => c.status === 'published').length;
        return { value: count.toString(), display: count.toString(), colorClass: 'text-emerald-600 dark:text-emerald-400' };
      }
      case 'scheduled': {
        const count = filteredContents.filter(c => c.status === 'scheduled').length;
        return { value: count.toString(), display: count.toString(), colorClass: 'text-purple-600 dark:text-purple-400' };
      }
      case 'views': {
        const total = filteredMetrics.reduce((acc, m) => acc + (Number(m.views) || 0), 0);
        return { value: total.toString(), display: total.toLocaleString('id-ID'), colorClass: 'text-blue-600 dark:text-blue-400' };
      }
      case 'impressions': {
        const total = filteredMetrics.reduce((acc, m) => acc + (Number(m.impressions) || 0), 0);
        return { value: total.toString(), display: total.toLocaleString('id-ID'), colorClass: 'text-cyan-600 dark:text-cyan-400' };
      }
      case 'likes': {
        const total = filteredMetrics.reduce((acc, m) => acc + (Number(m.likes) || 0), 0);
        return { value: total.toString(), display: total.toLocaleString('id-ID'), colorClass: 'text-rose-600 dark:text-rose-400' };
      }
      case 'saves': {
        const total = filteredMetrics.reduce((acc, m) => acc + (Number(m.saves) || 0), 0);
        return { value: total.toString(), display: total.toLocaleString('id-ID'), colorClass: 'text-indigo-600 dark:text-indigo-400' };
      }
      case 'shares': {
        const total = filteredMetrics.reduce((acc, m) => acc + (Number(m.shares) || 0), 0);
        return { value: total.toString(), display: total.toLocaleString('id-ID'), colorClass: 'text-teal-600 dark:text-teal-400' };
      }
      case 'clicks': {
        const total = filteredMetrics.reduce((acc, m) => acc + (Number(m.clicks) || 0), 0);
        return { value: total.toString(), display: total.toLocaleString('id-ID'), colorClass: 'text-sky-600 dark:text-sky-400' };
      }
      case 'gmv': {
        const total = 0;
        return { value: total.toString(), display: `Rp 0`, colorClass: 'text-amber-600 dark:text-amber-400' };
      }
      case 'engagement': {
        const list = filteredMetrics.filter(m => m.engagement !== null && m.engagement !== undefined);
        const sum = list.reduce((acc, curr) => acc + Number(curr.engagement || 0), 0);
        const avg = list.length > 0 ? Math.round((sum / list.length) * 10) / 10 : 0;
        return { value: avg.toString(), display: `${avg}%`, colorClass: 'text-amber-600 dark:text-amber-400' };
      }
      case 'retention': {
        const list = filteredMetrics.filter(m => m.retention_15s !== null && m.retention_15s !== undefined);
        const sum = list.reduce((acc, curr) => acc + Number(curr.retention_15s || 0), 0);
        const avg = list.length > 0 ? Math.round((sum / list.length) * 10) / 10 : 0;
        return { value: avg.toString(), display: `${avg}%`, colorClass: 'text-purple-600 dark:text-purple-400' };
      }
      case 'click_rate': {
        const totalClicks = filteredMetrics.reduce((acc, m) => acc + (Number(m.clicks) || 0), 0);
        const totalImp = filteredMetrics.reduce((acc, m) => acc + (Number(m.impressions) || 0), 0);
        const rate = totalImp > 0 ? Math.round((totalClicks / totalImp) * 1000) / 10 : 0;
        return { value: rate.toString(), display: `${rate}%`, colorClass: 'text-cyan-600 dark:text-cyan-400' };
      }
      case 'hook_rate': {
        const list = filteredMetrics.filter(m => m.hook_rate !== null && m.hook_rate !== undefined);
        const sum = list.reduce((acc, curr) => acc + Number(curr.hook_rate || 0), 0);
        const avg = list.length > 0 ? Math.round((sum / list.length) * 10) / 10 : 0;
        return { value: avg.toString(), display: `${avg}%`, colorClass: 'text-violet-600 dark:text-violet-400' };
      }
      case 'hold_rate': {
        const list = filteredMetrics.filter(m => m.hold_rate !== null && m.hold_rate !== undefined);
        const sum = list.reduce((acc, curr) => acc + Number(curr.hold_rate || 0), 0);
        const avg = list.length > 0 ? Math.round((sum / list.length) * 10) / 10 : 0;
        return { value: avg.toString(), display: `${avg}%`, colorClass: 'text-pink-600 dark:text-pink-400' };
      }
      default:
        return { value: '0', display: '0', colorClass: 'text-slate-900 dark:text-white' };
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'file': return <FileText className="w-5 h-5" />;
      case 'check': return <CheckCircle className="w-5 h-5" />;
      case 'clock': return <Clock className="w-5 h-5" />;
      case 'eye': return <Eye className="w-5 h-5" />;
      case 'megaphone': return <Megaphone className="w-5 h-5" />;
      case 'heart': return <Heart className="w-5 h-5" />;
      case 'bookmark': return <Bookmark className="w-5 h-5" />;
      case 'share': return <Share2 className="w-5 h-5" />;
      case 'mouse': return <MousePointer className="w-5 h-5" />;
      case 'dollar': return <DollarSign className="w-5 h-5" />;
      case 'chart': return <TrendingUp className="w-5 h-5" />;
      case 'timer': return <Timer className="w-5 h-5" />;
      case 'target': return <Crosshair className="w-5 h-5" />;
      case 'hook': return <Anchor className="w-5 h-5" />;
      case 'magnet': return <Magnet className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  // Open "Ganti Metrik" Modal for specific card index
  const openChangeMetricModal = (slotIndex: number) => {
    setModalSlotIndex(slotIndex);
    setTempSelectedMetric(cardSlots[slotIndex]);
  };

  // Save selected metric to the slot
  const handleSaveCardMetric = (metricId: string) => {
    if (modalSlotIndex === null) return;
    const updated = [...cardSlots];
    updated[modalSlotIndex] = metricId;
    setCardSlots(updated);
    setModalSlotIndex(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('socilift:dashboard:kpi_slots', JSON.stringify(updated));
    }
  };

  // Upcoming scheduled contents
  const upcomingContents = useMemo(() => {
    return contents
      .filter(c => c.status === 'scheduled' && c.scheduled_date)
      .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime())
      .slice(0, 3);
  }, [contents]);

  // Chart data based on selectedPeriod and selectedTrendVars computed from filteredMetrics
  const chartData = useMemo(() => {
    let labels: string[] = [];

    switch (selectedPeriod) {
      case 'today':
        labels = ['08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
        break;
      case 'yesterday':
        labels = ['08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
        break;
      case '7d':
        labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        break;
      case '30d':
        labels = ['1 Sep', '6 Sep', '12 Sep', '18 Sep', '24 Sep', '30 Sep'];
        break;
      case 'this_month':
        labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
        break;
      case 'last_month':
        labels = ['Mgg 1 Lalu', 'Mgg 2 Lalu', 'Mgg 3 Lalu', 'Mgg 4 Lalu'];
        break;
      case 'custom':
        labels = ['Awal', 'Titik 2', 'Titik 3', 'Titik 4', 'Akhir'];
        break;
      default:
        labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    }

    return labels.map((label) => {
      const row: any = { name: label };
      ALL_TREND_VARIABLES.forEach(v => {
        if (filteredMetrics.length === 0) {
          row[v.id] = 0;
        } else {
          if (v.isRate) {
            const list = filteredMetrics.filter(m => (m as any)[v.id] !== null && (m as any)[v.id] !== undefined);
            const sum = list.reduce((acc, curr) => acc + Number((curr as any)[v.id] || 0), 0);
            row[v.id] = list.length > 0 ? Math.round((sum / list.length) * 10) / 10 : 0;
          } else {
            row[v.id] = filteredMetrics.reduce((acc, m) => acc + (Number((m as any)[v.id]) || 0), 0);
          }
        }
      });
      return row;
    });
  }, [selectedPeriod, filteredMetrics]);

  const toggleTrendVariable = (varId: string) => {
    if (selectedTrendVars.includes(varId)) {
      if (selectedTrendVars.length > 1) {
        setSelectedTrendVars(selectedTrendVars.filter(id => id !== varId));
      }
    } else {
      setSelectedTrendVars([...selectedTrendVars, varId]);
    }
  };

  const resetTrendVariables = () => {
    setSelectedTrendVars(['engagement']);
  };

  const platforms = [
    { id: 'All', label: 'Semua Platform' },
    { id: 'IG', label: 'Instagram' },
    { id: 'TikTok', label: 'TikTok' },
    { id: 'YouTube', label: 'YouTube' },
    { id: 'FB', label: 'Facebook' },
    { id: 'X', label: 'X (Twitter)' },
    { id: 'Threads', label: 'Threads' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Halo, {currentBrand?.name || 'Brand Utama'} 👋
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
            Ringkasan performa konten, alur kerja produksi, dan target KPI media sosial Anda.
          </p>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                selectedPlatform === p.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Interactive KPI Cards with Clickable Down Arrow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardSlots.map((metricId, index) => {
          const opt = KPI_METRIC_OPTIONS.find(o => o.id === metricId) || KPI_METRIC_OPTIONS[0];
          const data = getMetricData(metricId);

          return (
            <div
              key={index}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/50 dark:hover:border-blue-500/50 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                {/* Clickable Card Header & Down Arrow (Matching Image 1 & 2) */}
                <button
                  onClick={() => openChangeMetricModal(index)}
                  className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  title="Klik untuk Ganti Metrik"
                >
                  <span className="truncate max-w-[150px]">{opt.label.replace(' (Hanya Dashboard)', '')}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-y-0.5" />
                </button>

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${opt.color}-50 dark:bg-${opt.color}-950/50 text-${opt.color}-600 dark:text-${opt.color}-400`}>
                  {renderIcon(opt.iconName)}
                </div>
              </div>

              <div className={`text-3xl font-black tracking-tight ${data.colorClass}`}>
                {data.display}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 truncate">
                {opt.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Goal Health Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">Goal Health Target</h2>
          </div>
          <Link
            href="/settings/goals"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            Atur Goal <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
            Belum ada target untuk platform ini. Buat target capaian di{' '}
            <Link href="/settings/goals" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Pengaturan Goal
            </Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredGoals.map(goal => {
              const current = Number(goal.baseline_current) || 0;
              const target = Number(goal.target) || 1;
              const pct = Math.min(100, Math.round((current / target) * 100));
              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              );

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-wide">
                      {goal.platform}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {daysLeft} hari lagi
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{pct}%</span>
                      <span className="text-xs text-slate-700 dark:text-slate-200 font-bold">
                        {goal.metric}: {current.toLocaleString('id-ID')} / {target.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row: Engagement Trend Chart & Akan Datang Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Rate Tren Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Engagement Rate Tren</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Performa interaksi audiens dalam periode aktif</p>
            </div>

            {/* Metric Variables Dropdown & Time Period Dropdown */}
            <div className="flex items-center gap-2 relative">
              
              {/* Variable Multi-Select Dropdown Popover (Image 3, 4, 5) */}
              <div className="relative" ref={trendDropdownRef}>
                <button
                  type="button"
                  onClick={() => setTrendVarDropdownOpen(!trendVarDropdownOpen)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold flex items-center justify-between gap-2 shadow-xs min-w-[150px]"
                >
                  <span className="truncate">
                    {selectedTrendVars.length === 1
                      ? ALL_TREND_VARIABLES.find(v => v.id === selectedTrendVars[0])?.label || 'Metrik'
                      : `${selectedTrendVars.length} Metrik Terpilih`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* Popover list matching Image 4 & 5 */}
                {trendVarDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      PILIH VARIABEL TREN
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {ALL_TREND_VARIABLES.map(v => {
                        const isChecked = selectedTrendVars.includes(v.id);
                        return (
                          <label
                            key={v.id}
                            onClick={() => toggleTrendVariable(v.id)}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs font-semibold select-none transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: v.color }}
                            />
                            <span className="text-slate-800 dark:text-slate-200 truncate">{v.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Reset Button (Matching Image 5) */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5">
                      <button
                        type="button"
                        onClick={resetTrendVariables}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset ke Default</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Period Dropdown (Hari Ini, Kemarin, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu, Custom) */}
              <select
                value={selectedPeriod}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedPeriod(val);
                  if (val === 'custom') {
                    setCustomRangeModalOpen(true);
                  }
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold shadow-xs cursor-pointer"
              >
                {TIME_PERIODS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} />
                <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                />
                {selectedTrendVars.length > 1 && <Legend />}
                {selectedTrendVars.map(varId => {
                  const item = ALL_TREND_VARIABLES.find(v => v.id === varId);
                  if (!item) return null;
                  return (
                    <Line
                      key={varId}
                      type="monotone"
                      dataKey={varId}
                      name={item.label}
                      stroke={item.color}
                      strokeWidth={3}
                      dot={{ r: 4, fill: item.color }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Akan Datang Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Akan Datang</h2>
            </div>
            <Link href="/calendar" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Lihat Kalender
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3">
            {upcomingContents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tidak ada konten terjadwal</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Jadwalkan konten dari Content Database atau Kalender.
                </p>
              </div>
            ) : (
              upcomingContents.map(c => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                      {c.platform}
                    </span>
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(c.scheduled_date!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                    Format: <span className="font-bold text-slate-800 dark:text-slate-200">{c.format || 'Video'}</span> • <span className="font-bold text-slate-800 dark:text-slate-200">{c.pillar || 'Edukasi'}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* "Ganti Metrik" Modal (Exact match to user Image 2) */}
      {modalSlotIndex !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/90 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-base font-black text-white">Ganti Metrik</h3>
              <button
                onClick={() => setModalSlotIndex(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                PILIH METRIK
              </label>

              {/* Select Dropdown matching Image 2 */}
              <div className="relative">
                <select
                  value={tempSelectedMetric}
                  onChange={e => {
                    const chosen = e.target.value;
                    setTempSelectedMetric(chosen);
                    handleSaveCardMetric(chosen);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-blue-500/80 bg-slate-950 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-inner"
                >
                  {KPI_METRIC_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-slate-900 text-white py-1">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick list of options matching Image 2 layout */}
            <div className="max-h-60 overflow-y-auto space-y-1 pt-2 border-t border-slate-800">
              {KPI_METRIC_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSaveCardMetric(opt.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    cardSlots[modalSlotIndex] === opt.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {cardSlots[modalSlotIndex] === opt.id && <span>✓</span>}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalSlotIndex(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {customRangeModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Rentang Tanggal Kustom</h3>
              <button
                onClick={() => setCustomRangeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomRangeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setCustomRangeModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25"
              >
                Terapkan Rentang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
