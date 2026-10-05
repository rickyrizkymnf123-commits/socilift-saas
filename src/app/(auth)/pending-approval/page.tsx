'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, Mail, MessageSquare, LogOut, ShieldCheck, ArrowLeft } from 'lucide-react';
import { SociliftIcon } from '@/components/ui/socilift-logo';
import Link from 'next/link';

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(queryEmail);
  const [adminWhatsapp, setAdminWhatsapp] = useState('6281234567890');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAdminWhatsapp() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data?.admin_whatsapp) {
            setAdminWhatsapp(data.admin_whatsapp);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin whatsapp:', err);
      }
    }
    fetchAdminWhatsapp();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  const getWaLink = () => {
    const msg = encodeURIComponent(
      `Halo Admin, saya baru saja mendaftar ke Socilift Plus (${email || 'akun baru'}) dan sedang menunggu persetujuan aktivasi akun.`
    );
    const cleanNumber = adminWhatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNumber || '6281234567890'}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative z-10">
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 p-8 text-white text-center border-b border-slate-800 relative">
          <div className="flex justify-center mb-3">
            <SociliftIcon size="lg" glow={true} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <h1 className="text-2xl font-black tracking-tight text-white">Socilift</h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40">
              Plus
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-2">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Menunggu Persetujuan</span>
          </div>

          <h2 className="text-xl font-bold text-white mt-2">Persetujuan Diperlukan</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Akun Anda berhasil didaftarkan tetapi saat ini sedang menunggu persetujuan (ACC) dari Administrator.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-xs text-slate-300 bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl space-y-2 leading-relaxed">
            <p className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Bagaimana cara mengaktifkan akun saya?
            </p>
            <p className="text-slate-400">
              Silakan klik tombol di bawah untuk menghubungi Admin via WhatsApp guna meminta persetujuan & aktivasi akun Anda.
            </p>
          </div>

          {email && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-500">Email Terdaftar</p>
                <p className="text-sm font-semibold text-slate-200 truncate">{email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <a
              href={getWaLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Hubungi Admin via WhatsApp
            </a>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition border border-slate-700 text-sm"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              Keluar / Kembali ke Login
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-500 leading-relaxed">
            Terima kasih atas kesabaran Anda. Sistem kami akan segera memperbarui status akses Anda setelah disetujui.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        Memuat...
      </div>
    }>
      <PendingApprovalContent />
    </Suspense>
  );
}
