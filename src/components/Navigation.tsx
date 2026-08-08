'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  if (!profile) return <>{children}</>;

  const role = profile.role;

  // Define navigation links by role
  const getLinks = () => {
    switch (role) {
      case 'owner':
        return [
          { label: 'Ringkasan', href: '/owner', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
          { label: 'Siswa', href: '/owner/students', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Pelatih', href: '/owner/coaches', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { label: 'Kelas', href: '/owner/classes', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Absensi', href: '/owner/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Keuangan', href: '/owner/finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Ujian Sabuk', href: '/owner/exams', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l.707.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
          { label: 'Turnamen', href: '/owner/tournaments', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.083a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
        ];
      case 'pelatih':
        return [
          { label: 'Ringkasan', href: '/pelatih', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
          { label: 'Absensi Siswa', href: '/pelatih/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        ];
      case 'ortu':
        return [
          { label: 'Anak Saya', href: '/ortu', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { label: 'Iuran', href: '/ortu/fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-shrink-0 flex-col w-64 bg-white border-r border-[var(--color-border-hairline)]">
        <div className="flex items-center h-16 px-6 border-b border-[var(--color-border-hairline)] bg-[var(--color-bg)]">
          <span className="w-8 h-8 rounded-full bg-[var(--color-accent-karate)] flex items-center justify-center text-white font-extrabold text-xs mr-3">
            KKI
          </span>
          <span className="font-bold text-sm text-[var(--color-text-primary)] tracking-tight">
            KKI DPL Manager
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
          <nav className="px-4 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-accent-karate)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-black/5 hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <svg
                    className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 border-t border-[var(--color-border-hairline)] pt-4">
            <div className="flex items-center px-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold mr-3 text-gray-600">
                {profile.full_name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                  {profile.full_name}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {profile.role}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <svg className="mr-3 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Header - Glass Navbar */}
        <header className="glass-nav sticky top-0 z-40 flex items-center justify-between h-16 px-6 flex-shrink-0">
          <div className="flex items-center md:hidden">
            <span className="w-8 h-8 rounded-full bg-[var(--color-accent-karate)] flex items-center justify-center text-white font-extrabold text-xs mr-3">
              KKI
            </span>
            <span className="font-bold text-sm text-[var(--color-text-primary)] tracking-tight">
              KKI DPL Manager
            </span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">
              {profile.role} Workspace
            </h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={signOut}
              className="md:hidden text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Bottom Nav for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-[var(--color-border-hairline)] flex justify-around items-center z-50 px-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center w-16 py-1 ${
                  isActive ? 'text-[var(--color-accent-karate)] font-semibold' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span className="text-[10px] tracking-tight truncate max-w-full">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
