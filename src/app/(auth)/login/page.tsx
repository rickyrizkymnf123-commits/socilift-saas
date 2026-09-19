'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sparkles, Shield, User, ArrowRight } from 'lucide-react';

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

  const quickLogin = async (targetEmail: string, targetPass: string = 'Permatasari11') => {
    setEmail(targetEmail);
    setPassword(targetPass);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-4 border border-white/20">
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Socilift Plus SaaS</h1>
          <p className="text-blue-100 text-sm mt-1">Platform Content Planning & Otomasi AI</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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
                onClick={() => quickLogin('rickyrizkymnf123@gmail.com', 'Permatasari11')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-medium transition"
              >
                <Shield className="w-4 h-4 text-blue-600" />
                Admin (Ricky)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('creator@socilift.local', 'password123')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
              >
                <User className="w-4 h-4 text-slate-600" />
                Creator Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
