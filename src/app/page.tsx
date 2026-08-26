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
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { profile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bentoItems = [
    {
      title: "Kelas Anak-Anak (Kids Class)",
      age: "Usia 6 - 12 Tahun",
      desc: "Menanamkan disiplin, konsentrasi, rasa percaya diri, serta koordinasi fisik motorik anak sejak usia dini lewat pendekatan karate yang menyenangkan.",
      color: "from-red-950/40 to-zinc-900/60",
      icon: <Users className="w-8 h-8 text-red-500" />,
      span: "md:col-span-2"
    },
    {
      title: "Kelas Remaja & Dewasa",
      age: "Usia 13 Tahun ke Atas",
      desc: "Pelatihan fisik lengkap, bela diri taktis, peningkatan stamina, dan pembentukan mental baja untuk menghadapi tantangan kehidupan sehari-hari.",
      color: "from-zinc-900/40 to-zinc-800/40",
      icon: <Shield className="w-8 h-8 text-red-500" />,
      span: "md:col-span-1"
    },
    {
      title: "Kelas Prestasi & Intensif",
      age: "Fokus Kata & Kumite",
      desc: "Pembinaan intensif khusus atlet berbakat untuk persiapan kompetisi daerah, nasional, hingga internasional dengan kurikulum taktik modern.",
      color: "from-zinc-900/40 to-zinc-800/40",
      icon: <Trophy className="w-8 h-8 text-red-500" />,
      span: "md:col-span-1"
    },
    {
      title: "Ujian Sabuk & Sertifikasi Resmi",
      age: "Terafiliasi KKI Pusat & PB FORKI",
      desc: "Evaluasi kenaikan tingkat (Kyu) berkala secara resmi dan terstruktur guna memastikan standar kualitas teknik karate diakui secara nasional.",
      color: "from-red-950/40 to-zinc-900/60",
      icon: <Award className="w-8 h-8 text-red-500" />,
      span: "md:col-span-2"
    }
  ];

  const stats = [
    { value: "150+", label: "Siswa Aktif" },
    { value: "5+", label: "Pelatih Berlisensi" },
    { value: "80+", label: "Medali Kejuaraan" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0f0a09] text-zinc-100 overflow-x-hidden">
      
      {/* 1. Header/Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/70 border-b border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <span className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover:scale-105 transition-transform duration-200">
              KKI
            </span>
            <div className="flex flex-col">
              <span className="font-display font-bold tracking-tight text-white leading-none text-sm">Dojo KKI DPL</span>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Kushin Ryu Indonesia</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#filosofi" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">Filosofi</a>
            <a href="#program" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">Program</a>
            <a href="#jadwal" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">Jadwal & Lokasi</a>
          </nav>

          {/* CTA Authentication Button */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="h-9 w-28 bg-zinc-800 rounded-full animate-pulse" />
            ) : profile ? (
              <Link href={`/${profile.role}`} className="apple-btn px-5 py-2 text-xs flex items-center gap-1">
                Dashboard <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <Link href="/login" className="m3-btn-outlined px-5 py-2 text-xs">
                Masuk Sistem
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-zinc-950 px-6 py-6 space-y-4 flex flex-col transition-all duration-300">
            <a 
              href="#filosofi" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white text-base py-1"
            >
              Filosofi
            </a>
            <a 
              href="#program" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white text-base py-1"
            >
              Program Latihan
            </a>
            <a 
              href="#jadwal" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white text-base py-1"
            >
              Jadwal & Lokasi
            </a>
            <div className="pt-4 border-t border-zinc-900">
              {loading ? (
                <div className="h-10 w-full bg-zinc-800 rounded-full animate-pulse" />
              ) : profile ? (
                <Link 
                  href={`/${profile.role}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="apple-btn w-full py-2.5 text-center text-sm flex items-center justify-center gap-2"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="m3-btn-outlined w-full py-2.5 text-center text-sm"
                >
                  Masuk Sistem
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[calc(100dvh-64px)] flex items-center justify-center px-6 py-12 md:py-20 max-w-7xl mx-auto w-full">
        {/* Glow background effects */}
        <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-red-900/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-zinc-800/10 blur-[80px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Text - Animating with CSS keyframe for instant performance */}
          <div className="lg:col-span-7 flex flex-col space-y-6 text-left animate-m3-page-enter">
            <div className="inline-flex items-center space-x-2 bg-red-950/40 border border-red-900/30 px-3.5 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-400">Penerimaan Siswa Baru Dibuka</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
              Bentuk Karakter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Disiplin & Prestasi</span>
            </h1>

            <p className="text-base text-zinc-400 leading-relaxed max-w-[55ch]">
              Selamat datang di Dojo Karate KKI DPL. Kami melatih bela diri karate Kushin Ryu dengan standar teknik tinggi, membentuk mental kepemimpinan, dan mengasah fisik prima.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {profile ? (
                <Link href={`/${profile.role}`} className="apple-btn text-center justify-center font-semibold px-8 py-3 text-sm flex items-center gap-2">
                  Kembali ke Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/login" className="apple-btn text-center justify-center font-semibold px-8 py-3 text-sm flex items-center gap-2">
                  Gabung Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <a href="#jadwal" className="apple-btn-secondary text-center justify-center font-medium px-8 py-3 text-sm">
                Lihat Jadwal
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-900/80 max-w-lg">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-2xl font-display font-extrabold text-white">{stat.value}</span>
                  <span className="text-xs text-zinc-500 mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Image - Animating with CSS keyframe */}
          <div className="lg:col-span-5 relative w-full h-[350px] sm:h-[450px] rounded-2xl overflow-hidden border border-zinc-900 shadow-2xl flex items-center justify-center group bg-zinc-950 animate-m3-page-enter">
            {/* Visual background gradient with abstract lines */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-red-950/20 mix-blend-overlay" />
            
            <img 
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800" 
              alt="Dojo Karate KKI DPL Training" 
              className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />

            {/* Overlay Banner */}
            <div className="absolute bottom-6 left-6 right-6 z-20 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-red-500 font-mono uppercase tracking-wider font-semibold">Lokasi Latihan</p>
                <p className="text-sm font-semibold text-white mt-1">DPL Dojo Center</p>
              </div>
              <a href="#jadwal" className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1">
                Detail <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Philosophy Section */}
      <section id="filosofi" className="py-20 border-t border-zinc-900 bg-zinc-950/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold mb-3">Nilai Utama Kami</h2>
            <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white">
              Kushin Ryu M. Karate-do Indonesia
            </h3>
            <p className="text-zinc-400 mt-4 leading-relaxed">
              Dojo kami mendasarkan latihan pada tiga pilar utama aliran Kushin Ryu. Penyatuan aspek pikiran, keahlian teknik bela diri, dan ketahanan fisik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="m3-card-elevated p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/30 flex items-center justify-center">
                <span className="font-display font-extrabold text-lg text-red-500">心</span>
              </div>
              <h4 className="text-xl font-bold text-white">SHIN (Mental & Karakter)</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Melatih integritas moral, sopan santun, kerendahan hati, dan ketenangan jiwa dalam menghadapi situasi sulit di dalam maupun luar Dojo.
              </p>
            </div>

            <div className="m3-card-elevated p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/30 flex items-center justify-center">
                <span className="font-display font-extrabold text-lg text-red-500">技</span>
              </div>
              <h4 className="text-xl font-bold text-white">GYU (Keberagaman Teknik)</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Penguasaan jurus (Kata) dan pertarungan praktis (Kumite) secara presisi, fleksibel, efektif, serta berlandaskan biomekanika tubuh yang benar.
              </p>
            </div>

            <div className="m3-card-elevated p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/30 flex items-center justify-center">
                <span className="font-display font-extrabold text-lg text-red-500">体</span>
              </div>
              <h4 className="text-xl font-bold text-white">TAI (Kebugaran Fisik)</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Peningkatan stamina, refleks motorik, kecepatan respons, kelenturan tubuh, serta kekuatan otot sebagai fondasi utama pertahanan diri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Program Latihan Section (Bento Grid) */}
      <section id="program" className="py-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold mb-3">Program Latihan</h2>
            <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white">
              Kelas yang Disesuaikan Untuk Anda
            </h3>
            <p className="text-zinc-400 mt-4 leading-relaxed">
              Kami menyediakan kelas spesifik berdasarkan jenjang usia dan tujuan latihan untuk memaksimalkan potensi masing-masing siswa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bentoItems.map((item, index) => (
              <div
                key={index}
                className={`m3-card-filled ${item.span} overflow-hidden flex flex-col justify-between p-8 relative bg-gradient-to-br ${item.color} hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Background Grid Pattern or details */}
                <div className="absolute top-6 right-6 opacity-80">{item.icon}</div>
                <div className="space-y-4 pr-12">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-red-400 bg-red-950/50 border border-red-900/30 px-2 py-0.5 rounded">
                    {item.age}
                  </span>
                  <h4 className="text-2xl font-bold text-white pt-2">{item.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-[55ch]">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-6 flex items-center text-xs font-bold text-white group cursor-pointer w-fit mt-4">
                  Detail Program <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Jadwal & Lokasi Latihan */}
      <section id="jadwal" className="py-20 border-t border-zinc-900 bg-zinc-950/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Schedule details */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold mb-3">Waktu Latihan</h2>
                <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white">
                  Jadwal Mingguan Dojo
                </h3>
                <p className="text-zinc-400 mt-4 leading-relaxed">
                  Kami mengadakan sesi latihan rutin setiap minggu di Dojo Pusat. Silakan hubungi kami untuk sesi trial/uji coba gratis pertama Anda.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
                  <div className="p-3 bg-red-950/50 border border-red-900/30 rounded-xl text-red-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Rabu Sore</h4>
                    <p className="text-sm text-zinc-400 mt-1">Pukul 16:00 - 18:00 WIB</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Kelas Reguler & Anak-anak (Kata Dasar)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
                  <div className="p-3 bg-red-950/50 border border-red-900/30 rounded-xl text-red-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Sabtu Pagi</h4>
                    <p className="text-sm text-zinc-400 mt-1">Pukul 08:00 - 10:30 WIB</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Kelas Fisik, Pembinaan Kumite, & Kumite Bebas</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
                  <div className="p-3 bg-red-950/50 border border-red-900/30 rounded-xl text-red-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Latihan Khusus Atlet (Tambahan)</h4>
                    <p className="text-sm text-zinc-400 mt-1">Jadwal kondisional sebelum turnamen</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Pemusatan latihan taktis intensif (TC)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Location address & Map */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold mb-3">Lokasi Kami</h2>
                <h3 className="font-display text-3xl font-bold tracking-tight text-white">
                  Dojo KKI DPL Center
                </h3>
              </div>

              <div className="m3-card-elevated p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-6">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-red-950/40 border border-red-900/20 text-red-500 rounded-lg shrink-0 mt-0.5 animate-pulse">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Alamat Lengkap</p>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Kompleks Olahraga DPL, Gedung Serbaguna Lt. 2, Jalan Raya Utama No. 45, Jakarta Selatan.
                    </p>
                  </div>
                </div>

                {/* Map Visual Area */}
                <div className="relative w-full h-[220px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600" 
                    className="w-full h-full object-cover opacity-20 grayscale"
                    alt="Map illustration"
                  />
                  <div className="absolute inset-0 bg-red-950/10 pointer-events-none" />
                  
                  {/* Marker Pin */}
                  <div className="absolute z-10 flex flex-col items-center">
                    <span className="w-8 h-8 rounded-full bg-red-600 border border-white flex items-center justify-center text-white shadow-xl animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <span className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 px-2 py-0.5 rounded shadow-lg mt-2 font-mono">
                      Dojo KKI DPL
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <a 
                    href="https://maps.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="apple-btn w-full py-3.5 text-center text-xs flex items-center justify-center gap-1.5"
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
      <section className="py-20 border-t border-zinc-900 bg-gradient-to-b from-zinc-950/20 to-red-950/10 text-center relative px-6">
        <div className="absolute inset-0 bg-red-900/[0.02] pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold">Mulai Perjalanan Karate Anda</h2>
          <h3 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Siap Melangkah Lebih Jauh dan Melampaui Batas?
          </h3>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-[60ch] mx-auto">
            Daftarkan diri Anda atau putra/putri Anda hari ini. Nikmati uji coba kelas gratis pertama di Dojo KKI DPL.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {profile ? (
              <Link href={`/${profile.role}`} className="apple-btn font-semibold px-8 py-3 text-sm flex items-center justify-center gap-2">
                Ke Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="/login" className="apple-btn font-semibold px-8 py-3 text-sm flex items-center justify-center gap-2">
                Daftar & Masuk Sistem <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a href="#jadwal" className="apple-btn-secondary font-medium px-8 py-3 text-sm">
              Hubungi Dojo
            </a>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-extrabold text-xs">
              KKI
            </span>
            <div className="text-left">
              <span className="font-display font-bold text-white text-xs block leading-none">Dojo KKI DPL</span>
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block mt-0.5">© 2026 KKI DPL Indonesia</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-zinc-500">
            <a href="#filosofi" className="hover:text-zinc-300 transition-colors">Filosofi</a>
            <a href="#program" className="hover:text-zinc-300 transition-colors">Program</a>
            <a href="#jadwal" className="hover:text-zinc-300 transition-colors">Jadwal & Lokasi</a>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Login Admin/Pelatih</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
