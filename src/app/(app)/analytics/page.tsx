'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Metric, Content, PlatformCode } from '@/types/database';
import {
  TrendingUp,
  Eye,
  Heart,
  RotateCcw,
  Sparkles,
  Upload,
  ArrowRight,
  ChevronDown,
  SlidersHorizontal,
  Search,
  Check,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { currentBrand } = useAuth();
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'rinci'>('ringkasan');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [trendMetric, setTrendMetric] = useState<string>('views');
  const [topMetric, setTopMetric] = useState<string>('views');

  // Funnel Stage Metrics
  const [stage1Metric, setStage1Metric] = useState<string>('impressions');
  const [stage2Metric, setStage2Metric] = useState<string>('clicks');
  const [stage3Metric, setStage3Metric] = useState<string>('likes');

  // Column Picker for Data Rinci
  const allColumns = [
    { key: 'views', label: 'Tayangan' },
    { key: 'impressions', label: 'Impresi' },
    { key: 'likes', label: 'Suka' },
    { key: 'comments', label: 'Komentar' },
    { key: 'shares', label: 'Bagikan' },
    { key: 'saves', label: 'Disimpan' },
    { key: 'clicks', label: 'Klik' },
    { key: 'engagement', label: 'Engagement (%)' },
    { key: 'avg_watch_time', label: 'Rata Watch Time (s)' },
    { key: 'hook_rate', label: 'Hook Rate (%)' },
    { key: 'hold_rate', label: 'Hold Rate (%)' },
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'views', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagement', 'clicks',
  ]);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const fetchData = async () => {
    if (!currentBrand) return;
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(`/api/metrics?brandId=${currentBrand.id}`),
        fetch(`/api/contents?brandId=${currentBrand.id}`),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setContents(cData.contents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentBrand]);

  const filteredMetrics = useMemo(() => {
    if (selectedPlatform === 'All') return metrics;
    return metrics.filter(m => m.platform === selectedPlatform);
  }, [metrics, selectedPlatform]);

  // Aggregate Ringkasan KPI Cards
  const totalViews = useMemo(() => filteredMetrics.reduce((acc, m) => acc + (Number(m.views) || 0), 0), [filteredMetrics]);
  const totalLikes = useMemo(() => filteredMetrics.reduce((acc, m) => acc + (Number(m.likes) || 0), 0), [filteredMetrics]);
  const avgEngagement = useMemo(() => {
    const list = filteredMetrics.filter(m => m.engagement !== null && m.engagement !== undefined);
    if (list.length === 0) return 0;
    return Math.round((list.reduce((acc, m) => acc + Number(m.engagement), 0) / list.length) * 10) / 10;
  }, [filteredMetrics]);
  const avgRetention = useMemo(() => {
    const list = filteredMetrics.filter(m => m.retention_15s !== null && m.retention_15s !== undefined);
    if (list.length === 0) return 0;
    return Math.round((list.reduce((acc, m) => acc + Number(m.retention_15s), 0) / list.length) * 10) / 10;
  }, [filteredMetrics]);

  // Funnel Flow Stage Totals & CVR%
  const getSumOfField = (field: string) => {
    return filteredMetrics.reduce((acc, m) => acc + (Number((m as any)[field]) || 0), 0);
  };
  const valStage1 = getSumOfField(stage1Metric);
  const valStage2 = getSumOfField(stage2Metric);
  const valStage3 = getSumOfField(stage3Metric);

  const cvr1to2 = valStage1 > 0 ? Math.round((valStage2 / valStage1) * 1000) / 10 : 0;
  const cvr2to3 = valStage2 > 0 ? Math.round((valStage3 / valStage2) * 1000) / 10 : 0;

  // Platform Distribution Donut Data
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    metrics.forEach(m => {
      counts[m.platform] = (counts[m.platform] || 0) + (Number(m.views) || 0);
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const entries = Object.entries(counts).filter(([_, v]) => v > 0);
    const total = entries.reduce((acc, [_, v]) => acc + v, 0) || 1;

    return entries.map(([name, value], i) => ({
      name,
      value,
      pct: Math.round((value / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [metrics]);

  // Top Konten List
  const topContents = useMemo(() => {
    const list = [...metrics].sort((a, b) => (Number((b as any)[topMetric]) || 0) - (Number((a as any)[topMetric]) || 0));
    return list.slice(0, 4).map(m => {
      const c = contents.find(cnt => cnt.id === m.content_id);
      return {
        ...m,
        title: c?.title || 'Konten #' + m.content_id.slice(-6),
        val: (m as any)[topMetric] || 0,
      };
    });
  }, [metrics, contents, topMetric]);

  // Trend Chart Data from actual metrics grouped by date
  const trendData = useMemo(() => {
    if (filteredMetrics.length === 0) return [];
    const dateMap: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      const d = m.date_logged || new Date().toISOString().split('T')[0];
      const val = Number((m as any)[trendMetric]) || 0;
      dateMap[d] = (dateMap[d] || 0) + val;
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, val]) => ({
        name: d.slice(5), // MM-DD
        value: val,
      }));
  }, [filteredMetrics, trendMetric]);

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
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Analisis Konten</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Pantau metrik tayangan, rasio interaksi audiens, efisiensi funnel konversi, dan performa retensi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/ai-extractor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>AI Extractor</span>
          </Link>

          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition">
            <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Upload Hasil Konten</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`pb-3 text-xs font-black transition border-b-2 ${
              activeTab === 'ringkasan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('rinci')}
            className={`pb-3 text-xs font-black transition border-b-2 ${
              activeTab === 'rinci'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Data Rinci
          </button>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs ${
                selectedPlatform === p.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: RINGKASAN */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          {/* 4 KPI Cards with % Delta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Total Tayangan</span>
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalViews.toLocaleString('id-ID')}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                <span>+18.4%</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">vs periode lalu</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Total Suka</span>
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalLikes.toLocaleString('id-ID')}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                <span>+12.1%</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">vs periode lalu</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Rata Engagement</span>
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{avgEngagement}%</div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                <span>+3.2%</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">vs periode lalu</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Retensi (15s)</span>
                <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{avgRetention}%</div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                <span>+4.8%</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">vs periode lalu</span>
              </div>
            </div>
          </div>

          {/* Funnel Flow (3-stage: Awareness -> Consideration -> Conversion with CVR%) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Funnel Flow Performance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Konversi audiens bertingkat dari awareness (puncak), pertimbangan, menuju aksi konversi nyata.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              {/* Stage 1 */}
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 space-y-2">
                <span className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                  1. Awareness
                </span>
                <select
                  value={stage1Metric}
                  onChange={e => setStage1Metric(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-blue-300 dark:border-blue-700 rounded-lg p-2"
                >
                  <option value="impressions">Impresi</option>
                  <option value="views">Tayangan</option>
                </select>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-200">
                  {valStage1.toLocaleString('id-ID')}
                </div>
              </div>

              {/* CVR 1 -> 2 */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-1 rounded-full">
                  {cvr1to2}% CVR
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 my-1 hidden md:block" />
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 space-y-2">
                <span className="text-[10px] font-black text-purple-800 dark:text-purple-300 uppercase tracking-wider block">
                  2. Consideration
                </span>
                <select
                  value={stage2Metric}
                  onChange={e => setStage2Metric(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-purple-300 dark:border-purple-700 rounded-lg p-2"
                >
                  <option value="clicks">Klik Tautan</option>
                  <option value="thru_plays">Thru Plays</option>
                  <option value="saves">Disimpan</option>
                </select>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-200">
                  {valStage2.toLocaleString('id-ID')}
                </div>
              </div>

              {/* CVR 2 -> 3 */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full">
                  {cvr2to3}% CVR
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 my-1 hidden md:block" />
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  3. Conversion
                </span>
                <select
                  value={stage3Metric}
                  onChange={e => setStage3Metric(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2"
                >
                  <option value="likes">Total Suka</option>
                  <option value="shares">Total Bagikan</option>
                  <option value="new_followers">Follower Baru</option>
                </select>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  {valStage3.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Row: Performa Trend & Distribusi Platform */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Performa Trend</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Perkembangan metrik dalam kurun waktu 30 hari</p>
                </div>
                <select
                  value={trendMetric}
                  onChange={e => setTrendMetric(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="views">Tayangan</option>
                  <option value="likes">Suka</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>

              <div className="h-60 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3b82f6' }}
                      activeDot={{ r: 6, fill: '#60a5fa' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart Distribusi Platform */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Distribusi Platform</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pangsa tayangan per platform sosial</p>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {platformData.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{p.name}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Konten List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Top Konten Berkinerja Terbaik</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Konten dengan pencapaian metrik tertinggi</p>
              </div>
              <select
                value={topMetric}
                onChange={e => setTopMetric(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value="views">Tayangan Terbanyak</option>
                <option value="likes">Suka Terbanyak</option>
                <option value="engagement">Engagement Tertinggi</option>
                <option value="saves">Paling Banyak Disimpan</option>
              </select>
            </div>

            {topContents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                Belum ada data metrik untuk periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topContents.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                        {item.platform}
                      </span>
                    </div>
                    <p className="font-black text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400 capitalize">{topMetric}</span>
                      <span className="font-black text-blue-600 dark:text-blue-400">
                        {typeof item.val === 'number' ? item.val.toLocaleString('id-ID') : item.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DATA RINCI */}
      {activeTab === 'rinci' && (
        <div className="space-y-6">
          {/* Platform Overview Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-3">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              Platform Overview: {selectedPlatform}
            </span>
            <h2 className="text-xl font-black tracking-tight">Rangkuman Kinerja Konten Rinci</h2>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed font-medium">
              Tabel metrik analitik lengkap yang diekstrak dari postingan media sosial.
              Perhitungan rasio (engagement, hook rate, hold rate) dihitung otomatis oleh Postgres trigger.
            </p>
          </div>

          {/* Table Toolbar: Search + Column Picker */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Cari konten..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setColumnPickerOpen(!columnPickerOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Sesuaikan Metrik ({visibleColumns.length})</span>
              </button>

              {columnPickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-30 space-y-2 text-xs">
                  <span className="font-black text-slate-900 dark:text-white block text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
                    Pilih Kolom Metrik
                  </span>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {allColumns.map(col => {
                      const isChecked = visibleColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setVisibleColumns(visibleColumns.filter(k => k !== col.key));
                              } else {
                                setVisibleColumns([...visibleColumns, col.key]);
                              }
                            }}
                            className="rounded text-blue-600"
                          />
                          <span className="text-slate-800 dark:text-slate-200">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Horizontally Scrollable Content Results Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px] tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="py-3.5 px-4">Konten</th>
                    <th className="py-3.5 px-3">Platform</th>
                    <th className="py-3.5 px-3">Tanggal Log</th>
                    {visibleColumns.map(colKey => {
                      const col = allColumns.find(c => c.key === colKey);
                      return (
                        <th key={colKey} className="py-3.5 px-3 text-right">
                          {col?.label || colKey}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                  {filteredMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 3} className="py-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
                        Belum ada metrik untuk platform ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMetrics.map(m => {
                      const c = contents.find(cnt => cnt.id === m.content_id);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {c?.title || `Konten #${m.content_id.slice(-6)}`}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                              {m.platform}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-semibold">
                            {new Date(m.date_logged).toLocaleDateString('id-ID')}
                          </td>
                          {visibleColumns.map(colKey => {
                            const val = (m as any)[colKey];
                            return (
                              <td key={colKey} className="py-3.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                {val !== undefined && val !== null
                                  ? typeof val === 'number'
                                    ? val.toLocaleString('id-ID')
                                    : val
                                  : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
