'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Shield, 
  Award, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Users, 
  Clock, 
  Trophy, 
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { profile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'kids' | 'adults' | 'athletes'>('all');

  const bentoItems = [
    {
      id: "kids",
      title: "Kelas Anak-Anak (Kids Class)",
      age: "Usia 6 - 12 Tahun",
      category: "kids",
      desc: "Menanamkan disiplin, konsentrasi, rasa percaya diri, serta koordinasi fisik motorik anak sejak usia dini lewat pendekatan karate yang edukatif dan bersemangat.",
      icon: <Users className="w-7 h-7 text-[var(--md-sys-color-primary)]" />,
      span: "md:col-span-2"
    },
    {
      id: "adults",
      title: "Kelas Remaja & Dewasa",
      age: "Usia 13 Tahun ke Atas",
      category: "adults",
      desc: "Pelatihan fisik komprehensif, bela diri taktis, peningkatan stamina, dan pembentukan mental baja dalam menghadapi tantangan hidup sehari-hari.",
      icon: <Shield className="w-7 h-7 text-[var(--md-sys-color-primary)]" />,
      span: "md:col-span-1"
    },
    {
      id: "athletes",
      title: "Kelas Prestasi & Intensif",
      age: "Fokus Kata & Kumite",
      category: "athletes",
      desc: "Pembinaan khusus atlet berbakat untuk persiapan kompetisi daerah, nasional, hingga kejuaraan internasional dengan kurikulum taktik modern.",
      icon: <Trophy className="w-7 h-7 text-[var(--md-sys-color-primary)]" />,
      span: "md:col-span-1"
    },
    {
      id: "certification",
      title: "Ujian Sabuk & Sertifikasi Resmi",
      age: "Terafiliasi KKI Pusat & FORKI",
      category: "all",
      desc: "Evaluasi kenaikan tingkat (Kyu) berkala secara terstruktur dan terverifikasi untuk memastikan standar kualitas teknik karate diakui secara nasional.",
      icon: <Award className="w-7 h-7 text-[var(--md-sys-color-primary)]" />,
      span: "md:col-span-2"
    }
  ];

  const filteredItems = activeTab === 'all' 
    ? bentoItems 
    : bentoItems.filter(item => item.category === activeTab || item.category === 'all');

  const stats = [
    { value: "150+", label: "Siswa Aktif" },
    { value: "5+", label: "Pelatih Berlisensi" },
    { value: "80+", label: "Medali Kejuaraan" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--neu-bg)] text-[var(--md-sys-color-on-surface)] overflow-x-hidden transition-colors duration-300">
      
      {/* 1. Header/Navbar - Floating Neumorphic Dock */}
      <header className="sticky top-0 z-50 bg-[var(--neu-surface)]/90 backdrop-blur-md border-b border-[var(--neu-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm transition-transform duration-200 group-hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'var(--neu-accent-grad)',
                boxShadow: 'var(--neu-shadow-accent)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              KKI
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold tracking-tight text-[var(--md-sys-color-on-surface)] leading-none text-base">
                Dojo KKI DPL
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-primary)] font-semibold uppercase tracking-wider mt-1">
                Kushin Ryu Karate
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links in Neumorphic Segmented Bar */}
          <nav 
            className="hidden md:flex items-center p-1.5 rounded-full border border-[var(--neu-border)]"
            style={{
              backgroundColor: 'var(--neu-surface-low)',
              boxShadow: 'var(--neu-shadow-pressed-sm)'
            }}
          >
            <a 
              href="#filosofi" 
              className="px-5 py-2 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--neu-surface)] hover:shadow-[var(--neu-shadow-flat-sm)] rounded-full transition-all duration-200"
            >
              Filosofi
            </a>
            <a 
              href="#program" 
              className="px-5 py-2 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--neu-surface)] hover:shadow-[var(--neu-shadow-flat-sm)] rounded-full transition-all duration-200"
            >
              Program
            </a>
            <a 
              href="#jadwal" 
              className="px-5 py-2 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--neu-surface)] hover:shadow-[var(--neu-shadow-flat-sm)] rounded-full transition-all duration-200"
            >
              Jadwal & Lokasi
            </a>
          </nav>

          {/* CTA Authentication Button */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div 
                className="h-10 w-32 rounded-full animate-pulse" 
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              />
            ) : profile ? (
              <Link href={`/${profile.role}`} className="apple-btn px-6 py-2.5 text-xs flex items-center gap-2">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link href="/login" className="apple-btn px-6 py-2.5 text-xs flex items-center gap-2">
                Masuk Sistem <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--md-sys-color-on-surface)] transition-all active:scale-90"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat-sm)',
              border: '1px solid var(--neu-border)'
            }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden border-t border-[var(--neu-border)] px-6 py-6 space-y-3.5 flex flex-col transition-all duration-300"
            style={{
              backgroundColor: 'var(--neu-surface-high)',
              boxShadow: 'var(--neu-shadow-flat-lg)'
            }}
          >
            <a 
              href="#filosofi" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] text-sm font-semibold py-1.5"
            >
              Filosofi Dojo
            </a>
            <a 
              href="#program" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] text-sm font-semibold py-1.5"
            >
              Program Latihan
            </a>
            <a 
              href="#jadwal" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] text-sm font-semibold py-1.5"
            >
              Jadwal & Lokasi
            </a>
            <div className="pt-3 border-t border-[var(--neu-border)]">
              {profile ? (
                <Link 
                  href={`/${profile.role}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="apple-btn w-full py-3 text-center text-xs flex items-center justify-center gap-2"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="apple-btn w-full py-3 text-center text-xs flex items-center justify-center gap-2"
                >
                  Masuk Sistem
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[calc(100dvh-80px)] flex items-center justify-center px-6 py-12 md:py-24 max-w-7xl mx-auto w-full">
        {/* Ambient Neumorphic Light Refraction */}
        <div className="absolute top-1/4 right-8 w-96 h-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-8 w-80 h-80 rounded-full bg-black/30 blur-[90px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Text */}
          <div className="lg:col-span-7 flex flex-col space-y-7 text-left animate-fade-in">
            {/* Pill Badge */}
            <div 
              className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full w-fit border border-[var(--neu-border)]"
              style={{
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)'
              }}
            >
              <span className="neu-status-dot bg-[var(--md-sys-color-primary)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--md-sys-color-primary)] font-bold">
                Penerimaan Siswa Baru Dibuka
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] leading-none">
              Bentuk Karakter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500">
                Disiplin & Prestasi
              </span>
            </h1>

            <p className="text-base text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-[55ch]">
              Selamat datang di Dojo Karate KKI DPL. Kami melatih seni bela diri karate Kushin Ryu dengan standar teknik tinggi, membentuk mental kepemimpinan, dan mengasah ketahanan fisik prima.
            </p>

            {/* Interactive CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {profile ? (
                <Link href={`/${profile.role}`} className="apple-btn text-center justify-center font-bold px-8 py-3.5 text-sm flex items-center gap-2">
                  Kembali ke Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/login" className="apple-btn text-center justify-center font-bold px-8 py-3.5 text-sm flex items-center gap-2">
                  Gabung Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <a 
                href="#jadwal" 
                className="apple-btn-secondary text-center justify-center font-semibold px-8 py-3.5 text-sm"
              >
                Lihat Jadwal
              </a>
            </div>

            {/* Neumorphic Stats Tile Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className="flex flex-col p-4 rounded-2xl border border-[var(--neu-border)] transition-transform duration-200 hover:-translate-y-1 cursor-default"
                  style={{
                    backgroundColor: 'var(--neu-surface)',
                    boxShadow: 'var(--neu-shadow-flat-sm)'
                  }}
                >
                  <span className="text-2xl font-display font-extrabold text-[var(--md-sys-color-primary)]">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Image - Neumorphic Elevated Frame */}
          <div 
            className="lg:col-span-5 relative w-full h-[360px] sm:h-[460px] rounded-3xl overflow-hidden border border-[var(--neu-border)] flex items-center justify-center group animate-fade-in"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat-lg)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--neu-bg)] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-red-950/20 mix-blend-overlay z-10" />
            
            <img 
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800" 
              alt="Dojo Karate KKI DPL Training" 
              className="w-full h-full object-cover grayscale opacity-70 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700"
              loading="lazy"
            />

            {/* Overlay Banner Tile */}
            <div 
              className="absolute bottom-6 left-6 right-6 z-20 border border-[var(--neu-border)] p-4 rounded-2xl flex items-center justify-between"
              style={{
                backgroundColor: 'var(--neu-surface-high)',
                boxShadow: 'var(--neu-shadow-flat)'
              }}
            >
              <div>
                <p className="text-[10px] text-[var(--md-sys-color-primary)] font-mono uppercase tracking-wider font-bold">
                  Pusat Latihan
                </p>
                <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                  DPL Karate Center
                </p>
              </div>
              <a 
                href="#jadwal" 
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--md-sys-color-primary)] border border-[var(--neu-border)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--neu-surface)',
                  boxShadow: 'var(--neu-shadow-flat-sm)'
                }}
              >
                Detail <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Philosophy Section */}
      <section id="filosofi" className="py-24 border-t border-[var(--neu-border)] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <div 
              className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-[var(--neu-border)] mb-4"
              style={{
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)'
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--md-sys-color-primary)] font-bold">
                Nilai Luhur Kushin Ryu
              </span>
            </div>
            <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
              Filosofi Tiga Pilar Bela Diri
            </h3>
            <p className="text-[var(--md-sys-color-on-surface-variant)] mt-4 leading-relaxed text-sm md:text-base">
              Dojo kami mendasarkan pelatihan pada keselarasan tiga pilar utama: penyatuan daya pikir spiritual, penguasaan jurus bela diri yang luwes, serta ketahanan raga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shin */}
            <div className="neu-card flex flex-col space-y-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center border border-[var(--neu-border)] transition-transform duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <span className="font-display font-extrabold text-2xl text-[var(--md-sys-color-primary)]">心</span>
              </div>
              <h4 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">SHIN (Mental & Karakter)</h4>
              <p className="text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Melatih integritas moral, tata krama, kerendahan hati, dan ketenangan jiwa yang teguh dalam menghadapi situasi genting di dalam maupun luar Dojo.
              </p>
            </div>

            {/* Gyu */}
            <div className="neu-card flex flex-col space-y-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center border border-[var(--neu-border)] transition-transform duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <span className="font-display font-extrabold text-2xl text-[var(--md-sys-color-primary)]">技</span>
              </div>
              <h4 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">GYU (Teknik & Presisi)</h4>
              <p className="text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Penguasaan jurus (Kata) dan pertarungan taktis (Kumite) secara presisi, lentur, tangkas, serta berlandaskan biomekanika fisik yang ergonomis.
              </p>
            </div>

            {/* Tai */}
            <div className="neu-card flex flex-col space-y-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center border border-[var(--neu-border)] transition-transform duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <span className="font-display font-extrabold text-2xl text-[var(--md-sys-color-primary)]">体</span>
              </div>
              <h4 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">TAI (Kebugaran Raga)</h4>
              <p className="text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Peningkatan stamina kardiovaskular, kecepatan refleks motorik, fleksibilitas sendi, serta kekuatan otot sebagai fondasi pertahanan tubuh prima.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Program Latihan Section (Interactive Bento Grid) */}
      <section id="program" className="py-24 border-t border-[var(--neu-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div 
              className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-[var(--neu-border)] mb-4"
              style={{
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)'
              }}
            >
              <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--md-sys-color-primary)] font-bold">
                Jenjang Pembinaan
              </span>
            </div>
            <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
              Program Sesuai Kebutuhan
            </h3>
            <p className="text-[var(--md-sys-color-on-surface-variant)] mt-3 leading-relaxed text-sm md:text-base">
              Pilih kelas spesifik berdasarkan kelompok usia dan tujuan latihan untuk mengembangkan potensi atletik Anda secara optimal.
            </p>

            {/* Neumorphic Segmented Tab Filter */}
            <div 
              className="inline-flex p-1.5 rounded-full border border-[var(--neu-border)] mt-8"
              style={{
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed)'
              }}
            >
              {[
                { id: 'all', label: 'Semua Program' },
                { id: 'kids', label: 'Anak-Anak' },
                { id: 'adults', label: 'Remaja/Dewasa' },
                { id: 'athletes', label: 'Prestasi' },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 md:px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'text-white' 
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'var(--neu-accent-grad)',
                            boxShadow: 'var(--neu-shadow-accent)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }
                        : {
                            background: 'transparent'
                          }
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`neu-card ${item.span} overflow-hidden flex flex-col justify-between p-8 group transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="p-3.5 rounded-2xl border border-[var(--neu-border)] transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    {item.icon}
                  </div>
                  <span 
                    className="text-[10px] font-mono tracking-widest uppercase text-[var(--md-sys-color-primary)] px-3 py-1 rounded-full border border-[var(--neu-border)]"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    {item.age}
                  </span>
                </div>

                <div className="space-y-3 pt-6">
                  <h4 className="text-xl md:text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
                    {item.title}
                  </h4>
                  <p className="text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-6">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[var(--md-sys-color-primary)] group-hover:translate-x-1 transition-transform"
                  >
                    Daftar Kelas Ini <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Jadwal & Lokasi Latihan */}
      <section id="jadwal" className="py-24 border-t border-[var(--neu-border)] bg-[var(--neu-surface-low)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Schedule details */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--md-sys-color-primary)] font-bold mb-2 block">
                  Waktu Pelatihan
                </span>
                <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  Jadwal Mingguan Dojo
                </h3>
                <p className="text-[var(--md-sys-color-on-surface-variant)] mt-3 leading-relaxed text-sm">
                  Kami menyelenggarakan sesi latihan rutin setiap minggu di Dojo Pusat. Dapatkan kesempatan trial/uji coba kelas gratis perdana Anda.
                </p>
              </div>

              <div className="space-y-4">
                <div className="neu-card p-5 flex items-start space-x-4">
                  <div 
                    className="p-3.5 rounded-2xl text-[var(--md-sys-color-primary)] border border-[var(--neu-border)] shrink-0"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-base">Rabu Sore</h4>
                    <p className="text-xs text-[var(--md-sys-color-primary)] font-semibold mt-0.5">Pukul 16:00 - 18:00 WIB</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">Kelas Reguler & Anak-anak (Kata Dasar & Kuda-kuda)</p>
                  </div>
                </div>

                <div className="neu-card p-5 flex items-start space-x-4">
                  <div 
                    className="p-3.5 rounded-2xl text-[var(--md-sys-color-primary)] border border-[var(--neu-border)] shrink-0"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-base">Sabtu Pagi</h4>
                    <p className="text-xs text-[var(--md-sys-color-primary)] font-semibold mt-0.5">Pukul 08:00 - 10:30 WIB</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">Pengkondisian Fisik, Pembinaan Kumite, & Sparring Terbimbing</p>
                  </div>
                </div>

                <div className="neu-card p-5 flex items-start space-x-4">
                  <div 
                    className="p-3.5 rounded-2xl text-[var(--md-sys-color-primary)] border border-[var(--neu-border)] shrink-0"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-base">Pemusatan Latihan Atlet (TC)</h4>
                    <p className="text-xs text-[var(--md-sys-color-primary)] font-semibold mt-0.5">Jadwal Intensif Sebelum Turnamen</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">Simulasi kejuaraan FORKI & penyempurnaan taktik tanding</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Location address & Map */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--md-sys-color-primary)] font-bold mb-2 block">
                  Lokasi Resmi
                </span>
                <h3 className="font-display text-3xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  Dojo KKI DPL Center
                </h3>
              </div>

              <div className="neu-card space-y-6">
                <div className="flex items-start space-x-3.5">
                  <div 
                    className="p-3 rounded-xl text-[var(--md-sys-color-primary)] shrink-0 border border-[var(--neu-border)]"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Alamat Lengkap</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5 leading-relaxed">
                      Kompleks Olahraga DPL, Gedung Serbaguna Lt. 2, Jalan Raya Utama No. 45, Jakarta Selatan.
                    </p>
                  </div>
                </div>

                {/* Map Visual Area */}
                <div 
                  className="relative w-full h-[220px] rounded-2xl overflow-hidden flex items-center justify-center border border-[var(--neu-border)]"
                  style={{
                    backgroundColor: 'var(--neu-surface-low)',
                    boxShadow: 'var(--neu-shadow-pressed)'
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600" 
                    className="w-full h-full object-cover opacity-25 grayscale"
                    alt="Map illustration"
                  />
                  
                  {/* Neumorphic Marker Pin */}
                  <div className="absolute z-10 flex flex-col items-center">
                    <span 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white animate-bounce"
                      style={{
                        background: 'var(--neu-accent-grad)',
                        boxShadow: 'var(--neu-shadow-accent)',
                        border: '1.5px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <MapPin className="w-5 h-5" />
                    </span>
                    <span 
                      className="text-[10px] text-[var(--md-sys-color-on-surface)] px-3 py-1 rounded-full shadow-lg mt-2 font-mono font-bold border border-[var(--neu-border)]"
                      style={{
                        backgroundColor: 'var(--neu-surface)',
                        boxShadow: 'var(--neu-shadow-flat-sm)'
                      }}
                    >
                      Dojo KKI DPL
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <a 
                    href="https://maps.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="apple-btn w-full py-3.5 text-center text-xs flex items-center justify-center gap-2"
                  >
                    Buka di Google Maps <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Call To Action (Join Section) */}
      <section className="py-24 border-t border-[var(--neu-border)] text-center relative px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--md-sys-color-primary)] font-bold block">
            Mulai Perjalanan Karate Anda
          </span>
          <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight">
            Siap Melangkah Lebih Jauh dan Melampaui Batas?
          </h3>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm md:text-base leading-relaxed max-w-[60ch] mx-auto">
            Daftarkan diri Anda atau putra/putri Anda hari ini. Nikmati pengalaman uji coba kelas gratis pertama di Dojo KKI DPL bersama pelatih profesional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {profile ? (
              <Link href={`/${profile.role}`} className="apple-btn font-bold px-8 py-3.5 text-sm flex items-center justify-center gap-2">
                Ke Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="/login" className="apple-btn font-bold px-8 py-3.5 text-sm flex items-center justify-center gap-2">
                Daftar & Masuk Sistem <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a href="#jadwal" className="apple-btn-secondary font-semibold px-8 py-3.5 text-sm">
              Hubungi Pengurus
            </a>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[var(--neu-border)] py-12 px-6 bg-[var(--neu-surface)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3.5">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-extrabold text-xs"
              style={{
                background: 'var(--neu-accent-grad)',
                boxShadow: 'var(--neu-shadow-accent)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              KKI
            </div>
            <div className="text-left">
              <span className="font-display font-bold text-[var(--md-sys-color-on-surface)] text-sm block leading-none">
                Dojo KKI DPL
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono uppercase tracking-wider block mt-1">
                © 2026 KKI DPL Indonesia · All Rights Reserved
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
            <a href="#filosofi" className="hover:text-[var(--md-sys-color-primary)] transition-colors">Filosofi</a>
            <a href="#program" className="hover:text-[var(--md-sys-color-primary)] transition-colors">Program</a>
            <a href="#jadwal" className="hover:text-[var(--md-sys-color-primary)] transition-colors">Jadwal & Lokasi</a>
            <Link href="/login" className="hover:text-[var(--md-sys-color-primary)] transition-colors">Login Admin/Pelatih</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
