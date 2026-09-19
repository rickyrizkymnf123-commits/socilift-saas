'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email);
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-4 border border-white/20">
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Akun Socilift</h1>
          <p className="text-blue-100 text-sm mt-1">Mulai rencanakan konten viral brand Anda</p>
        </div>

        <form onSubmit={handleSignup} className="p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Nama Organisasi / Agency
            </label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Contoh: Media Viral Creative"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Kerja
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="nama@perusahaan.com"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 text-sm mt-4"
          >
            {loading ? 'Membuat Akun...' : 'Daftar Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
