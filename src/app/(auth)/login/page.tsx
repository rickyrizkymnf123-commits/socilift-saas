'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Shield, User, ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { SociliftIcon } from '@/components/ui/socilift-logo';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('rickyrizkymnf123@gmail.com');
  const [password, setPassword] = useState('Permatasari11');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setLoading(true);
    setError('');
    setIsPendingApproval(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 || data.is_approved === false) {
          setError('Sorry, kamu masih belum di-approve, menunggu persetujuan dari admin');
          setIsPendingApproval(true);
          // Redirect to pending approval page after a short moment or immediately
          setTimeout(() => {
            router.push(`/pending-approval?email=${encodeURIComponent(email.trim())}`);
          }, 1500);
          return;
        }

        setError(data.error || 'Login gagal. Silakan periksa kembali email & password Anda.');
        return;
      }

      // Success
      await login(email.trim());
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (targetEmail: string, targetPass: string = 'password') => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setLoading(true);
    setError('');
    setIsPendingApproval(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 || data.is_approved === false) {
          setError('Sorry, kamu masih belum di-approve, menunggu persetujuan dari admin');
          setIsPendingApproval(true);
          setTimeout(() => {
            router.push(`/pending-approval?email=${encodeURIComponent(targetEmail)}`);
          }, 1500);
          return;
        }
        setError(data.error || 'Login gagal.');
        return;
      }

      await login(targetEmail);
      router.push('/dashboard');
    } catch (err) {
      setError('Login gagal.');
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
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 p-8 text-white text-center border-b border-slate-800 relative">
          <div className="flex justify-center mb-3">
            <SociliftIcon size="lg" glow={true} />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight text-white">Socilift</h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40">
              Plus
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-medium">All-in-One Social Media AI Engine & Planner</p>
        </div>

        <div className="p-8">
          {error && (
            <div className={`mb-6 p-4 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200 ${
              isPendingApproval
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPendingApproval ? 'text-amber-400' : 'text-rose-400'}`} />
              <div className="flex-1">
                <p>{error}</p>
                {isPendingApproval && (
                  <Link
                    href={`/pending-approval?email=${encodeURIComponent(email)}`}
                    className="inline-block mt-2 font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    Buka Halaman Persetujuan WhatsApp →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm focus:outline-none transition"
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/25 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Belum punya akun?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
              Daftar Sekarang
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
              Quick Login Demo
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin('rickyrizkymnf123@gmail.com', 'Permatasari11')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 text-xs font-bold transition"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                Admin (Ricky)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('creator@socilift.local', 'password')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
              >
                <User className="w-4 h-4 text-slate-400" />
                Creator Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
