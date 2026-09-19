'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

import { SociliftIcon } from '@/components/ui/socilift-logo';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <div className="flex justify-center animate-bounce">
          <SociliftIcon size="lg" glow={true} />
        </div>
        <p className="text-slate-400 text-xs font-bold tracking-wider uppercase">Memuat Socilift Plus...</p>
      </div>
    </div>
  );
}
