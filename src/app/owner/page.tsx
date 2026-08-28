'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Registration, Fee, StudentAttendance, BeltExam, Tournament, ClassSession } from '@/lib/mockData';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-fade-in"
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const BELT_COLORS: Record<string, string> = {
  'Putih': '#e5e7eb', 'Kuning': '#fde68a', 'Orange': '#fb923c', 'Hijau': '#4ade80',
  'Biru': '#60a5fa', 'Biru Muda': '#93c5fd', 'Coklat': '#a16207', 'Coklat Muda': '#ca8a04',
  'Hitam': '#111827', 'Dan I': '#7c3aed', 'Dan II': '#6d28d9',
};

const beltColor = (belt: string) => BELT_COLORS[belt] || '#6b7280';

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string;
  color?: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-3"
      style={{ background: color || 'var(--md-sys-color-surface-container-low)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium opacity-70" style={{ color: 'var(--md-sys-color-on-surface)' }}>{label}</span>
        <div className="w-9 h-9 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.12)' }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{value}</p>
        {sub && <p className="text-xs mt-0.5 opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<BeltExam[]>([]);
  const [pastExams, setPastExams] = useState<BeltExam[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const today = now.toISOString().split('T')[0];

  const loadData = async () => {
    setLoading(true);
    const [studRes, regRes, feeRes, attRes, examRes, tournRes, classRes] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('registrations').select('*'),
      supabase.from('fees').select('*'),
      supabase.from('attendance_students').select('*'),
      supabase.from('belt_exams').select('*'),
      supabase.from('tournaments').select('*'),
      supabase.from('classes').select('*'),
    ]);
    if (studRes.data) setStudents(studRes.data);
    if (regRes.data) setRegistrations(regRes.data);
    if (feeRes.data) setFees(feeRes.data);
    if (attRes.data) setAttendance(attRes.data);
    if (examRes.data) {
      setUpcomingExams((examRes.data as BeltExam[]).filter(e => e.exam_date >= today));
      setPastExams((examRes.data as BeltExam[]).filter(e => e.exam_date < today));
    }
    if (tournRes.data) setTournaments(tournRes.data as Tournament[]);
    if (classRes.data) setClasses(classRes.data as ClassSession[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const [rejectingReg, setRejectingReg] = useState<Registration | null>(null);

  const handleRejectRegistration = async (reg: Registration) => {
    setRejectingReg(reg);
  };

  const confirmRejectRegistration = async () => {
    if (!rejectingReg) return;
    await supabase.from('registrations').eq('id', rejectingReg.id).update({ status: 'ditolak' });
    setRejectingReg(null);
    loadData();
  };

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const activeStudents = students.filter(s => s.status === 'active');
  const pendingRegs = registrations.filter(r => r.status === 'menunggu');

  // Iuran bulan ini
  const thisMonthFees = fees.filter(f => f.period_month === currentMonth && f.period_year === currentYear);
  const thisMonthLunas = thisMonthFees.filter(f => f.status === 'lunas').length;
  const thisMonthBelum = thisMonthFees.filter(f => f.status !== 'lunas').length;
  const thisMonthIncome = fees.filter(f => f.status === 'lunas' && f.period_month === currentMonth && f.period_year === currentYear).reduce((s, f) => s + Number(f.amount), 0);
  // Total iuran belum lunas (seluruh periode)
  const totalUnpaid = fees.filter(f => f.status !== 'lunas').reduce((s, f) => s + Number(f.amount), 0);

  // Absensi bulan ini
  const thisMonthAtt = attendance.filter(a => {
    const d = new Date(a.session_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const attendanceRate = thisMonthAtt.length > 0
    ? Math.round((thisMonthAtt.filter(a => a.status === 'hadir').length / thisMonthAtt.length) * 100)
    : 0;

  // Distribusi sabuk
  const beltDist = activeStudents.reduce<Record<string, number>>((acc, s) => {
    const b = s.current_belt || 'Putih';
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {});
  const beltEntries = Object.entries(beltDist).sort((a, b) => b[1] - a[1]);

  // Iuran 6 bulan terakhir
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (5 - i));
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: months[d.getMonth()].slice(0, 3) };
  });
  const feeChart = last6Months.map(m => ({
    ...m,
    lunas: fees.filter(f => f.period_month === m.month && f.period_year === m.year && f.status === 'lunas').reduce((s, f) => s + Number(f.amount), 0),
  }));
  const feeChartMax = Math.max(...feeChart.map(m => m.lunas), 1);

  // Siswa terbaru
  const recentStudents = [...students].sort((a, b) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime()).slice(0, 5);

  // Iuran belum lunas
  const unpaidFees = fees.filter(f => f.status !== 'lunas').slice(0, 8);

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Ringkasan Dojo
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {months[currentMonth - 1]} {currentYear} · KKI DPL Manager
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/owner/students" className="m3-btn-tonal px-4 py-2 text-sm font-medium">
              + Tambah Siswa
            </Link>
            <Link href="/owner/finance" className="m3-btn-filled px-4 py-2 text-sm font-medium">
              Keuangan
            </Link>
          </div>
        </div>

        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Siswa Aktif"
            value={loading ? '—' : String(activeStudents.length)}
            sub="terdaftar & aktif berlatih"
            color="var(--md-sys-color-primary-container)"
            icon={<svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-primary-container)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>}
          />
          <StatCard
            label="Kehadiran Bulan Ini"
            value={loading ? '—' : `${attendanceRate}%`}
            sub={`${thisMonthAtt.filter(a => a.status === 'hadir').length} dari ${thisMonthAtt.length} sesi`}
            color="var(--md-sys-color-tertiary-container)"
            icon={<svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Pemasukan Bulan Ini"
            value={loading ? '—' : `Rp ${thisMonthIncome.toLocaleString('id-ID')}`}
            sub={`${thisMonthLunas} siswa lunas`}
            icon={<svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>}
          />
          <StatCard
            label="Tunggakan Iuran"
            value={loading ? '—' : `Rp ${totalUnpaid.toLocaleString('id-ID')}`}
            sub={`${fees.filter(f => f.status !== 'lunas').length} tagihan belum lunas`}
            color={totalUnpaid > 0 ? 'var(--md-sys-color-error-container)' : undefined}
            icon={<svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* Main content: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Grafik iuran 6 bulan + Jadwal kelas */}
          <div className="lg:col-span-2 space-y-6">

            {/* 2 Chart Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Iuran chart */}
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Pemasukan Iuran (6 Bln Terakhir)
                  </h3>
                </div>
                {loading ? (
                  <div className="h-32 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />
                ) : (
                  <>
                    <div className="flex items-end gap-2 h-28">
                      {feeChart.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <p className="text-[8px] font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {m.lunas > 0 ? `${(m.lunas / 1000).toFixed(0)}k` : ''}
                          </p>
                          <div className="w-full rounded-t-[var(--md-sys-shape-corner-extra-small)] transition-all duration-700"
                            style={{
                              height: `${(m.lunas / feeChartMax) * 100}%`,
                              minHeight: m.lunas > 0 ? '6px' : '2px',
                              background: m.month === currentMonth && m.year === currentYear
                                ? 'var(--md-sys-color-primary)'
                                : 'var(--md-sys-color-tertiary)'
                            }} />
                          <span className="text-[9px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{m.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Terkumpul: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>Rp {fees.filter(f => f.status === 'lunas').reduce((s, f) => s + Number(f.amount), 0).toLocaleString('id-ID')}</strong>
                    </p>
                  </>
                )}
              </div>

              {/* Tren Pendaftaran Siswa Baru */}
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Pendaftaran Siswa Baru (6 Bln Terakhir)
                  </h3>
                </div>
                {loading ? (
                  <div className="h-32 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />
                ) : (
                  <>
                    <div className="flex items-end gap-2 h-28">
                      {last6Months.map((m, i) => {
                        const count = students.filter(s => {
                          const d = new Date(s.join_date);
                          return d.getMonth() + 1 === m.month && d.getFullYear() === m.year;
                        }).length;
                        const maxCount = Math.max(...last6Months.map(lm => students.filter(s => {
                          const d = new Date(s.join_date);
                          return d.getMonth() + 1 === lm.month && d.getFullYear() === lm.year;
                        }).length), 1);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <p className="text-[8px] font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {count > 0 ? `${count} org` : ''}
                            </p>
                            <div className="w-full rounded-t-[var(--md-sys-shape-corner-extra-small)] transition-all duration-700"
                              style={{
                                height: `${(count / maxCount) * 100}%`,
                                minHeight: count > 0 ? '6px' : '2px',
                                background: m.month === currentMonth && m.year === currentYear
                                  ? 'var(--md-sys-color-secondary)'
                                  : 'var(--md-sys-color-outline-variant)'
                              }} />
                            <span className="text-[9px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Total siswa aktif saat ini: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{activeStudents.length} siswa</strong>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Status iuran bulan ini */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Status Iuran — {months[currentMonth - 1]} {currentYear}
                </h3>
                <Link href="/owner/finance" className="m3-btn-outlined px-3 py-1.5 text-xs font-medium">Kelola</Link>
              </div>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
              ) : thisMonthFees.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Belum ada tagihan untuk bulan ini. <Link href="/owner/finance" className="underline" style={{ color: 'var(--md-sys-color-primary)' }}>Generate sekarang</Link>
                </p>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <span>{thisMonthLunas} Lunas</span>
                      <span>{thisMonthBelum} Belum Lunas</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((thisMonthLunas / (thisMonthLunas + thisMonthBelum)) * 100)}%`, background: 'var(--md-sys-color-tertiary)' }} />
                    </div>
                  </div>
                  {/* Unpaid list */}
                  {unpaidFees.length > 0 ? (
                    <div className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                      {unpaidFees.map(fee => {
                        const s = students.find(s => s.id === fee.student_id);
                        return (
                          <div key={fee.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{s?.full_name || '—'}</p>
                              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {months[(fee.period_month || 1) - 1]} {fee.period_year} · Rp {Number(fee.amount).toLocaleString('id-ID')}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}>
                              Belum Lunas
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Semua iuran bulan ini sudah lunas!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Distribusi Sabuk */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Distribusi Sabuk
              </h3>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-6 animate-pulse rounded" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
              ) : (
                <div className="space-y-2">
                  {beltEntries.map(([belt, count]) => (
                    <div key={belt} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20" style={{ background: beltColor(belt) }} />
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface)' }}>{belt}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${(count / activeStudents.length) * 100}%`, background: beltColor(belt) }} />
                          </div>
                          <span className="text-xs font-semibold w-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jadwal Kelas */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Jadwal Latihan
              </h3>
              <div className="space-y-3">
                {classes.map(cls => (
                  <div key={cls.id} className="flex items-start gap-3 p-3 rounded-[var(--md-sys-shape-corner-large)]"
                    style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    <div className="w-9 h-9 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                      {dayNames[cls.day_of_week]?.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{cls.name}</p>
                      <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {cls.time_start} – {cls.time_end}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu Cepat */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <h3 className="font-semibold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Menu Cepat</h3>
              <div className="space-y-1">
                {[
                  { href: '/owner/students', label: 'Kelola Siswa' },
                  { href: '/owner/attendance', label: 'Input Absensi' },
                  { href: '/owner/finance', label: 'Tagih Iuran Bulanan' },
                  { href: '/owner/exams', label: 'Ujian Kenaikan Sabuk' },
                  { href: '/owner/tournaments', label: 'Turnamen' },
                  { href: '/owner/import', label: 'Import Data Siswa' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[var(--md-sys-shape-corner-large)] transition-colors"
                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span className="text-sm">{label}</span>
                    <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Siswa Terbaru */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Siswa Terdaftar Terbaru</h3>
            <Link href="/owner/students" className="text-xs font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
              Lihat Semua ({activeStudents.length}) →
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    {['Nama Siswa', 'Tgl Lahir', 'Sabuk', 'Spesialis', 'Wali', 'Bergabung'].map((h, i) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: idx < recentStudents.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                            {s.full_name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {s.dob ? new Date(s.dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0" style={{ background: beltColor(s.current_belt) }} />
                          <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface)' }}>{s.current_belt}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{(s as any).specialization || '—'}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{(s as any).parent_name || s.phone || '—'}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {s.join_date ? new Date(s.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Events: Ujian & Turnamen */}
        {!loading && (upcomingExams.length > 0 || pastExams.length > 0 || tournaments.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ujian Sabuk */}
            {(upcomingExams.length > 0 || pastExams.length > 0) && (
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Ujian Kenaikan Sabuk</h3>
                  <Link href="/owner/exams" className="text-xs font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>Semua →</Link>
                </div>
                <div className="space-y-3">
                  {[...upcomingExams, ...pastExams].slice(0, 3).map(exam => (
                    <div key={exam.id} className="flex items-center gap-3 p-3 rounded-[var(--md-sys-shape-corner-large)]"
                      style={{ background: 'var(--md-sys-color-tertiary-container)' }}>
                      <div className="w-10 h-10 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.1)' }}>
                        <svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>{exam.location}</p>
                        <p className="text-xs" style={{ color: 'var(--md-sys-color-on-tertiary-container)', opacity: 0.75 }}>
                          {new Date(exam.exam_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.15)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
                        {exam.status === 'selesai' ? 'Selesai' : 'Terjadwal'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Turnamen */}
            {tournaments.length > 0 && (
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Turnamen / Kejuaraan</h3>
                  <Link href="/owner/tournaments" className="text-xs font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>Semua →</Link>
                </div>
                <div className="space-y-3">
                  {tournaments.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-[var(--md-sys-shape-corner-large)]"
                      style={{ background: 'var(--md-sys-color-primary-container)' }}>
                      <div className="w-10 h-10 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.1)' }}>
                        <svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-primary-container)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>{t.name}</p>
                        <p className="text-xs" style={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.75 }}>
                          {new Date(t.tournament_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {t.location}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.15)', color: 'var(--md-sys-color-on-primary-container)' }}>
                        {t.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pendaftaran menunggu */}
        {!loading && pendingRegs.length > 0 && (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6"
            style={{ background: 'var(--md-sys-color-error-container)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
                  {pendingRegs.length} Pendaftaran Menunggu Persetujuan
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.75 }}>Segera tinjau dan proses pendaftaran calon siswa baru</p>
              </div>
              <Link href="/owner/registrations" className="m3-btn-filled px-4 py-2 text-sm font-medium">Tinjau</Link>
            </div>
            <div className="space-y-2">
              {pendingRegs.slice(0, 3).map(reg => (
                <div key={reg.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--md-sys-shape-corner-large)]"
                  style={{ background: 'rgba(0,0,0,0.1)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-error-container)' }}>{reg.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.75 }}>Ortu: {reg.parent_name}{reg.parent_job ? ` (${reg.parent_job})` : ''} · {reg.parent_phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`/owner/registrations?approve=${reg.id}`} className="m3-btn-tonal px-3 py-1 text-xs font-semibold">Setujui</Link>
                    <button onClick={() => handleRejectRegistration(reg)} className="m3-btn-text px-3 py-1 text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-error-container)' }}>Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <M3Dialog open={rejectingReg !== null} onClose={() => setRejectingReg(null)} title="Konfirmasi Penolakan">
        <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Apakah Anda yakin ingin menolak pendaftaran calon siswa <strong>{rejectingReg?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={() => setRejectingReg(null)} className="m3-btn-text text-sm px-4 py-2">Batal</button>
          <button type="button" onClick={confirmRejectRegistration} className="m3-btn-filled text-sm px-4 py-2" style={{ background: 'var(--md-sys-color-error)' }}>Tolak Pendaftaran</button>
        </div>
      </M3Dialog>
    </Navigation>
  );
}
