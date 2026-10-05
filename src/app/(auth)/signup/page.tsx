'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SociliftIcon } from '@/components/ui/socilift-logo';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Format email tidak valid');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Pendaftaran gagal. Silakan coba lagi.');
        return;
      }

      // If registered successfully, redirect to pending approval
      router.push(`/pending-approval?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative z-10">
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 p-8 text-white text-center border-b border-slate-800">
          <div className="flex justify-center mb-3">
            <SociliftIcon size="lg" glow={true} />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight text-white">Buat Akun Socilift</h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40">
              Plus
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-medium">Mulai rencanakan konten viral & kelola brand Anda</p>
        </div>

        <form onSubmit={handleSignup} className="p-8 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none transition"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none transition"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 pr-10 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none transition"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 py-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Workspace & Brand terisolasi otomatis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Akses AI Generator & Planner</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/25 disabled:opacity-50 text-sm mt-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendaftarkan...
              </>
            ) : (
              <>
                Daftar Sekarang
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
