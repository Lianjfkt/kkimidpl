'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { supabase, rawClient } from '@/lib/supabaseClient';
import { Student, ClassSession, StudentAttendance } from '@/lib/mockData';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_CONFIG = {
  hadir: { label: 'H', full: 'Hadir',   bg: 'bg-emerald-500', text: 'text-white',  pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  izin:  { label: 'I', full: 'Izin',    bg: 'bg-sky-500',     text: 'text-white',  pill: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  sakit: { label: 'S', full: 'Sakit',   bg: 'bg-amber-400',   text: 'text-white',  pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  alpha: { label: 'A', full: 'Alpha',   bg: 'bg-red-500',     text: 'text-white',  pill: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
};

type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

interface StudentStats {
  student: Student;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
  pct: number;
  isAtRisk: boolean;
  sessionMap: Record<string, AttendanceStatus>;
}

function formatWANumber(phone?: string | null) {
  if (!phone) return '';
  let n = phone.replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  else if (n.startsWith('8')) n = '62' + n;
  return n;
}

function buildWAMessage(studentName: string, parentName: string | undefined, dates: string[]) {
  const dateList = dates.map(d => `- ${d}`).join('\n');
  return `Assalamu'alaikum Bpk/Ibu ${parentName || 'Orang Tua'} 🙏

Kami dari Pengurus Dojo Karate KKI DPL ingin menginformasikan bahwa ananda *${studentName}* tercatat tidak hadir latihan pada tanggal berikut:

${dateList}

Mohon informasikan alasan ketidakhadiran ananda agar dapat kami catat. Kehadiran rutin sangat penting untuk perkembangan teknik dan kenaikan sabuk ananda.

Terima kasih atas perhatian dan kerja samanya. 🥋
_OSS! Salam Karate._`;
}

export default function OwnerAttendanceMonitor() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<'matrix' | 'alert' | 'recap'>('matrix');
  const [classFilter, setClassFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(() => new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    // Gunakan rawClient langsung agar tidak terpengaruh bug wrapper
    const [studRes, clsRes, attRes] = await Promise.all([
      rawClient.from('students').select('*'),
      rawClient.from('classes').select('*'),
      rawClient.from('attendance_students').select('*'),
    ]);

    // Debug: tampilkan info data + error
    const errors = [studRes.error, clsRes.error, attRes.error].filter(Boolean);
    const studCount = studRes.data?.length ?? 0;
    const attCount = attRes.data?.length ?? 0;
    const attDates = Array.from(new Set((attRes.data ?? []).map((a: any) => a.session_date?.slice(0, 7)))).join(', ');
    setDebugInfo(
      errors.length > 0
        ? `❌ Error: ${errors.map((e: any) => e?.message).join(' | ')}`
        : `✅ ${studCount} siswa · ${attCount} record absensi · periode: [${attDates || 'kosong'}]`
    );

    if (studRes.data) setStudents(studRes.data);
    if (clsRes.data) setClasses(clsRes.data);
    if (attRes.data) setAttendance(attRes.data);
    setLastUpdated(new Date());
    if (showLoader) setLoading(false);
    else setRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // Realtime subscription — refresh saat ada perubahan data absensi
    const channel = rawClient
      .channel('attendance-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_students' }, () => {
        loadData(false); // refresh tanpa loading spinner
      })
      .subscribe();

    // Refresh saat user kembali ke tab browser
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      rawClient.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse date safely (avoid UTC shift)
  const parseDate = (dateStr: string) => {
    const parts = (dateStr || '').split('T')[0].split('-').map(Number);
    return { year: parts[0], month: parts[1], day: parts[2] };
  };

  // All unique session dates in filtered period (sorted)
  const sessionDates = useMemo(() => {
    const seen = new Set<string>();
    attendance.forEach(a => {
      const { year, month } = parseDate(a.session_date);
      if (
        month === monthFilter &&
        year === yearFilter &&
        (!classFilter || a.class_id === classFilter)
      ) {
        seen.add(a.session_date.split('T')[0]);
      }
    });
    return Array.from(seen).sort();
  }, [attendance, monthFilter, yearFilter, classFilter]);

  // Compute stats per student
  const studentStats = useMemo<StudentStats[]>(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    return activeStudents.map(student => {
      const records = attendance.filter(a => {
        const { year, month } = parseDate(a.session_date);
        return (
          a.student_id === student.id &&
          month === monthFilter &&
          year === yearFilter &&
          (!classFilter || a.class_id === classFilter)
        );
      });
      const hadir = records.filter(r => r.status === 'hadir').length;
      const izin  = records.filter(r => r.status === 'izin').length;
      const sakit = records.filter(r => r.status === 'sakit').length;
      const alpha = records.filter(r => r.status === 'alpha').length;
      const total = records.length;
      const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
      const isAtRisk = total > 0 && (pct < 60 || alpha >= 2);

      // Build date→status map for matrix
      const sessionMap: Record<string, AttendanceStatus> = {};
      records.forEach(r => {
        sessionMap[r.session_date.split('T')[0]] = r.status as AttendanceStatus;
      });

      return { student, hadir, izin, sakit, alpha, total, pct, isAtRisk, sessionMap };
    });
  }, [students, attendance, monthFilter, yearFilter, classFilter]);

  // Apply search + belt filter
  const filtered = useMemo(() => studentStats.filter(s => {
    const q = search.toLowerCase();
    if (q && !s.student.full_name?.toLowerCase().includes(q) && !s.student.parent_name?.toLowerCase().includes(q)) return false;
    if (beltFilter && !s.student.current_belt?.toLowerCase().includes(beltFilter.toLowerCase())) return false;
    return true;
  }), [studentStats, search, beltFilter]);

  const atRiskStudents = filtered.filter(s => s.isAtRisk);

  // KPI aggregates
  const totalSessions = sessionDates.length;
  const avgPct = filtered.length > 0 ? Math.round(filtered.reduce((s, i) => s + i.pct, 0) / filtered.length) : 0;
  const perfectCount = filtered.filter(s => s.total > 0 && s.pct === 100).length;
  const atRiskCount = atRiskStudents.length;

  // Available years from data
  const availableYears = Array.from(
    new Set(attendance.map(a => parseDate(a.session_date).year).filter(Boolean))
  ).sort((a, b) => b - a);
  if (!availableYears.includes(yearFilter)) availableYears.unshift(yearFilter);

  // CSV Export
  const exportCSV = () => {
    const header = 'Nama Siswa,Sabuk,Total Sesi,Hadir,Izin,Sakit,Alpha,% Kehadiran,Status';
    const rows = filtered.map(s => [
      `"${s.student.full_name}"`,
      `"${s.student.current_belt || '-'}"`,
      s.total, s.hadir, s.izin, s.sakit, s.alpha,
      `${s.pct}%`,
      s.isAtRisk ? 'Kritis' : s.pct >= 80 ? 'Baik' : 'Perlu Perhatian',
    ].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Absensi_${MONTHS[monthFilter - 1]}_${yearFilter}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Navigation>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Monitoring Kehadiran Siswa
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Pantau kedisiplinan latihan seluruh atlet karate dojo secara real-time.
              </p>
              {lastUpdated && (
                <span className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {refreshing ? '🔄 Memperbarui…' : `✓ ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => loadData(false)}
              disabled={refreshing}
              title="Refresh data sekarang"
              className="p-2 rounded-full transition-all cursor-pointer hover:bg-[var(--md-sys-color-surface-container)] disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={exportCSV}
              className="m3-btn-outlined px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* Debug Banner — hapus setelah masalah teridentifikasi */}
        {debugInfo && (
          <div className={`px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
            debugInfo.startsWith('❌')
              ? 'bg-red-500/10 border border-red-500/30 text-red-500'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <span>{debugInfo}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kelas</label>
            <select className="m3-textfield-outlined text-sm" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bulan</label>
            <select className="m3-textfield-outlined text-sm" value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tahun</label>
            <select className="m3-textfield-outlined text-sm" value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Sabuk</label>
            <select className="m3-textfield-outlined text-sm" value={beltFilter} onChange={e => setBeltFilter(e.target.value)}>
              <option value="">Semua Sabuk</option>
              {['Putih', 'Kuning', 'Orange', 'Hijau', 'Biru Muda', 'Biru Tua', 'Coklat Muda', 'Coklat', 'Hitam'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-[var(--md-sys-color-on-surface-variant)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama siswa atau nama orang tua..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="m3-textfield-outlined w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Rata-rata Kehadiran',
              value: loading ? '—' : `${avgPct}%`,
              sub: `${MONTHS[monthFilter - 1]} ${yearFilter}`,
              icon: '📊',
              color: 'var(--md-sys-color-primary-container)',
              textColor: 'var(--md-sys-color-on-primary-container)',
            },
            {
              label: 'Total Sesi Latihan',
              value: loading ? '—' : `${totalSessions} Sesi`,
              sub: classFilter ? classes.find(c => c.id === classFilter)?.name : 'Semua Kelas',
              icon: '📅',
              color: 'var(--md-sys-color-tertiary-container)',
              textColor: 'var(--md-sys-color-on-tertiary-container)',
            },
            {
              label: 'Atlet Kritis / Jarang Hadir',
              value: loading ? '—' : `${atRiskCount} Siswa`,
              sub: 'Kehadiran < 60% atau alpha ≥ 2×',
              icon: '⚠️',
              color: atRiskCount > 0 ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-surface-container-high)',
              textColor: atRiskCount > 0 ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-surface)',
            },
            {
              label: 'Kehadiran Sempurna',
              value: loading ? '—' : `${perfectCount} Siswa`,
              sub: '100% hadir di semua sesi',
              icon: '🏆',
              color: 'var(--md-sys-color-surface-container-high)',
              textColor: 'var(--md-sys-color-on-surface)',
            },
          ].map(({ label, value, sub, icon, color, textColor }) => (
            <div key={label} className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-2"
              style={{ background: color }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80" style={{ color: textColor }}>{label}</span>
                <span className="text-lg">{icon}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: textColor }}>{value}</p>
              {sub && <p className="text-[11px] opacity-75 leading-tight" style={{ color: textColor }}>{sub}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] w-fit">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm' : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            📅 Matriks Sesi Harian
          </button>
          <button
            onClick={() => setActiveTab('alert')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alert' ? 'bg-red-500 text-white shadow-sm' : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            ⚠️ Peringatan Atlet
            {atRiskCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-white text-red-600 rounded-full font-bold">{atRiskCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'recap' ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm' : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            📊 Rekap Bulanan
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]"
                style={{ background: 'var(--md-sys-color-surface-container)' }} />
            ))}
          </div>
        )}

        {/* TAB 1: MATRIKS SESI HARIAN */}
        {!loading && activeTab === 'matrix' && (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-sm"
            style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
            <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
              <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Matriks Kehadiran Harian — {MONTHS[monthFilter - 1]} {yearFilter}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {sessionDates.length > 0
                  ? `${sessionDates.length} sesi latihan tercatat · menampilkan ${filtered.length} siswa aktif.`
                  : 'Belum ada sesi latihan yang tercatat pada periode ini.'}
              </p>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1 text-[11px] font-medium">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${v.bg} ${v.text}`}>{v.label}</span>
                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{v.full}</span>
                  </span>
                ))}
                <span className="flex items-center gap-1 text-[11px] font-medium">
                  <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">—</span>
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak Ada Catatan</span>
                </span>
              </div>
            </div>

            {sessionDates.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>Belum Ada Data Sesi</p>
                <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Pelatih belum menginput absensi untuk periode {MONTHS[monthFilter - 1]} {yearFilter}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: `${Math.max(600, sessionDates.length * 48 + 300)}px` }}>
                  <thead>
                    <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0 z-10"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)', background: 'var(--md-sys-color-surface-container)', minWidth: '200px' }}>
                        Siswa / Sabuk
                      </th>
                      {sessionDates.map(d => {
                        const day = new Date(d).toLocaleDateString('id-ID', { weekday: 'short', timeZone: 'UTC' });
                        const date = d.split('-')[2];
                        return (
                          <th key={d} className="px-2 py-3 text-center text-xs font-semibold"
                            style={{ color: 'var(--md-sys-color-on-surface-variant)', minWidth: '44px' }}>
                            <div className="text-[9px] opacity-70">{day}</div>
                            <div>{date}</div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-3 text-center text-xs font-semibold"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)', minWidth: '64px' }}>Hadir</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)', minWidth: '48px' }}>Alpha</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)', minWidth: '64px' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => (
                      <tr key={s.student.id}
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}
                        className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 sticky left-0 z-10"
                          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                              {s.student.full_name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {s.student.full_name}
                              </p>
                              <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {s.student.current_belt || 'Putih'}
                              </p>
                            </div>
                            {s.isAtRisk && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-500 border border-red-500/30 rounded-full font-bold ml-1">⚠️</span>
                            )}
                          </div>
                        </td>
                        {sessionDates.map(d => {
                          const status = s.sessionMap[d];
                          const cfg = status ? STATUS_CONFIG[status] : null;
                          return (
                            <td key={d} className="px-1 py-3 text-center">
                              {cfg ? (
                                <span
                                  className={`w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center mx-auto ${cfg.bg} ${cfg.text}`}
                                  title={`${s.student.full_name} — ${d}: ${cfg.full}`}
                                >
                                  {cfg.label}
                                </span>
                              ) : (
                                <span className="w-7 h-7 rounded flex items-center justify-center mx-auto text-[11px]"
                                  style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {s.hadir}/{s.total}
                        </td>
                        <td className={`px-3 py-3 text-center text-xs font-bold ${s.alpha > 0 ? 'text-red-500' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                          {s.alpha}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            s.total === 0 ? 'text-[var(--md-sys-color-on-surface-variant)]' :
                            s.pct >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            s.pct >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                            {s.total === 0 ? '—' : `${s.pct}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERINGATAN ATLET JARANG HADIR */}
        {!loading && activeTab === 'alert' && (
          <div className="space-y-4 animate-fade-in">
            {atRiskStudents.length === 0 ? (
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-16 text-center"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <p className="text-4xl mb-3">🎉</p>
                <p className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Tidak Ada Atlet Kritis!
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Semua siswa aktif memiliki tingkat kehadiran yang baik di periode {MONTHS[monthFilter - 1]} {yearFilter}.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <span className="text-xl">🚨</span>
                  <div>
                    <p className="text-sm font-bold text-red-500">{atRiskStudents.length} Atlet Memerlukan Perhatian Khusus</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Kriteria: Kehadiran &lt; 60% ATAU memiliki ≥ 2 kali Alpha pada periode {MONTHS[monthFilter - 1]} {yearFilter}.
                    </p>
                  </div>
                </div>

                <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
                  style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                  {atRiskStudents.map((s, idx) => {
                    const alphaDates = Object.entries(s.sessionMap)
                      .filter(([, status]) => status === 'alpha')
                      .map(([d]) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', timeZone: 'UTC' }));

                    const waUrl = s.student.phone
                      ? `https://wa.me/${formatWANumber(s.student.phone)}?text=${encodeURIComponent(
                          buildWAMessage(s.student.full_name, s.student.parent_name, alphaDates.length > 0 ? alphaDates : [`Bulan ${MONTHS[monthFilter - 1]} ${yearFilter}`])
                        )}`
                      : null;

                    return (
                      <div key={s.student.id}
                        style={{ borderBottom: idx < atRiskStudents.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}
                        className="p-5 hover:bg-white/5 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {s.student.full_name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {s.student.full_name}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                Sabuk {s.student.current_belt || 'Putih'} · {s.student.parent_name ? `Ortu: ${s.student.parent_name}` : 'Data ortu belum ada'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Stats mini */}
                            <div className="flex items-center gap-2">
                              <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Kehadiran</div>
                                <div className={`text-sm font-black ${s.pct < 60 ? 'text-red-500' : 'text-amber-500'}`}>{s.pct}%</div>
                              </div>
                              <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Alpha</div>
                                <div className="text-sm font-black text-red-500">{s.alpha}×</div>
                              </div>
                              <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Hadir</div>
                                <div className="text-sm font-black text-emerald-500">{s.hadir}/{s.total}</div>
                              </div>
                            </div>

                            {/* WA Button */}
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                                </svg>
                                Follow-up WA
                              </a>
                            ) : (
                              <span className="px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface-variant)] italic">No HP belum ada</span>
                            )}
                          </div>
                        </div>

                        {/* Alpha date details */}
                        {alphaDates.length > 0 && (
                          <div className="mt-3 ml-13 flex flex-wrap gap-1.5">
                            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-medium mr-1">Tidak hadir tanpa keterangan:</span>
                            {alphaDates.map(d => (
                              <span key={d} className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-semibold">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: REKAP BULANAN */}
        {!loading && activeTab === 'recap' && (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-sm animate-fade-in"
            style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
            <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Rekap Kehadiran — {MONTHS[monthFilter - 1]} {yearFilter}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {filtered.length} siswa aktif · {totalSessions} sesi tercatat
                </p>
              </div>
              <button onClick={exportCSV} className="m3-btn-outlined px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer self-start">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Unduh CSV
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada data siswa sesuai filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                      {['Nama Siswa', 'Sabuk', 'Total Sesi', 'Hadir', 'Izin', 'Sakit', 'Alpha', '% Kehadiran', 'Status'].map(col => (
                        <th key={col} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-center first:text-left"
                          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.sort((a, b) => b.pct - a.pct).map((s, idx) => (
                      <tr key={s.student.id}
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}
                        className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                              {s.student.full_name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{s.student.full_name}</p>
                              {s.isAtRisk && <span className="text-[10px] text-red-500 font-bold">⚠️ Perlu Perhatian</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {s.student.current_belt || 'Putih'}
                        </td>
                        <td className="px-5 py-4 text-sm text-center font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{s.total}</td>
                        <td className="px-5 py-4 text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">{s.hadir}</td>
                        <td className="px-5 py-4 text-sm text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{s.izin}</td>
                        <td className="px-5 py-4 text-sm text-center text-amber-500">{s.sakit}</td>
                        <td className="px-5 py-4 text-sm text-center font-semibold text-red-500">{s.alpha}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            s.total === 0 ? 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]' :
                            s.pct >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            s.pct >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                            {s.total === 0 ? '—' : `${s.pct}%`}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            s.total === 0 ? 'text-[var(--md-sys-color-on-surface-variant)]' :
                            s.isAtRisk ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            s.pct >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {s.total === 0 ? '—' : s.isAtRisk ? '🚨 Kritis' : s.pct >= 80 ? '✅ Baik' : '⚡ Perlu Latihan'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Navigation>
  );
}
