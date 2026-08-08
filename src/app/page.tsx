'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (profile) {
        router.push(`/${profile.role}`);
      } else {
        router.push('/login');
      }
    }
  }, [profile, loading, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="flex flex-col items-center space-y-4">
        <span className="w-12 h-12 rounded-full bg-[var(--color-accent-karate)] flex items-center justify-center text-white font-extrabold text-lg animate-pulse">
          KKI
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] animate-pulse">
          Memuat Sistem...
        </p>
      </div>
    </div>
  );
}
