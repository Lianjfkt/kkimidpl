'use client';

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { OFFICIAL_BELTS } from '@/lib/constants/belts';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regData, setRegData] = useState({
    studentName: '',
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

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Konversi no HP ke format email internal yang digunakan Supabase Auth
  const resolveLoginIdentifier = (input: string): string => {
    const trimmed = input.trim();
    const isPhone = /^(\+62|62|0)\d{7,}$/.test(trimmed) || /^\d{8,}$/.test(trimmed);
    if (isPhone) {
      let digitsOnly = trimmed.replace(/\D/g, '');
      if (digitsOnly.startsWith('62')) {
        digitsOnly = '0' + digitsOnly.slice(2);
      }
      return `${digitsOnly}@kkidpl.com`;
    }
    return trimmed;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const loginId = resolveLoginIdentifier(email);
      const response = await signIn(loginId, password) as any;
      if (response && response.error) {
        setError(response.error.message);
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
      !regData.studentName ||
      !regData.dob ||
      !regData.birthPlace ||
      !regData.nik ||
      !regData.parentName ||
      !regData.parentPhone
    ) {
      setError('Mohon lengkapi semua kolom wajib (*)');
      setLoading(false);
      return;
    }

    if (regData.nik.length !== 16 || !/^\d+$/.test(regData.nik)) {
      setError('NIK harus berupa 16 digit angka.');
      setLoading(false);
      return;
    }

    try {
      const newReg = {
        id: `reg-${crypto.randomUUID().slice(0, 8)}`,
        full_name: regData.studentName,
        dob: regData.dob,
        birth_place: regData.birthPlace,
        nik: regData.nik,
        current_belt: regData.currentBelt,
        weight: regData.weight ? Number(regData.weight) : undefined,
        height: regData.height ? Number(regData.height) : undefined,
        parent_name: regData.parentName,
        parent_phone: regData.parentPhone,
        parent_job: regData.parentJob,
        address: regData.address,
        status: 'menunggu',
        submitted_at: new Date().toISOString(),
      };

      const response = await supabase.from('registrations').insert(newReg) as any;
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
            message: `${newReg.full_name} (Sabuk ${newReg.current_belt}) telah didaftarkan secara publik oleh ${regData.parentName}. Silakan review.`,
            type: 'umum',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } catch (notifErr) {
        console.warn('Gagal membuat notifikasi owner:', notifErr);
      }

      setSuccessMessage('Pendaftaran calon siswa baru berhasil dikirim dan menunggu verifikasi Pengurus Dojo.');
      setRegData({
        studentName: '',
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
      setView('login');
    } catch (err) {
      setError('Terjadi kesalahan saat mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const beltOptions = OFFICIAL_BELTS;

  const neuInputClass =
    'w-full pl-11 pr-4 py-3.5 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-sm text-[var(--md-sys-color-on-surface)] rounded-2xl placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 outline-none transition-all duration-200 focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--neu-surface)] shadow-[var(--neu-shadow-pressed-sm)] focus:shadow-[var(--neu-shadow-pressed)]';
  const labelClass = 'block text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider uppercase mb-1.5';
  const fieldWrap = 'flex flex-col relative';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--neu-bg)] text-[var(--md-sys-color-on-surface)] p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-black/40 blur-[120px] pointer-events-none" />
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-all duration-200"
          style={{
            backgroundColor: 'var(--neu-surface)',
            boxShadow: 'var(--neu-shadow-flat-sm)',
            border: '1px solid var(--neu-border)'
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-10">
        
        {/* Left Side: Editorial Brand Showcase Tile */}
        <div 
          className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full min-h-[540px] p-8 rounded-3xl border border-[var(--neu-border)] relative overflow-hidden"
          style={{
            backgroundColor: 'var(--neu-surface)',
            boxShadow: 'var(--neu-shadow-flat-lg)'
          }}
        >
          <div className="space-y-6">
            {/* Logo area */}
            <div className="flex items-center space-x-3.5">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm"
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
            </div>

            <div className="pt-6">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[var(--md-sys-color-primary)] border border-[var(--neu-border)] mb-4"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <Sparkles className="w-3 h-3" /> Sistem Terpadu Manajemen
              </div>
              <h2 className="text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight leading-snug">
                Portal Resmi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
                  Keluarga Dojo KKI
                </span>
              </h2>
              <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs md:text-sm mt-3 leading-relaxed">
                Akses terpusat untuk monitoring absensi latihan, iuran bulanan, riwayat ujian sabuk, jadwal turnamen, dan perkembangan atlet karate secara real-time.
              </p>
            </div>
          </div>

          {/* Quote Tile */}
          <div 
            className="p-5 rounded-2xl border border-[var(--neu-border)] space-y-2 mt-8"
            style={{
              backgroundColor: 'var(--neu-surface-low)',
              boxShadow: 'var(--neu-shadow-pressed-sm)'
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--md-sys-color-primary)]">
              <Shield className="w-4 h-4" /> Prinsip Karate-do
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic leading-relaxed">
              &quot;Karate ni sente nashi — Di dalam karate tidak ada inisiatif untuk menyerang lebih dahulu; karate adalah seni bertahan dan membentuk watak ksatria.&quot;
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="lg:col-span-7 w-full">
          <div 
            className="neu-card p-6 sm:p-10 rounded-3xl relative"
            style={{
              backgroundColor: 'var(--neu-surface)',
              boxShadow: 'var(--neu-shadow-flat-lg)'
            }}
          >
            {/* Neumorphic Segmented Tab Switcher (Masuk / Daftar) */}
            <div 
              className="flex p-1.5 rounded-full border border-[var(--neu-border)] mb-8"
              style={{
                backgroundColor: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed)'
              }}
            >
              <button
                type="button"
                onClick={() => { setView('login'); setError(null); }}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
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
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
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

            {/* Header Content */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                {view === 'login' ? 'Selamat Datang Kembali' : 'Pendaftaran Siswa Baru'}
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
                {view === 'login' 
                  ? 'Silakan masuk menggunakan kredensial akun Dojo Anda.' 
                  : 'Lengkapi formulir di bawah ini untuk mengajukan pendaftaran.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="mb-6 p-4 rounded-2xl text-xs text-red-400 flex items-start gap-2.5 animate-fade-in border border-red-500/30"
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
                className="mb-6 p-4 rounded-2xl text-xs text-emerald-400 flex items-start gap-2.5 animate-fade-in border border-emerald-500/30"
                style={{
                  backgroundColor: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)'
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* View Switching */}
            {view === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className={fieldWrap}>
                  <label htmlFor="email" className={labelClass}>Email / No. WhatsApp (Orang Tua)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input
                      id="email"
                      type="text"
                      required
                      className={neuInputClass}
                      placeholder="contoh: owner@dojo.com atau 08xxxx..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={fieldWrap}>
                  <label htmlFor="password" className={labelClass}>Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input
                      id="password"
                      type="password"
                      required
                      className={neuInputClass}
                      placeholder="Masukkan kata sandi Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || authLoading}
                  className="apple-btn w-full py-3.5 text-sm font-bold tracking-wide flex items-center justify-center gap-2"
                  style={{ opacity: (loading || authLoading) ? 0.7 : 1 }}
                >
                  {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                <div className="relative py-1 flex items-center justify-center">
                  <span 
                    className="text-[10px] font-mono tracking-widest uppercase text-[var(--md-sys-color-primary)] font-bold px-4 py-1.5 rounded-full border border-[var(--neu-border)]"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    Bagian 1: Data Calon Siswa
                  </span>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tempat Lahir *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="text" 
                        required 
                        className={neuInputClass} 
                        placeholder="Kota/Kabupaten"
                        value={regData.birthPlace} 
                        onChange={(e) => setRegData({ ...regData, birthPlace: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tanggal Lahir *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="date" 
                        required 
                        className={neuInputClass}
                        value={regData.dob} 
                        onChange={(e) => setRegData({ ...regData, dob: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                <div className={fieldWrap}>
                  <label className={labelClass}>NIK (NIK anak pada KK) *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <input 
                      type="text" 
                      required 
                      maxLength={16} 
                      className={neuInputClass} 
                      placeholder="16 Digit Angka NIK"
                      value={regData.nik} 
                      onChange={(e) => setRegData({ ...regData, nik: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Sabuk</label>
                    <select 
                      className="w-full px-3 py-3.5 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-xs text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none focus:border-[var(--md-sys-color-primary)] shadow-[var(--neu-shadow-pressed-sm)]" 
                      value={regData.currentBelt}
                      onChange={(e) => setRegData({ ...regData, currentBelt: e.target.value })}
                    >
                      {beltOptions.map((belt) => (
                        <option key={belt} value={belt} className="bg-[var(--neu-surface-high)]">{belt}</option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Berat (kg)</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-3.5 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-xs text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none focus:border-[var(--md-sys-color-primary)] shadow-[var(--neu-shadow-pressed-sm)]" 
                      placeholder="kg"
                      value={regData.weight} 
                      onChange={(e) => setRegData({ ...regData, weight: e.target.value })} 
                    />
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tinggi (cm)</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-3.5 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] text-xs text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none focus:border-[var(--md-sys-color-primary)] shadow-[var(--neu-shadow-pressed-sm)]" 
                      placeholder="cm"
                      value={regData.height} 
                      onChange={(e) => setRegData({ ...regData, height: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="relative py-2 flex items-center justify-center">
                  <span 
                    className="text-[10px] font-mono tracking-widest uppercase text-[var(--md-sys-color-primary)] font-bold px-4 py-1.5 rounded-full border border-[var(--neu-border)]"
                    style={{
                      backgroundColor: 'var(--neu-surface-low)',
                      boxShadow: 'var(--neu-shadow-pressed-sm)'
                    }}
                  >
                    Bagian 2: Data Orang Tua / Wali
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Nama Orang Tua *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="text" 
                        required 
                        className={neuInputClass} 
                        placeholder="Nama Ayah/Ibu"
                        value={regData.parentName} 
                        onChange={(e) => setRegData({ ...regData, parentName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>WhatsApp *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="tel" 
                        required 
                        className={neuInputClass} 
                        placeholder="0812xxxx"
                        value={regData.parentPhone} 
                        onChange={(e) => setRegData({ ...regData, parentPhone: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Pekerjaan</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input 
                        type="text" 
                        className={neuInputClass} 
                        placeholder="Pekerjaan"
                        value={regData.parentJob} 
                        onChange={(e) => setRegData({ ...regData, parentJob: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                <div className={fieldWrap}>
                  <label className={labelClass}>Alamat Tempat Tinggal</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                    <textarea 
                      rows={2} 
                      className="w-full pl-11 pr-4 py-3 bg-[var(--neu-surface-low)] border border-[var(--neu-border)] focus:border-[var(--md-sys-color-primary)] text-sm text-[var(--md-sys-color-on-surface)] rounded-2xl outline-none resize-none transition-all duration-200 shadow-[var(--neu-shadow-pressed-sm)] focus:shadow-[var(--neu-shadow-pressed)]" 
                      placeholder="Alamat lengkap tempat tinggal..."
                      value={regData.address} 
                      onChange={(e) => setRegData({ ...regData, address: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-3">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(null); }}
                    className="apple-btn-secondary flex-1 py-3.5 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="apple-btn flex-1 py-3.5 text-xs font-bold"
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
