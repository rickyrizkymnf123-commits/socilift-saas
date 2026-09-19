'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Shield, User, ArrowRight } from 'lucide-react';
import { SociliftIcon } from '@/components/ui/socilift-logo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('rickyrizkymnf123@gmail.com');
  const [password, setPassword] = useState('Permatasari11');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Login gagal. Silakan periksa kembali email Anda.');
      setLoading(false);
    }
  };

  const quickLogin = async (targetEmail: string) => {
    setEmail(targetEmail);
    setLoading(true);
    setError('');
    const success = await login(targetEmail);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Login gagal.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
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
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
              Quick Login Demo
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin('rickyrizkymnf123@gmail.com')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 text-xs font-bold transition"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                Admin (Ricky)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('creator@socilift.local')}
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
