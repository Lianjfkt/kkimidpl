'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  Award, 
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
  ChevronRight
} from 'lucide-react';

export default function LoginPage() {
  const { signIn, loading: authLoading } = useAuth();
  const router = useRouter();

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
    address: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await signIn(email, password) as any;
      if (response && response.error) {
        setError(response.error.message);
        setLoading(false);
      } else {
        const role = response.role;
        if (role === 'owner') {
          window.location.href = '/owner';
        } else if (role === 'pelatih') {
          window.location.href = '/pelatih';
        } else if (role === 'ortu') {
          window.location.href = '/ortu';
        } else {
          window.location.href = '/owner'; // fallback
        }
      }
    } catch (err) {
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

      await supabase.from('notifications').insert({
        id: `notif-reg-${newReg.id}`,
        user_id: 'user-owner-id',
        title: 'Pendaftaran Baru',
        message: `${newReg.full_name} (Sabuk ${newReg.current_belt}) telah didaftarkan secara publik oleh ${regData.parentName}. Silakan review.`,
        type: 'umum',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      setSuccessMessage('Pendaftaran calon siswa baru berhasil dikirim dan menunggu persetujuan Owner dojo.');
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
        address: '',
      });
      setView('login');
    } catch (err) {
      setError('Terjadi kesalahan saat mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setView('login');
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log('[QuickLogin] Trying:', roleEmail);
      const response = await signIn(roleEmail, rolePass) as any;
      console.log('[QuickLogin] Response:', JSON.stringify(response));

      if (response && response.error) {
        const msg = response.error.message || response.error.toString();
        console.error('[QuickLogin] Error:', msg);
        setError(`Login gagal: ${msg}`);
        setLoading(false);
      } else {
        const role = response.role;
        console.log('[QuickLogin] Role:', role);
        if (role === 'owner') {
          window.location.href = '/owner';
        } else if (role === 'pelatih') {
          window.location.href = '/pelatih';
        } else if (role === 'ortu') {
          window.location.href = '/ortu';
        } else {
          console.warn('[QuickLogin] Role null, redirecting to /owner as fallback');
          window.location.href = '/owner';
        }
      }
    } catch (err: any) {
      console.error('[QuickLogin] Exception:', err);
      setError(`Terjadi kesalahan: ${err?.message || err}`);
      setLoading(false);
    }
  };

  const beltOptions = ['Putih', 'Kuning', 'Hijau', 'Biru Muda', 'Biru Tua', 'Coklat Muda', 'Coklat Tua', 'Hitam'];

  const inputClass =
    'w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white rounded-xl placeholder:text-zinc-600 outline-none transition-all duration-200';
  const labelClass = 'block text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1.5';
  const fieldWrap = 'flex flex-col relative';

  const demoAccounts = [
    { label: 'Owner', email: 'owner@dojo.com', pass: 'owner123', icon: <Shield className="w-4 h-4 text-red-500" /> },
    { label: 'Pelatih', email: 'pelatih@dojo.com', pass: 'pelatih123', icon: <Award className="w-4 h-4 text-red-500" /> },
    { label: 'Orang Tua', email: 'ortu@dojo.com', pass: 'ortu123', icon: <Users className="w-4 h-4 text-red-500" /> },
  ];

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0f0a09] text-zinc-100 p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-zinc-800/15 blur-[100px] pointer-events-none" />
      
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Awal
        </Link>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-8">
        
        {/* Left Side: Editorial Brand Showcase (Hidden on smaller viewports / beautiful on desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full min-h-[500px] p-8 rounded-3xl bg-zinc-950/60 border border-zinc-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 to-transparent pointer-events-none" />
          
          <div className="space-y-6">
            {/* Logo area */}
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                KKI
              </span>
              <div className="flex flex-col">
                <span className="font-display font-bold tracking-tight text-white leading-none text-sm">Dojo KKI DPL</span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Kushin Ryu Indonesia</span>
              </div>
            </div>

            <div className="pt-8">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
                Sistem Layanan <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Terpadu Dojo</span>
              </h2>
              <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                Kelola administrasi, iuran bulanan, absensi kehadiran siswa, penjadwalan ujian kenaikan sabuk, hingga pemantauan statistik atlet berprestasi.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-900">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Akses Cepat Akun Demo</p>
            <div className="flex flex-col gap-2.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => handleQuickLogin(account.email, account.pass)}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-900/30 hover:bg-red-950/25 border border-zinc-800/80 hover:border-red-900/40 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-red-900/20">
                      {account.icon}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white leading-none">{account.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{account.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Forms (Login / Registration) */}
        <div className="lg:col-span-7 w-full">
          <div className="apple-card p-6 sm:p-10 bg-zinc-950/40 backdrop-blur-xl border border-zinc-900 rounded-3xl shadow-2xl relative">
            
            {/* Header Content */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {view === 'login' ? 'Selamat Datang Kembali' : 'Pendaftaran Calon Siswa'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5">
                {view === 'login' 
                  ? 'Silakan masuk menggunakan kredensial akun Dojo Anda.' 
                  : 'Lengkapi formulir pendaftaran untuk mengajukan keanggotaan baru.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/30 text-xs text-red-400 flex items-start gap-2.5 animate-m3-page-enter">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/30 text-xs text-emerald-400 flex items-start gap-2.5 animate-m3-page-enter">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* View Switching */}
            {view === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className={fieldWrap}>
                  <label htmlFor="email" className={labelClass}>Email / No. WhatsApp Wali</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      id="email"
                      type="text"
                      required
                      className={inputClass}
                      placeholder="contoh: owner@dojo.com atau 08xxxx..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={fieldWrap}>
                  <label htmlFor="password" className={labelClass}>Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      id="password"
                      type="password"
                      required
                      className={inputClass}
                      placeholder="Kata Sandi Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || authLoading}
                  className="apple-btn w-full py-3 text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(239,68,68,0.2)]"
                  style={{ opacity: (loading || authLoading) ? 0.7 : 1 }}
                >
                  {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'} <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick login demo (Visible only on mobile/tablets where left-side panel is hidden) */}
                <div className="lg:hidden pt-4 border-t border-zinc-900 mt-6 space-y-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Akses Cepat Akun Demo</p>
                  <div className="grid grid-cols-3 gap-2">
                    {demoAccounts.map((account) => (
                      <button
                        key={account.label}
                        type="button"
                        onClick={() => handleQuickLogin(account.email, account.pass)}
                        className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-zinc-900/30 hover:bg-red-950/20 border border-zinc-800 text-center transition-all duration-200"
                      >
                        {account.icon}
                        <span className="text-[10px] font-semibold text-white mt-1.5">{account.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setView('register'); setError(null); }}
                    className="text-xs text-zinc-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-1 font-semibold"
                  >
                    Belum punya akun? <span className="text-red-500 hover:underline">Daftarkan Calon Siswa Baru →</span>
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM (Clean, professional multi-step visual style) */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                <div className="relative py-1 flex items-center justify-center">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-red-500 font-bold bg-red-950/40 border border-red-900/20 px-3 py-1 rounded-full">
                    Bagian 1: Data Calon Siswa
                  </span>
                </div>

                <div className={fieldWrap}>
                  <label className={labelClass}>Nama Calon Siswa *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input type="text" required className={inputClass} placeholder="Nama Lengkap Calon Siswa"
                      value={regData.studentName} onChange={(e) => setRegData({ ...regData, studentName: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tempat Lahir *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input type="text" required className={inputClass} placeholder="Kota/Kabupaten"
                        value={regData.birthPlace} onChange={(e) => setRegData({ ...regData, birthPlace: e.target.value })} />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tanggal Lahir *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input type="date" required className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white rounded-xl outline-none"
                        value={regData.dob} onChange={(e) => setRegData({ ...regData, dob: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className={fieldWrap}>
                  <label className={labelClass}>NIK (Nomor Induk Keluarga) *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input type="text" required maxLength={16} className={inputClass} placeholder="16 Digit Angka NIK"
                      value={regData.nik} onChange={(e) => setRegData({ ...regData, nik: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Sabuk</label>
                    <select className="w-full px-3 py-3 bg-zinc-950/60 border border-zinc-800 text-sm text-white rounded-xl outline-none focus:border-red-500" value={regData.currentBelt}
                      onChange={(e) => setRegData({ ...regData, currentBelt: e.target.value })}>
                      {beltOptions.map((belt) => <option key={belt} value={belt} className="bg-zinc-950">{belt}</option>)}
                    </select>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Berat (kg)</label>
                    <input type="number" className="w-full px-3 py-3 bg-zinc-950/60 border border-zinc-800 text-sm text-white rounded-xl outline-none focus:border-red-500" placeholder="kg"
                      value={regData.weight} onChange={(e) => setRegData({ ...regData, weight: e.target.value })} />
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Tinggi (cm)</label>
                    <input type="number" className="w-full px-3 py-3 bg-zinc-950/60 border border-zinc-800 text-sm text-white rounded-xl outline-none focus:border-red-500" placeholder="cm"
                      value={regData.height} onChange={(e) => setRegData({ ...regData, height: e.target.value })} />
                  </div>
                </div>

                <div className="relative py-1 flex items-center justify-center">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-red-500 font-bold bg-red-950/40 border border-red-900/20 px-3 py-1 rounded-full">
                    Bagian 2: Data Orang Tua / Wali
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrap}>
                    <label className={labelClass}>Nama Orang Tua *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input type="text" required className={inputClass} placeholder="Nama Ayah / Ibu"
                        value={regData.parentName} onChange={(e) => setRegData({ ...regData, parentName: e.target.value })} />
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass}>Nomor Telepon/WhatsApp *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input type="tel" required className={inputClass} placeholder="contoh: 081234..."
                        value={regData.parentPhone} onChange={(e) => setRegData({ ...regData, parentPhone: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className={fieldWrap}>
                  <label className={labelClass}>Alamat Tempat Tinggal</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-5 w-4 h-4 text-zinc-600" />
                    <textarea rows={2} className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white rounded-xl outline-none resize-none transition-all duration-200" placeholder="Alamat lengkap rumah tinggal..."
                      value={regData.address} onChange={(e) => setRegData({ ...regData, address: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(null); }}
                    className="apple-btn-secondary flex-1 py-3 text-sm font-semibold"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="apple-btn flex-1 py-3 text-sm font-semibold shadow-[0_4px_20px_rgba(239,68,68,0.2)]"
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
