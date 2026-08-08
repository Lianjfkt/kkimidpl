'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-accent-karate)] text-white text-3xl font-extrabold mb-4">
            KKI
          </span>
          <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            KKI DPL Manager
          </h2>
          <p className="body-text mt-2 text-sm">
            Masuk untuk mengakses sistem manajemen dojo
          </p>
        </div>

        <div className="apple-card mt-8 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-[var(--color-status-error)]">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-hairline)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)] text-sm transition-all"
                placeholder="email@dojo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-hairline)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)] text-sm transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="apple-btn w-full py-3"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Quick login demo box */}
          <div className="border-t border-[var(--color-border-hairline)] pt-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] text-center">
              Akun Demo Cepat
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner@dojo.com', 'owner123')}
                className="apple-btn-secondary py-2 text-xs font-medium"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pelatih@dojo.com', 'pelatih123')}
                className="apple-btn-secondary py-2 text-xs font-medium"
              >
                Pelatih
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ortu@dojo.com', 'ortu123')}
                className="apple-btn-secondary py-2 text-xs font-medium"
              >
                Ortu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
