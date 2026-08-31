'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from './NotificationBell';

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          { label: 'Pendaftaran', href: '/owner/registrations', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          { label: 'Kalender Akademik', href: '/owner/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Kurikulum', href: '/owner/curriculum', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { label: 'Laporan & Ekspor', href: '/owner/reports', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
          { label: 'Import Siswa', href: '/owner/import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
        ];
      case 'pelatih':
        return [
          { label: 'Ringkasan', href: '/pelatih', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
          { label: 'Absensi Siswa', href: '/pelatih/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Ujian & Turnamen', href: '/pelatih/exams', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.083a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
        ];
      case 'ortu':
        return [
          { label: 'Anak Saya', href: '/ortu', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { label: 'Iuran', href: '/ortu/fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Absensi', href: '/ortu/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Riwayat', href: '/ortu/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ];
      default:
        return [];
    }
  };

  const allLinks = getLinks();

  // For mobile bottom navigation: limit to 4 links + "Lainnya" (More) trigger
  const primaryLinks = allLinks.slice(0, 4);
  const secondaryLinks = allLinks.slice(4);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-shrink-0 flex-col w-[280px] bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center h-16 px-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary)] flex items-center justify-center text-white mr-3 shadow-sm">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="font-bold text-[14px] text-[var(--md-sys-color-on-surface)] tracking-tight">
            KKI DPL Manager
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between py-6 overflow-y-auto">
          <nav className="px-3 space-y-1">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-3 text-xs font-semibold rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]/40 hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <svg
                    className={`mr-3 h-4.5 w-4.5 ${isActive ? 'text-[var(--md-sys-color-on-primary-container)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
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

          <div className="px-4 border-t border-[var(--md-sys-color-outline-variant)] pt-4 flex-shrink-0">
            <div className="flex items-center px-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center text-xs font-bold mr-3 text-[var(--md-sys-color-on-primary-container)]">
                {profile.full_name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-[12px] font-semibold text-[var(--md-sys-color-on-surface)] truncate leading-tight">
                  {profile.full_name}
                </p>
                <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  {profile.role}
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className={`w-full flex items-center px-4 py-2.5 text-xs font-semibold rounded-full transition-all duration-200 mb-1 ${
                pathname === '/settings'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]/40 hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <svg className={`mr-3 h-4.5 w-4.5 ${pathname === '/settings' ? 'text-[var(--md-sys-color-on-primary-container)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Pengaturan
            </Link>

            <button
              onClick={signOut}
              className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/20 rounded-full transition-all duration-200 cursor-pointer"
            >
              <svg className="mr-3 h-4.5 w-4.5 text-[var(--md-sys-color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Header - M3 Surface Navbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 flex-shrink-0 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center md:hidden">
            <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary)] flex items-center justify-center text-white mr-2.5 shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <span className="font-bold text-[13px] text-[var(--md-sys-color-on-surface)] tracking-tight">
              KKI DPL
            </span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-[12px] font-bold tracking-widest text-[var(--md-sys-color-on-surface-variant)] uppercase">
              {profile.role} workspace
            </h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <button
              onClick={signOut}
              className="md:hidden text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/30 border border-[var(--md-sys-color-error-container)]/50 px-3 py-1.5 rounded-full"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-m3-page-enter">
            {children}
          </div>
        </main>

        {/* Bottom Nav for Mobile - Highly Responsive */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] flex justify-around items-center z-50 px-1 pb-safe shadow-lg">
          {primaryLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center py-1 flex-1 min-w-0"
              >
                <div className={`flex items-center justify-center h-7 w-12 rounded-full transition-all duration-200 ${
                  isActive 
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]' 
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}>
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                </div>
                <span className={`text-[9px] tracking-tight truncate max-w-full mt-1 font-medium ${
                  isActive ? 'text-[var(--md-sys-color-on-surface)] font-semibold' : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}>
                  {link.label}
                </span>
              </Link>
            );
          })}

          {/* More menu drawer trigger if role is owner and has more links */}
          {secondaryLinks.length > 0 && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex flex-col items-center justify-center py-1 flex-1 min-w-0 cursor-pointer"
            >
              <div className={`flex items-center justify-center h-7 w-12 rounded-full transition-all duration-200 ${
                mobileMenuOpen 
                  ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]' 
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}>
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <span className="text-[9px] tracking-tight truncate max-w-full mt-1 font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Menu
              </span>
            </button>
          )}

          {/* Settings button directly on mobile for other roles */}
          {secondaryLinks.length === 0 && (
            <Link
              href="/settings"
              className="flex flex-col items-center justify-center py-1 flex-1 min-w-0"
            >
              <div className={`flex items-center justify-center h-7 w-12 rounded-full transition-all duration-200 ${
                pathname === '/settings' 
                  ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]' 
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}>
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <span className={`text-[9px] tracking-tight truncate max-w-full mt-1 font-medium ${
                pathname === '/settings' ? 'text-[var(--md-sys-color-on-surface)] font-semibold' : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}>
                Pengaturan
              </span>
            </Link>
          )}
        </nav>

        {/* Mobile secondary sheet drawer */}
        {mobileMenuOpen && secondaryLinks.length > 0 && (
          <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileMenuOpen(false)}>
            <div
              className="absolute bottom-16 left-0 right-0 rounded-t-[var(--md-sys-shape-corner-extra-large)] p-5 space-y-4"
              style={{ background: 'var(--md-sys-color-surface-container-high)', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-xs font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)] uppercase">Navigasi Tambahan</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-[var(--md-sys-color-primary)]">Tutup</button>
              </div>
              <div className="grid grid-cols-2 gap-3.5 max-h-[40vh] overflow-y-auto py-2">
                {secondaryLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3.5 py-3 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                          : 'text-[var(--md-sys-color-on-surface)] bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                      </svg>
                      {link.label}
                    </Link>
                  );
                })}
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3.5 py-3 rounded-full text-xs font-semibold ${
                    pathname === '/settings'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                      : 'text-[var(--md-sys-color-on-surface)] bg-white/5'
                  }`}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Pengaturan
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
