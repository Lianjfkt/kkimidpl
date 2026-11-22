'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Info,
  HelpCircle,
  X,
  Clock,
  Check,
  Award,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { OFFICIAL_BELTS, getBeltHex } from '@/lib/constants/belts';
import { normalizePhoneToAuthEmail, isPhoneNumber, normalizePhoneDigits } from '@/lib/authUtils';

function getKarateAgeCategory(dobString: string): { age: number; category: string } | null {
  if (!dobString) return null;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 0 || age > 100) return null;

  let category = 'Usia Dini';
  if (age < 6) category = 'Pra-Usia Dini (<6 Th)';
  else if (age <= 9) category = 'Usia Dini (6-9 Th)';
  else if (age <= 11) category = 'Pra-Pemula (10-11 Th)';
  else if (age <= 13) category = 'Pemula (12-13 Th)';
  else if (age <= 15) category = 'Kadet (14-15 Th)';
  else if (age <= 17) category = 'Junior (16-17 Th)';
  else category = 'Senior / Dewasa (18+ Th)';

  return { age, category };
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [view, setView] = useState<'login' | 'register' | 'registered_success'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginRoleTip, setLoginRoleTip] = useState<'ortu' | 'admin'>('ortu');
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [regData, setRegData] = useState({
    studentName: '',
    gender: 'Laki-laki',
    dob: '',
    birthPlace: '',
    nik: '',
    currentBelt: 'Putih',
    weight: '',
    height: '',
    parentName: '',
    parentPhone: '',
    parentJob: '',
    address: '',
  });

  const [submittedRegSummary, setSubmittedRegSummary] = useState<{
    id: string;
    studentName: string;
    gender: string;
    dob: string;
    currentBelt: string;
    parentName: string;
    parentPhone: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const ageCategoryInfo = useMemo(() => {
    return getKarateAgeCategory(regData.dob);
  }, [regData.dob]);

  // Konversi no HP ke format email internal yang digunakan Supabase Auth
  const resolveLoginIdentifier = (input: string): string => {
    return normalizePhoneToAuthEmail(input);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const loginId = resolveLoginIdentifier(email);
      let response = await signIn(loginId, password) as any;

      // Fallback: Jika gagal dan input terdeteksi nomor telepon, coba variasi normalisasi password angka (cth: 821... -> 0821...)
      if (response && response.error && isPhoneNumber(email)) {
        const altPassword = normalizePhoneDigits(password);
        if (altPassword && altPassword !== password) {
          const retryRes = await signIn(loginId, altPassword) as any;
          if (!retryRes?.error) {
            response = retryRes;
          }
        }
      }

      if (response && response.error) {
        if (isPhoneNumber(email)) {
          setError(
            'Nomor WhatsApp atau kata sandi tidak cocok. Pastikan nomor HP Anda sudah didaftarkan dan disetujui pengurus dojo. (Kata sandi default akun orang tua adalah nomor HP yang sama).'
          );
        } else {
          setError(response.error.message || 'Kredensial login tidak valid.');
        }
        setLoading(false);
      } else {
        const role = response.role;
        const targetRoute = role === 'owner' ? '/owner' : role === 'pelatih' ? '/pelatih' : role === 'ortu' ? '/ortu' : '/owner';
        router.push(targetRoute);
      }
    } catch {
      setError('Terjadi kesalahan saat masuk. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (
      !regData.studentName.trim() ||
      !regData.dob ||
      !regData.birthPlace.trim() ||
      !regData.nik.trim() ||
      !regData.parentName.trim() ||
      !regData.parentPhone.trim()
    ) {
      setError('Mohon lengkapi semua kolom wajib bertanda bintang (*)');
      setLoading(false);
      return;
    }

    if (regData.nik.length !== 16 || !/^\d+$/.test(regData.nik)) {
      setError('NIK harus berupa 16 digit angka (sesuai Kartu Keluarga / KIA).');
      setLoading(false);
      return;
    }

    try {
      const newReg = {
        id: `reg-${crypto.randomUUID().slice(0, 8)}`,
        full_name: regData.studentName.trim(),
        dob: regData.dob,
        gender: regData.gender,
        birth_place: regData.birthPlace.trim(),
        nik: regData.nik.trim(),
        current_belt: regData.currentBelt,
        weight: regData.weight ? Number(regData.weight) : undefined,
        height: regData.height ? Number(regData.height) : undefined,
        parent_name: regData.parentName.trim(),
        parent_phone: regData.parentPhone.trim(),
        parent_job: regData.parentJob.trim(),
        address: regData.address.trim(),
        status: 'menunggu',
        submitted_at: new Date().toISOString(),
      };

      // Resilient insert: coba dengan kolom gender, jika remote schema belum ter-migrate, fallback otomatis
      let response = await supabase.from('registrations').insert(newReg) as any;
      if (response && response.error && response.error.message?.includes('gender')) {
        const { gender, ...fallbackReg } = newReg;
        response = await supabase.from('registrations').insert(fallbackReg) as any;
      }

      if (response && response.error) {
        setError(response.error.message);
        setLoading(false);
        return;
      }

      // Notifikasi dikirimkan ke semua akun Owner asli di database
      try {
        const { data: owners } = await supabase.from('profiles').eq('role', 'owner').select('id');
        const ownerIds = (owners && owners.length > 0) ? owners.map((o: any) => o.id) : ['user-owner-id'];

        for (const ownerId of ownerIds) {
          await supabase.from('notifications').insert({
            id: `notif-reg-${newReg.id}-${String(ownerId).slice(0, 8)}`,
            user_id: ownerId,
            title: 'Pendaftaran Baru',
            message: `${newReg.full_name} (${newReg.gender}, Sabuk ${newReg.current_belt}) telah didaftarkan secara publik oleh ${regData.parentName}. Silakan review di menu Pendaftaran.`,
            type: 'umum',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } catch (notifErr) {
        console.warn('Gagal membuat notifikasi owner:', notifErr);
      }

      setSubmittedRegSummary({
        id: newReg.id,
        studentName: regData.studentName,
        gender: regData.gender,
        dob: regData.dob,
        currentBelt: regData.currentBelt,
        parentName: regData.parentName,
        parentPhone: regData.parentPhone,
      });

      // Reset form
      setRegData({
        studentName: '',
        gender: 'Laki-laki',
        dob: '',
        birthPlace: '',
        nik: '',
        currentBelt: 'Putih',
        weight: '',
        height: '',
        parentName: '',
        parentPhone: '',
        parentJob: '',
        address: '',
      });

      setView('registered_success');
    } catch {
      setError('Terjadi kesalahan saat mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const beltOptions = OFFICIAL_BELTS;

  const neuInputClass =
    'w-full pl-11 pr-4 py-3 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-sm text-[var(--md-sys-color-on-surface)] rounded-2xl placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 outline-none transition-all duration-200 focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--neu-surface)] shadow-[var(--neu-shadow-pressed-sm)] focus:shadow-[var(--neu-shadow-pressed)]';
  const labelClass = 'block text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider uppercase mb-1.5';
  const fieldWrap = 'flex flex-col relative';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--neu-bg)] text-[var(--md-sys-color-on-surface)] p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-black/40 blur-[120px] pointer-events-none" />
      
      {/* Top Action Bar */}
      <div className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between pointer-events-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-all duration-200 cursor-pointer"
          style={{
            backgroundColor: 'var(--neu-surface)',
            boxShadow: 'var(--neu-shadow-flat-sm)',
            border: '1px solid var(--neu-border)'
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Beranda
        </Link>

        <button
          type="button"
          onClick={() => setHelpModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-all duration-200 cursor-pointer"
          style={{
            backgroundColor: 'var(--neu-surface)',
            boxShadow: 'var(--neu-shadow-flat-sm)',
            border: '1px solid var(--neu-border)'
          }}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Bantuan Masuk</span>
        </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-12">
        
        {/* Left Side: Editorial Brand Showcase Tile */}
        <div 
          className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full min-h-[580px] p-8 rounded-3xl border border-[var(--neu-border)] relative overflow-hidden"
          style={{
            backgroundColor: 'var(--neu-surface)',
            boxShadow: 'var(--neu-shadow-flat-lg)'
          }}
        >
          <div className="space-y-6">
            {/* Logo area */}
            <div className="flex items-center space-x-3.5">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm transition-transform duration-200 hover:scale-105"
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
                  Kushin Ryu Karate-do Indonesia
                </span>
              </div>
            </div>

            <div className="pt-4">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[var(--md-sys-color-primary)] border border-[var(--neu-border)] mb-4"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <Sparkles className="w-3 h-3" /> Sistem Terpadu Manajemen Dojo
              </div>
              <h2 className="text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight leading-snug">
                Portal Terpadu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
                  Dojo KKI DPL
                </span>
              </h2>
              <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs md:text-sm mt-3 leading-relaxed">
                Akses terpusat untuk monitoring absensi latihan, status iuran bulanan, rapor evaluasi fisik atlet, riwayat ujian sabuk, dan kalender kegiatan karate.
              </p>
            </div>
          </div>

          {/* Dojo Highlights */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-red-500/10 text-[var(--md-sys-color-primary)]">
                <Check className="w-3 h-3" />
              </div>
              <span>Rapor Kebugaran Fisik 7 Indikator Berkala</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-red-500/10 text-[var(--md-sys-color-primary)]">
                <Check className="w-3 h-3" />
              </div>
              <span>Transparansi Iuran & Rekapitulasi Digital</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-red-500/10 text-[var(--md-sys-color-primary)]">
                <Check className="w-3 h-3" />
              </div>
              <span>Sertifikasi Standar Resmi KKI Pusat & FORKI</span>
            </div>
          </div>

          {/* Quote Tile */}
          <div 
            className="p-4 rounded-2xl border border-[var(--neu-border)] space-y-1.5 mt-6"
            style={{
              backgroundColor: 'var(--neu-surface-low)',
              boxShadow: 'var(--neu-shadow-pressed-sm)'
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--md-sys-color-primary)]">
              <Shield className="w-3.5 h-3.5" /> Prinsip Karate-do
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic leading-relaxed">
              &quot;Karate ni sente nashi — Di dalam karate tidak ada inisiatif untuk menyerang lebih dahulu; karate adalah seni bertahan dan membentuk watak ksatria.&quot;
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="lg:col-span-7 w-full">
          
          {/* Mobile Header Branding (Only on small screens) */}
          <div className="lg:hidden flex flex-col items-center justify-center text-center mb-6">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base mb-2.5 shadow-lg"
              style={{
                background: 'var(--neu-accent-grad)',
                boxShadow: 'var(--neu-shadow-accent)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              KKI
            </div>
            <h1 className="font-display font-extrabold text-xl text-[var(--md-sys-color-on-surface)] tracking-tight">
              Dojo KKI DPL
            </h1>
            <p className="text-[11px] text-[var(--md-sys-color-primary)] font-semibold uppercase tracking-wider mt-0.5">
              Kushin Ryu Karate-do Indonesia
            </p>
          </div>

          <div 
            className="neu-card p-5 sm:p-8 rounded-3xl relative"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat-lg)'
            }}
          >
            {/* Neumorphic Segmented Tab Switcher (Masuk / Daftar) */}
            {view !== 'registered_success' && (
              <div 
                className="flex p-1.5 rounded-2xl border border-[var(--neu-border)] mb-6"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed)'
                }}
              >
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    view === 'login'
                      ? 'text-white'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                  style={
                    view === 'login'
                      ? {
                          background: 'var(--neu-accent-grad)',
                          boxShadow: 'var(--neu-shadow-accent)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }
                      : { background: 'transparent' }
                  }
                >
                  Masuk Sistem
                </button>
                <button
                  type="button"
                  onClick={() => { setView('register'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    view === 'register'
                      ? 'text-white'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                  style={
                    view === 'register'
                      ? {
                          background: 'var(--neu-accent-grad)',
                          boxShadow: 'var(--neu-shadow-accent)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }
                      : { background: 'transparent' }
                  }
                >
                  Daftar Calon Siswa
                </button>
              </div>
            )}

            {/* Header Content */}
            {view !== 'registered_success' && (
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  {view === 'login' ? 'Selamat Datang Kembali' : 'Formulir Pendaftaran Siswa Baru'}
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  {view === 'login' 
                    ? 'Silakan masuk menggunakan kredensial akun Dojo Anda.' 
                    : 'Lengkapi formulir di bawah ini untuk mengajukan pendaftaran latihan karate.'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div 
                className="mb-5 p-4 rounded-2xl text-xs text-red-400 flex items-start gap-2.5 animate-fade-in border border-red-500/30"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div 
                className="mb-5 p-4 rounded-2xl text-xs text-emerald-400 flex items-start gap-2.5 animate-fade-in border border-emerald-500/30"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* ─── 1. VIEW: LOGIN ────────────────────────────────────────── */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Segmented Guide for Roles */}
                <div 
                  className="p-3.5 rounded-2xl border border-[var(--neu-border)] space-y-2 transition-all"
                  style={{
                    backgroundColor: 'var(--neu-surface-low)',
                    boxShadow: 'var(--neu-shadow-pressed-sm)',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      Petunjuk Masuk Akun
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setLoginRoleTip('ortu')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          loginRoleTip === 'ortu'
                            ? 'bg-[var(--md-sys-color-primary)] text-white'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
                        }`}
                      >
                        Orang Tua
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginRoleTip('admin')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          loginRoleTip === 'admin'
                            ? 'bg-[var(--md-sys-color-primary)] text-white'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
                        }`}
                      >
                        Pelatih / Pengurus
                      </button>
                    </div>
                  </div>

                  {loginRoleTip === 'ortu' ? (
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed space-y-0.5">
                      <p>• <strong>ID Pengguna:</strong> No. WhatsApp terdaftar (contoh: <code className="text-white bg-black/30 px-1 py-0.5 rounded">081234567890</code>)</p>
                      <p>• <strong>Kata Sandi Default:</strong> Nomor WhatsApp yang sama dengan ID pengguna Anda.</p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed space-y-0.5">
                      <p>• <strong>ID Pengguna:</strong> Alamat email resmi dojo Anda (contoh: <code className="text-white bg-black/30 px-1 py-0.5 rounded">owner@dojo.com</code>)</p>
                      <p>• <strong>Kata Sandi:</strong> Kata sandi khusus yang telah didaftarkan.</p>
                    </div>
                  )}
                </div>

                <div className={fieldWrap}>
                  <label htmlFor="email" className={labelClass}>
                    {loginRoleTip === 'ortu' ? 'Nomor WhatsApp Orang Tua' : 'Email / Akun Terdaftar'} *
                  </label>
                  <div className="relative">
                    {loginRoleTip === 'ortu' ? (
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    ) : (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    )}
                    <input
                      id="email"
                      name="username"
                      type={loginRoleTip === 'ortu' ? 'tel' : 'text'}
                      autoComplete="username"
                      inputMode={loginRoleTip === 'ortu' ? 'tel' : 'email'}
                      required
                      className={neuInputClass}
                      placeholder={loginRoleTip === 'ortu' ? '0812xxxx atau nomor WhatsApp Anda' : 'owner@dojo.com atau pelatih@dojo.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={fieldWrap}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className={labelClass}>Kata Sandi *</label>
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(true)}
                      className="text-[10px] text-[var(--md-sys-color-primary)] font-semibold hover:underline cursor-pointer"
                    >
                      Lupa sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className={`${neuInputClass} pr-11`}
                      placeholder={loginRoleTip === 'ortu' ? 'Kata sandi (default: nomor WhatsApp)' : 'Masukkan kata sandi'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || authLoading}
                  className="apple-btn w-full py-3.5 text-sm font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer mt-2"
                  style={{ opacity: (loading || authLoading) ? 0.75 : 1 }}
                >
                  {loading || authLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Kredensial...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </form>
            )}

            {/* ─── 2. VIEW: REGISTRATION ─────────────────────────────────── */}
            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Section Header 1 */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--md-sys-color-primary)]">
                    Bagian 1: Identitas Calon Siswa
                  </span>
                  <div className="flex-1 h-px bg-[var(--neu-border)]" />
                </div>

                {/* Nama Lengkap */}
                <div className={fieldWrap}>
                  <label className={labelClass}>Nama Calon Siswa *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input 
                      type="text" 
                      required 
                      className={neuInputClass} 
                      placeholder="Nama Lengkap Calon Siswa"
                      value={regData.studentName} 
                      onChange={(e) => setRegData({ ...regData, studentName: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Jenis Kelamin */}
                <div className={fieldWrap}>
                  <label className={labelClass}>Jenis Kelamin *</label>
                  <div 
                    className="grid grid-cols-2 p-1 rounded-2xl border border-[var(--neu-border)] bg-[var(--neu-surface-low)]"
                    style={{ boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setRegData({ ...regData, gender: 'Laki-laki' })}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        regData.gender === 'Laki-laki'
                          ? 'text-white'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
                      }`}
                      style={
                        regData.gender === 'Laki-laki'
                          ? {
                              background: 'var(--neu-accent-grad)',
                              boxShadow: 'var(--neu-shadow-accent)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }
                          : { background: 'transparent' }
                      }
                    >
                      Putra (Laki-laki)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegData({ ...regData, gender: 'Perempuan' })}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        regData.gender === 'Perempuan'
                          ? 'text-white'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-white'
                      }`}
                      style={
                        regData.gender === 'Perempuan'
                          ? {
                              background: 'var(--neu-accent-grad)',
                              boxShadow: 'var(--neu-shadow-accent)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }
                          : { background: 'transparent' }
                      }
                    >
                      Putri (Perempuan)
                    </button>
                  </div>
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tempat Lahir *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="text" 
                        required 
                        className={neuInputClass} 
                        placeholder="Kota/Kabupaten Lahir"
                        value={regData.birthPlace} 
                        onChange={(e) => setRegData({ ...regData, birthPlace: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelClass}>Tanggal Lahir *</label>
                      {ageCategoryInfo && (
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-primary)]">
                          {ageCategoryInfo.category}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="date" 
                        required 
                        max={todayStr}
                        className={neuInputClass}
                        value={regData.dob} 
                        onChange={(e) => setRegData({ ...regData, dob: e.target.value })} 
                      />
                    </div>
                    {ageCategoryInfo && (
                      <p className="text-[10px] text-emerald-400 mt-1 pl-1">
                        ✓ Usia terhitung: <strong>{ageCategoryInfo.age} Tahun</strong> ({ageCategoryInfo.category})
                      </p>
                    )}
                  </div>
                </div>

                {/* NIK */}
                <div className={fieldWrap}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass}>NIK Calon Siswa (16 Digit) *</label>
                    <span className={`text-[10px] font-mono font-bold ${
                      regData.nik.length === 16 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {regData.nik.length === 16 ? '✓ 16/16 Digit Lengkap' : `${regData.nik.length}/16 Digit`}
                    </span>
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input 
                      type="text" 
                      inputMode="numeric"
                      required 
                      maxLength={16} 
                      className={neuInputClass} 
                      placeholder="16 Digit NIK sesuai Kartu Keluarga / KIA"
                      value={regData.nik} 
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setRegData({ ...regData, nik: digits });
                      }} 
                    />
                  </div>
                </div>

                {/* Sabuk, Berat, Tinggi (Responsive Layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tingkat Sabuk Saat Ini</label>
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <select 
                        className={`${neuInputClass} appearance-none cursor-pointer pr-10`} 
                        value={regData.currentBelt}
                        onChange={(e) => setRegData({ ...regData, currentBelt: e.target.value })}
                      >
                        {beltOptions.map((belt) => (
                          <option key={belt} value={belt} className="bg-[var(--neu-surface-high)] text-white">
                            Sabuk {belt} {belt === 'Putih' ? '(Pemula Baru)' : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: getBeltHex(regData.currentBelt) }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={fieldWrap}>
                      <label className={labelClass}>Berat Badan</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          inputMode="decimal"
                          min="10"
                          max="250"
                          className="w-full pl-4 pr-10 py-3 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-sm text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none focus:border-[var(--md-sys-color-primary)] shadow-[var(--neu-shadow-pressed-sm)]" 
                          placeholder="45"
                          value={regData.weight} 
                          onChange={(e) => setRegData({ ...regData, weight: e.target.value })} 
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] pointer-events-none">
                          kg
                        </span>
                      </div>
                    </div>

                    <div className={fieldWrap}>
                      <label className={labelClass}>Tinggi Badan</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          inputMode="decimal"
                          min="30"
                          max="250"
                          className="w-full pl-4 pr-10 py-3 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-sm text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none focus:border-[var(--md-sys-color-primary)] shadow-[var(--neu-shadow-pressed-sm)]" 
                          placeholder="150"
                          value={regData.height} 
                          onChange={(e) => setRegData({ ...regData, height: e.target.value })} 
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] pointer-events-none">
                          cm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Header 2 */}
                <div className="flex items-center gap-2 pt-3 pb-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--md-sys-color-primary)]">
                    Bagian 2: Kontak & Data Orang Tua / Wali
                  </span>
                  <div className="flex-1 h-px bg-[var(--neu-border)]" />
                </div>

                {/* Nama Orang Tua & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Nama Orang Tua / Wali *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="text" 
                        required 
                        className={neuInputClass} 
                        placeholder="Nama Ayah atau Ibu"
                        value={regData.parentName} 
                        onChange={(e) => setRegData({ ...regData, parentName: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className={fieldWrap}>
                    <label className={labelClass}>No. WhatsApp Orang Tua *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="tel" 
                        inputMode="tel"
                        required 
                        className={neuInputClass} 
                        placeholder="081234567890"
                        value={regData.parentPhone} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d+]/g, '');
                          setRegData({ ...regData, parentPhone: val });
                        }} 
                      />
                    </div>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 pl-1">
                      Nomor ini akan digunakan sebagai akun login Anda setelah disetujui.
                    </p>
                  </div>
                </div>

                {/* Pekerjaan */}
                <div className={fieldWrap}>
                  <label className={labelClass}>Pekerjaan Orang Tua / Wali</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input 
                      type="text" 
                      className={neuInputClass} 
                      placeholder="contoh: Karyawan Swasta, PNS, Wiraswasta"
                      value={regData.parentJob} 
                      onChange={(e) => setRegData({ ...regData, parentJob: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div className={fieldWrap}>
                  <label className={labelClass}>Alamat Tempat Tinggal</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <textarea 
                      rows={2} 
                      className="w-full pl-11 pr-4 py-3 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] focus:border-[var(--md-sys-color-primary)] text-sm text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none resize-none transition-all duration-200 shadow-[var(--neu-shadow-pressed-sm)] focus:shadow-[var(--neu-shadow-pressed)]" 
                      placeholder="Alamat domisili lengkap..."
                      value={regData.address} 
                      onChange={(e) => setRegData({ ...regData, address: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(null); }}
                    className="apple-btn-secondary flex-1 py-3.5 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="apple-btn flex-2 py-3.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    style={{ opacity: loading ? 0.75 : 1 }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mengirim Pendaftaran...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Kirim Pendaftaran Siswa</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ─── 3. VIEW: REGISTERED SUCCESS SCREEN (UX CONFIRMATION) ─── */}
            {view === 'registered_success' && submittedRegSummary && (
              <div className="space-y-6 animate-fade-in py-2">
                
                {/* Header Icon */}
                <div className="text-center space-y-2">
                  <div 
                    className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-emerald-400 border border-emerald-500/20"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      boxShadow: 'var(--neu-shadow-flat-sm)'
                    }}
                  >
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
                    Pendaftaran Berhasil Dikirim!
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-md mx-auto leading-relaxed">
                    Data calon siswa telah tersimpan di sistem Dojo KKI DPL dan sedang dalam proses verifikasi pengurus dojo.
                  </p>
                </div>

                {/* Data Summary Card */}
                <div 
                  className="p-4 rounded-2xl border border-[var(--neu-border)] space-y-3"
                  style={{
                    backgroundColor: 'var(--neu-surface-low)',
                    boxShadow: 'var(--neu-shadow-pressed-sm)'
                  }}
                >
                  <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                      Ringkasan Pengajuan
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ID: {submittedRegSummary.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Calon Siswa</p>
                      <p className="font-bold text-[var(--md-sys-color-on-surface)] truncate">{submittedRegSummary.studentName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Jenis Kelamin</p>
                      <p className="font-bold text-[var(--md-sys-color-on-surface)]">{submittedRegSummary.gender}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Sabuk Awal</p>
                      <p className="font-bold text-[var(--md-sys-color-on-surface)]">Sabuk {submittedRegSummary.currentBelt}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">No. WhatsApp Ortu</p>
                      <p className="font-bold text-[var(--md-sys-color-on-surface)]">{submittedRegSummary.parentPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline / Next Steps */}
                <div 
                  className="p-4 rounded-2xl border border-[var(--neu-border)] space-y-2.5"
                  style={{
                    backgroundColor: 'var(--neu-surface-high)',
                    boxShadow: 'var(--neu-shadow-flat-sm)'
                  }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Alur Verifikasi & Aktivasi Akun
                  </span>

                  <div className="space-y-2 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <p><strong>1. Formulir Diterima:</strong> Data telah masuk ke antrean verifikasi pengurus dojo.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold">2</span>
                      </div>
                      <p><strong>2. Peninjauan Pengurus:</strong> Admin akan memvalidasi data dan menentukan pembagian kelas (proses ~1x24 jam).</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold">3</span>
                      </div>
                      <p><strong>3. Aktivasi Login:</strong> Setelah disetujui, akun orang tua akan otomatis aktif dan Anda dapat masuk menggunakan nomor WhatsApp Anda.</p>
                    </div>
                  </div>
                </div>

                {/* Important Notice preventing premature login frustration */}
                <div 
                  className="p-3.5 rounded-2xl border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <strong>Penting:</strong> Akun Anda baru dapat digunakan untuk login setelah disetujui oleh pengurus dojo. Jika Anda mencoba login sebelum disetujui, sistem akan menolak akses.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href="/"
                    className="apple-btn-secondary flex-1 py-3 text-xs font-bold text-center cursor-pointer"
                  >
                    Kembali ke Beranda
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setSuccessMessage(null);
                      setError(null);
                    }}
                    className="apple-btn flex-1 py-3 text-xs font-bold text-center cursor-pointer"
                  >
                    Ke Halaman Masuk
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ─── 4. MODAL: BANTUAN MASUK / LUPA SANDI ──────────────────────────── */}
      {helpModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setHelpModalOpen(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl p-6 border border-[var(--neu-border)] space-y-4"
            style={{
              backgroundColor: 'var(--neu-surface-high)',
              boxShadow: 'var(--neu-shadow-flat-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  Bantuan Masuk & Lupa Kata Sandi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-[var(--neu-surface)] border border-[var(--neu-border)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              <div 
                className="p-3.5 rounded-2xl border border-[var(--neu-border)]"
                style={{ backgroundColor: 'var(--neu-surface-low)' }}
              >
                <p className="font-bold text-white mb-1">Akun Orang Tua / Wali Siswa:</p>
                <p>• ID Pengguna Anda adalah nomor WhatsApp yang terdaftar pada data siswa dojo.</p>
                <p>• Kata sandi default adalah <strong>nomor WhatsApp yang sama</strong>.</p>
                <p>• Jika Anda pernah mengganti kata sandi dan lupa, silakan hubungi pengurus dojo untuk mereset ke nomor WhatsApp semula.</p>
              </div>

              <div 
                className="p-3.5 rounded-2xl border border-[var(--neu-border)]"
                style={{ backgroundColor: 'var(--neu-surface-low)' }}
              >
                <p className="font-bold text-white mb-1">Akun Pelatih & Pengurus:</p>
                <p>• Gunakan email resmi dojo yang telah didaftarkan oleh Administrator.</p>
                <p>• Jika lupa kata sandi akun pelatih/pengurus, hubungi Pengurus Utama untuk pembaruan kata sandi.</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Pengurus%20Dojo%20KKI%20DPL,%20saya%20butuh%20bantuan%20terkait%20login%20akun%20dojo."
                target="_blank"
                rel="noopener noreferrer"
                className="apple-btn w-full py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Pengurus Dojo via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
