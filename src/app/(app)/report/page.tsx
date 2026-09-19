'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Metric, Content } from '@/types/database';
import { exportToCSV, CSVColumn } from '@/lib/csv-helper';
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  BarChart2,
  Download,
  Settings2,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ReportPage() {
  const { currentBrand } = useAuth();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [sidebarTab, setSidebarTab] = useState<'breakdown' | 'metrik'>('breakdown');

  // Breakdown checkboxes
  const [timeBreakdown, setTimeBreakdown] = useState<string[]>(['Bulanan']);
  const [detailBreakdown, setDetailBreakdown] = useState<string[]>(['Komposisi Platform']);
  const [audienceBreakdown, setAudienceBreakdown] = useState<string[]>([]);
  const [locationBreakdown, setLocationBreakdown] = useState<string[]>([]);

  // Metrik checkboxes
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'views',
    'impressions',
    'likes',
    'engagement',
  ]);

  const metricOptions = [
    { key: 'views', label: 'Tayangan (Views)' },
    { key: 'impressions', label: 'Impresi (Impressions)' },
    { key: 'likes', label: 'Total Suka (Likes)' },
    { key: 'comments', label: 'Komentar (Comments)' },
    { key: 'shares', label: 'Bagikan (Shares)' },
    { key: 'saves', label: 'Disimpan (Saves)' },
    { key: 'clicks', label: 'Klik (Clicks)' },
    { key: 'engagement', label: 'Engagement Rate (%)' },
    { key: 'hook_rate', label: 'Hook Rate (%)' },
    { key: 'hold_rate', label: 'Hold Rate (%)' },
  ];

  const fetchMetrics = async () => {
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
    fetchMetrics();
  }, [currentBrand]);

  const filteredMetrics = useMemo(() => {
    if (selectedPlatform === 'All') return metrics;
    return metrics.filter(m => m.platform === selectedPlatform);
  }, [metrics, selectedPlatform]);

  // Pivot Table Rows
  const pivotRows = useMemo(() => {
    if (filteredMetrics.length === 0) return [];
    const map: Record<string, any> = {};
    filteredMetrics.forEach(m => {
      const date = new Date(m.date_logged);
      const periodKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      const rowKey = `${periodKey} - ${m.platform}`;

      if (!map[rowKey]) {
        map[rowKey] = {
          period: periodKey,
          platform: m.platform,
          count: 0,
          views: 0,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0,
          engagementSum: 0,
          hookSum: 0,
          holdSum: 0,
        };
      }

      map[rowKey].count += 1;
      map[rowKey].views += Number(m.views) || 0;
      map[rowKey].impressions += Number(m.impressions) || 0;
      map[rowKey].likes += Number(m.likes) || 0;
      map[rowKey].comments += Number(m.comments) || 0;
      map[rowKey].shares += Number(m.shares) || 0;
      map[rowKey].saves += Number(m.saves) || 0;
      map[rowKey].clicks += Number(m.clicks) || 0;
      map[rowKey].engagementSum += Number(m.engagement) || 0;
      map[rowKey].hookSum += Number(m.hook_rate) || 0;
      map[rowKey].holdSum += Number(m.hold_rate) || 0;
    });

    return Object.values(map).map((row: any) => ({
      ...row,
      engagement: row.count > 0 ? Math.round((row.engagementSum / row.count) * 10) / 10 : 0,
      hook_rate: row.count > 0 ? Math.round((row.hookSum / row.count) * 10) / 10 : 0,
      hold_rate: row.count > 0 ? Math.round((row.holdSum / row.count) * 10) / 10 : 0,
    }));
  }, [filteredMetrics]);

  // Chart Data
  const chartData = useMemo(() => {
    return pivotRows.map(row => ({
      name: `${row.platform} (${row.period})`,
      ...row,
    }));
  }, [pivotRows]);

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const platforms = ['All', 'TikTok', 'IG', 'YouTube', 'FB', 'X', 'Threads'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Laporan Konten</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Pivot-table builder kustom untuk rekapitulasi data metrik promosi dan performa brand.
          </p>
        </div>

        <button
          onClick={() => {
            if (pivotRows.length === 0) {
              alert('Belum ada data rekapitulasi laporan untuk di-export.');
              return;
            }
            const columns: CSVColumn[] = [
              { key: 'period', label: 'Periode' },
              { key: 'platform', label: 'Platform' },
              { key: 'count', label: 'Jumlah Konten' },
              ...selectedMetrics.map(key => {
                const opt = metricOptions.find(o => o.key === key);
                return {
                  key,
                  label: opt?.label || key,
                };
              }),
            ];
            const brandName = currentBrand?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'socilift';
            const timestamp = new Date().toISOString().slice(0, 10);
            exportToCSV(`${brandName}_laporan_pivot_${timestamp}`, columns, pivotRows);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Export Laporan (CSV)</span>
        </button>
      </div>

      {/* Main Grid: Left Pivot Table & Right Configuration Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Toolbar + Pivot Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="font-bold text-slate-600 dark:text-slate-400">Platform:</span>
              {platforms.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-3 py-1 rounded-lg font-bold transition shadow-xs ${
                    selectedPlatform === p
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {pivotRows.length} periode dirangkum
              </span>
              <button
                onClick={fetchMetrics}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 transition"
              >
                Terapkan
              </button>
            </div>
          </div>

          {/* Pivot Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 uppercase font-black text-slate-600 dark:text-slate-300 text-[10px] tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="py-3.5 px-4">Periode</th>
                    <th className="py-3.5 px-3">Platform</th>
                    <th className="py-3.5 px-3 text-center">Jumlah Konten</th>
                    {selectedMetrics.map(key => {
                      const m = metricOptions.find(o => o.key === key);
                      return (
                        <th key={key} className="py-3.5 px-3 text-right">
                          {m?.label || key}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                  {pivotRows.length === 0 ? (
                    <tr>
                      <td colSpan={selectedMetrics.length + 3} className="py-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
                        0 periode dirangkum. Belum ada data metrik yang tersimpan.
                      </td>
                    </tr>
                  ) : (
                    pivotRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{r.period}</td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-black text-[10px]">
                            {r.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{r.count} post</td>
                        {selectedMetrics.map(key => (
                          <td key={key} className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white">
                            {r[key] !== undefined ? r[key].toLocaleString('id-ID') : '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Chart Below Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Visualisasi Metrik Terpilih</h3>
              </div>
            </div>

            {chartData.length === 0 || selectedMetrics.length === 0 ? (
              <div className="h-44 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500 font-medium">
                Grafik akan muncul setelah ada data dan minimal satu metrik dipilih.
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Legend />
                    {selectedMetrics.includes('views') && (
                      <Bar dataKey="views" name="Tayangan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    )}
                    {selectedMetrics.includes('likes') && (
                      <Bar dataKey="likes" name="Suka" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    )}
                    {selectedMetrics.includes('impressions') && (
                      <Bar dataKey="impressions" name="Impresi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Atur Tabel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="font-black text-sm text-slate-900 dark:text-white">Atur Tabel Laporan</h2>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSidebarTab('breakdown')}
              className={`pb-2 px-3 font-black border-b-2 transition ${
                sidebarTab === 'breakdown'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Breakdown
            </button>
            <button
              onClick={() => setSidebarTab('metrik')}
              className={`pb-2 px-3 font-black border-b-2 transition ${
                sidebarTab === 'metrik'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Metrik ({selectedMetrics.length})
            </button>
          </div>

          {sidebarTab === 'breakdown' ? (
            <div className="space-y-4">
              {/* Breakdown Waktu */}
              <div>
                <span className="font-black text-slate-700 dark:text-slate-300 block mb-2 uppercase text-[10px] tracking-wider">
                  Breakdown Waktu
                </span>
                <div className="space-y-2">
                  {['Harian', 'Mingguan', 'Bulanan', 'Kuartalan', 'Tahunan'].map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                      <input
                        type="checkbox"
                        checked={timeBreakdown.includes(item)}
                        onChange={() => toggleArrayItem(setTimeBreakdown, item)}
                        className="rounded text-blue-600"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Breakdown Detail */}
              <div>
                <span className="font-black text-slate-700 dark:text-slate-300 block mb-2 uppercase text-[10px] tracking-wider">
                  Breakdown Detail
                </span>
                <div className="space-y-2">
                  {[
                    'Komposisi Platform',
                    'Breakdown Konten',
                    'Breakdown Funnel',
                    'Breakdown Pilar',
                    'Breakdown Objective',
                    'Breakdown Status',
                    'Breakdown Format',
                  ].map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                      <input
                        type="checkbox"
                        checked={detailBreakdown.includes(item)}
                        onChange={() => toggleArrayItem(setDetailBreakdown, item)}
                        className="rounded text-blue-600"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Audience Breakdown */}
              <div>
                <span className="font-black text-slate-700 dark:text-slate-300 block mb-2 uppercase text-[10px] tracking-wider">
                  Audience Breakdown
                </span>
                <div className="space-y-2">
                  {['Breakdown Gender', 'Breakdown Usia'].map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                      <input
                        type="checkbox"
                        checked={audienceBreakdown.includes(item)}
                        onChange={() => toggleArrayItem(setAudienceBreakdown, item)}
                        className="rounded text-blue-600"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Metrik Tab */
            <div className="space-y-2">
              <span className="font-black text-slate-700 dark:text-slate-300 block mb-2 uppercase text-[10px] tracking-wider">
                Pilih Metrik Kolom
              </span>
              {metricOptions.map(opt => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(opt.key)}
                    onChange={() => toggleArrayItem(setSelectedMetrics, opt.key)}
                    className="rounded text-blue-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
