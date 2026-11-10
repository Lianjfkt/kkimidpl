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
  const primaryLinks = allLinks.slice(0, 4);
  const secondaryLinks = allLinks.slice(4);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--neu-bg)]">
      {/* Neumorphic Sidebar for Desktop */}
      <aside 
        className="hidden md:flex md:flex-shrink-0 flex-col w-[280px] bg-[var(--neu-surface)] border-r border-[var(--neu-border)] transition-all duration-300"
        style={{
          boxShadow: '4px 0 20px rgba(0,0,0,0.25), inset -1px 0 0 var(--neu-border)'
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center h-20 px-6 border-b border-[var(--neu-border)] bg-[var(--neu-surface)]">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mr-3.5 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'var(--neu-accent-grad)',
              boxShadow: 'var(--neu-shadow-accent)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <svg className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[15px] text-[var(--md-sys-color-on-surface)] tracking-tight">
              KKI DPL Manager
            </span>
            <span className="text-[10px] text-[var(--md-sys-color-primary)] font-semibold tracking-wider uppercase mt-0.5">
              Kushin Ryu Karate
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 flex flex-col justify-between py-5 overflow-y-auto px-4">
          <nav className="space-y-2">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-[var(--md-sys-color-primary)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--neu-surface-low)',
                          boxShadow: 'var(--neu-shadow-pressed), 0 0 10px rgba(255, 82, 82, 0.1)',
                          border: '1px solid var(--neu-border-subtle)',
                        }
                      : {
                          backgroundColor: 'transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--neu-surface-high)';
                      e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat-sm)';
                      e.currentTarget.style.transform = 'translateY(-1.5px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div 
                    className={`mr-3.5 p-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-primary)]'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'var(--neu-accent-grad)',
                            boxShadow: '0 0 12px rgba(255, 82, 82, 0.4)',
                          }
                        : {
                            backgroundColor: 'var(--neu-surface-low)',
                            boxShadow: 'var(--neu-shadow-pressed-sm)',
                          }
                    }
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                  </div>
                  <span className="tracking-wide">{link.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] shadow-[0_0_8px_var(--md-sys-color-primary)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Card & Controls in Sidebar */}
          <div 
            className="mt-6 pt-4 p-4 rounded-3xl border border-[var(--neu-border)] flex-shrink-0"
            style={{
              backgroundColor: 'var(--neu-surface-low)',
              boxShadow: 'var(--neu-shadow-pressed-sm)'
            }}
          >
            <div className="flex items-center px-1 mb-3.5">
              <div 
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold mr-3 text-white transition-transform duration-200 hover:scale-105"
                style={{
                  background: 'var(--neu-accent-grad)',
                  boxShadow: 'var(--neu-shadow-flat-sm)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-[13px] font-bold text-[var(--md-sys-color-on-surface)] truncate leading-tight">
                  {profile.full_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--md-sys-color-primary)]">
                    {profile.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Link
                href="/settings"
                className={`w-full flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-200 cursor-pointer ${
                  pathname === '/settings'
                    ? 'text-[var(--md-sys-color-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
                style={
                  pathname === '/settings'
                    ? {
                        backgroundColor: 'var(--neu-surface)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                      }
                    : {
                        backgroundColor: 'var(--neu-surface)',
                        boxShadow: 'var(--neu-shadow-flat-sm)',
                      }
                }
              >
                <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan
              </Link>

              <button
                onClick={signOut}
                className="w-full flex items-center px-3.5 py-2.5 text-xs font-bold text-[var(--md-sys-color-error)] rounded-2xl transition-all duration-200 cursor-pointer active:scale-95"
                style={{
                  backgroundColor: 'var(--neu-surface)',
                  boxShadow: 'var(--neu-shadow-flat-sm)',
                  border: '1px solid rgba(255, 82, 82, 0.15)'
                }}
              >
                <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Neumorphic Header Bar */}
        <header 
          className="sticky top-0 z-40 flex items-center justify-between h-20 px-6 md:px-8 flex-shrink-0 bg-[var(--neu-surface)] border-b border-[var(--neu-border)] transition-all duration-300"
          style={{
            boxShadow: '0 4px 18px rgba(0,0,0,0.25)'
          }}
        >
          {/* Mobile Logo View */}
          <div className="flex items-center md:hidden">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white mr-2.5"
              style={{
                background: 'var(--neu-accent-grad)',
                boxShadow: 'var(--neu-shadow-accent)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display font-bold text-[14px] text-[var(--md-sys-color-on-surface)] tracking-tight">
              KKI DPL
            </span>
          </div>

          {/* Desktop Role Pill Badge */}
          <div className="hidden md:flex items-center gap-3">
            <div 
              className="px-4 py-1.5 rounded-full flex items-center gap-2 border border-[var(--neu-border)]"
              style={{
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)'
              }}
            >
              <span className="neu-status-dot bg-[var(--md-sys-color-primary)]" />
              <h1 className="text-[11px] font-bold tracking-widest text-[var(--md-sys-color-on-surface-variant)] uppercase">
                {profile.role} Portal
              </h1>
            </div>
          </div>

          {/* Right side controls: Notification Bell & Mobile Logout */}
          <div className="flex items-center space-x-3.5">
            <NotificationBell />
            <button
              onClick={signOut}
              className="md:hidden text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-error)] px-3 py-1.5 rounded-full transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--neu-surface)',
                boxShadow: 'var(--neu-shadow-flat-sm)',
                border: '1px solid rgba(255, 82, 82, 0.2)'
              }}
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Dashboard Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-10">
          <div className="max-w-7xl mx-auto space-y-7 animate-m3-page-enter">
            {children}
          </div>
        </main>

        {/* Bottom Nav for Mobile - Highly Tactile Neumorphic Dock */}
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 h-18 bg-[var(--neu-surface)] border-t border-[var(--neu-border)] flex justify-around items-center z-50 px-2 pb-safe shadow-[0_-6px_25px_rgba(0,0,0,0.4)]"
        >
          {primaryLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center py-1 flex-1 min-w-0 transition-transform active:scale-90"
              >
                <div 
                  className={`flex items-center justify-center h-8 w-12 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'var(--neu-accent-grad)',
                          boxShadow: 'var(--neu-shadow-accent)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }
                      : {
                          backgroundColor: 'var(--neu-surface-low)',
                          boxShadow: 'var(--neu-shadow-pressed-sm)',
                          border: '1px solid var(--neu-border-subtle)'
                        }
                  }
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                </div>
                <span className={`text-[9px] tracking-tight truncate max-w-full mt-1 font-semibold ${
                  isActive ? 'text-[var(--md-sys-color-primary)] font-bold' : 'text-[var(--md-sys-color-on-surface-variant)]'
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
              className="flex flex-col items-center justify-center py-1 flex-1 min-w-0 cursor-pointer transition-transform active:scale-90"
            >
              <div 
                className={`flex items-center justify-center h-8 w-12 rounded-2xl transition-all duration-200 ${
                  mobileMenuOpen 
                    ? 'text-white' 
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
                style={
                  mobileMenuOpen
                    ? {
                        background: 'var(--neu-accent-grad)',
                        boxShadow: 'var(--neu-shadow-accent)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }
                    : {
                        backgroundColor: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border-subtle)'
                      }
                }
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <span className="text-[9px] tracking-tight truncate max-w-full mt-1 font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Menu
              </span>
            </button>
          )}

          {/* Settings button directly on mobile for other roles */}
          {secondaryLinks.length === 0 && (
            <Link
              href="/settings"
              className="flex flex-col items-center justify-center py-1 flex-1 min-w-0 transition-transform active:scale-90"
            >
              <div 
                className={`flex items-center justify-center h-8 w-12 rounded-2xl transition-all duration-200 ${
                  pathname === '/settings' 
                    ? 'text-white' 
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
                style={
                  pathname === '/settings'
                    ? {
                        background: 'var(--neu-accent-grad)',
                        boxShadow: 'var(--neu-shadow-accent)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }
                    : {
                        backgroundColor: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border-subtle)'
                      }
                }
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <span className={`text-[9px] tracking-tight truncate max-w-full mt-1 font-semibold ${
                pathname === '/settings' ? 'text-[var(--md-sys-color-primary)] font-bold' : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}>
                Pengaturan
              </span>
            </Link>
          )}
        </nav>

        {/* Mobile secondary sheet drawer */}
        {mobileMenuOpen && secondaryLinks.length > 0 && (
          <div 
            className="fixed inset-0 z-50 md:hidden flex flex-col justify-end" 
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="rounded-t-[36px] p-6 space-y-4 animate-fade-in"
              style={{ 
                background: 'var(--neu-surface-high)', 
                borderTop: '1px solid var(--neu-border)',
                boxShadow: 'var(--neu-shadow-flat-lg)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--neu-border)]">
                <span className="text-xs font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Navigasi Lengkap
                </span>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-xs font-bold text-[var(--md-sys-color-primary)] px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--neu-surface)',
                    boxShadow: 'var(--neu-shadow-flat-sm)'
                  }}
                >
                  Tutup
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto py-2">
                {secondaryLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                        isActive
                          ? 'text-white'
                          : 'text-[var(--md-sys-color-on-surface)]'
                      }`}
                      style={
                        isActive
                          ? {
                              background: 'var(--neu-accent-grad)',
                              boxShadow: 'var(--neu-shadow-accent)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }
                          : {
                              backgroundColor: 'var(--neu-surface)',
                              boxShadow: 'var(--neu-shadow-flat-sm)',
                              border: '1px solid var(--neu-border)'
                            }
                      }
                    >
                      <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                      </svg>
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    pathname === '/settings'
                      ? 'text-white'
                      : 'text-[var(--md-sys-color-on-surface)]'
                  }`}
                  style={
                    pathname === '/settings'
                      ? {
                          background: 'var(--neu-accent-grad)',
                          boxShadow: 'var(--neu-shadow-accent)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }
                      : {
                          backgroundColor: 'var(--neu-surface)',
                          boxShadow: 'var(--neu-shadow-flat-sm)',
                          border: '1px solid var(--neu-border)'
                        }
                  }
                >
                  <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  <span>Pengaturan</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
