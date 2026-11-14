'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, StudentAttendance } from '@/lib/mockData';
import {
  MONTH_NAMES,
  getMonthsInRange,
  getDateRangeBounds,
  calculateStudentAttendanceStats,
  calculateStudentRangeBilling,
  generateIntegratedBillingCsv,
} from '@/lib/billingUtils';

const months = MONTH_NAMES;

const neuInputStyle: React.CSSProperties = {
  background: 'var(--neu-surface-low)',
  boxShadow: 'var(--neu-shadow-pressed-sm)',
  border: '1px solid var(--neu-border)',
  color: 'var(--md-sys-color-on-surface)',
};

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Range Selection State
  const now = new Date();
  const [startMonth, setStartMonth] = useState(now.getMonth() + 1);
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [endMonth, setEndMonth] = useState(now.getMonth() + 1);
  const [endYear, setEndYear] = useState(now.getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [studRes, feesRes, attRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('fees').select('*'),
        supabase.from('attendance_students').select('*'),
      ]);
      if (studRes.data) setStudents(studRes.data);
      if (feesRes.data) setFees(feesRes.data);
      if (attRes.data) setAttendance(attRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const periodLabel = useMemo(() => {
    if (startMonth === endMonth && startYear === endYear) {
      return `${months[startMonth - 1]} ${startYear}`;
    }
    return `${months[startMonth - 1]} ${startYear} - ${months[endMonth - 1]} ${endYear}`;
  }, [startMonth, startYear, endMonth, endYear]);

  const handleSetPreset = (preset: 'thisMonth' | 'last3Months' | 'thisYear') => {
    const curNow = new Date();
    const curM = curNow.getMonth() + 1;
    const curY = curNow.getFullYear();
    if (preset === 'thisMonth') {
      setStartMonth(curM);
      setStartYear(curY);
      setEndMonth(curM);
      setEndYear(curY);
    } else if (preset === 'last3Months') {
      let sM = curM - 2;
      let sY = curY;
      if (sM < 1) {
        sM += 12;
        sY -= 1;
      }
      setStartMonth(sM);
      setStartYear(sY);
      setEndMonth(curM);
      setEndYear(curY);
    } else if (preset === 'thisYear') {
      setStartMonth(1);
      setStartYear(curY);
      setEndMonth(12);
      setEndYear(curY);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportStudents = () => {
    const headers = 'ID,Nama Lengkap,Tanggal Lahir,Jenis Kelamin,Sabuk Saat Ini,Status,Tanggal Bergabung,No Telepon,Spesialisasi\n';
    const rows = students.map(s => 
      `"${s.id}","${s.full_name}","${s.dob}","${s.gender}","${s.current_belt}","${s.status}","${s.join_date}","${s.phone || ''}","${s.specialization || ''}"`
    ).join('\n');
    downloadCSV(headers + rows, `Siswa_Dojo_KKI_DPL_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportFees = () => {
    const range = getMonthsInRange(startMonth, startYear, endMonth, endYear);
    const filtered = fees.filter(f => 
      range.some(r => Number(f.period_month) === r.month && Number(f.period_year) === r.year)
    );
    const headers = 'ID,Nama Siswa,Bulan,Tahun,Nominal,Status Pembayaran,Tanggal Bayar,Metode Pembayaran,Catatan\n';
    const rows = filtered.map(f => {
      const sName = students.find(s => s.id === f.student_id)?.full_name || 'Tidak Diketahui';
      return `"${f.id}","${sName}","${months[f.period_month - 1] || f.period_month}",${f.period_year},"${f.amount}","${f.status}","${f.paid_date || ''}","${f.payment_method || ''}","${(f.notes || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const fileSuffix = startMonth === endMonth && startYear === endYear
      ? `${months[startMonth - 1]}_${startYear}`
      : `${months[startMonth - 1]}_${startYear}_sd_${months[endMonth - 1]}_${endYear}`;
    downloadCSV(headers + rows, `Laporan_Iuran_Dojo_${fileSuffix}.csv`);
  };

  const exportAttendance = () => {
    const { startDate, endDate } = getDateRangeBounds(startMonth, startYear, endMonth, endYear);
    const rows = attendance
      .filter(a => {
        if (!a.session_date) return false;
        const d = a.session_date.slice(0, 10);
        return d >= startDate && d <= endDate;
      })
      .map(a => {
        const sName = students.find(s => s.id === a.student_id)?.full_name || 'Tidak Diketahui';
        return `"${a.session_date}","${sName}","${a.status}"`;
      }).join('\n');

    const headers = 'Tanggal,Nama Siswa,Status Kehadiran\n';
    const fileSuffix = startMonth === endMonth && startYear === endYear
      ? `${months[startMonth - 1]}_${startYear}`
      : `${months[startMonth - 1]}_${startYear}_sd_${months[endMonth - 1]}_${endYear}`;
    downloadCSV(headers + rows, `Laporan_Absensi_Dojo_${fileSuffix}.csv`);
  };

  const exportIntegratedBilling = () => {
    const range = getMonthsInRange(startMonth, startYear, endMonth, endYear);
    const { startDate, endDate } = getDateRangeBounds(startMonth, startYear, endMonth, endYear);
    const activeStudents = students.filter(s => s.status === 'active');

    const items = activeStudents.map(student => {
      const rangeBilling = calculateStudentRangeBilling(student.id, fees, range, 20000, student.join_date);
      const attStats = calculateStudentAttendanceStats(student.id, attendance, startDate, endDate);
      const statusLabel = rangeBilling.isBeforeJoinEntirely
        ? 'Belum Bergabung'
        : rangeBilling.isRangeFullyPaid
        ? 'Lunas'
        : 'Belum Lunas';
      return {
        studentName: student.full_name,
        belt: student.current_belt || 'Putih',
        parentName: student.parent_name || '',
        phone: student.phone || '',
        totalSessions: attStats.totalSessions,
        hadir: attStats.hadir,
        izin: attStats.izin,
        sakit: attStats.sakit,
        alpha: attStats.alpha,
        attendancePct: attStats.attendancePct,
        status: statusLabel,
        unpaidMonths: rangeBilling.unpaidMonthDetails.join('; '),
        totalUnpaid: rangeBilling.totalUnpaidAmount,
      };
    });

    const csvContent = generateIntegratedBillingCsv(items, startMonth, startYear, endMonth, endYear);
    const fileSuffix = startMonth === endMonth && startYear === endYear
      ? `${months[startMonth - 1]}_${startYear}`
      : `${months[startMonth - 1]}_${startYear}_sd_${months[endMonth - 1]}_${endYear}`;
    downloadCSV(csvContent, `Rekap_Terpadu_Tagihan_Absensi_${fileSuffix}.csv`);
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Laporan &amp; Ekspor Data
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Tarik rekapitulasi data dojo karate KKI DPL per rentang periode kustom untuk pembukuan luar jaringan dan penagihan orang tua.
          </p>
        </div>

        {/* Global Period Filter Card */}
        <div
          className="rounded-3xl border border-[var(--neu-border)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Rentang Periode Laporan:
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Dari:</span>
              <select
                className="text-xs py-1.5 px-2.5 rounded-xl outline-none transition-all"
                style={neuInputStyle}
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                className="text-xs py-1.5 px-2 w-18 rounded-xl outline-none text-center"
                style={neuInputStyle}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Sampai:</span>
              <select
                className="text-xs py-1.5 px-2.5 rounded-xl outline-none transition-all"
                style={neuInputStyle}
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                className="text-xs py-1.5 px-2 w-18 rounded-xl outline-none text-center"
                style={neuInputStyle}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetPreset('thisMonth')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[var(--neu-border)] transition-all hover:bg-white/5 cursor-pointer"
                style={{ background: 'var(--neu-surface-low)', color: 'var(--md-sys-color-on-surface)' }}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('last3Months')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[var(--neu-border)] transition-all hover:bg-white/5 cursor-pointer"
                style={{ background: 'var(--neu-surface-low)', color: 'var(--md-sys-color-on-surface)' }}
              >
                3 Bulan
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('thisYear')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[var(--neu-border)] transition-all hover:bg-white/5 cursor-pointer"
                style={{ background: 'var(--neu-surface-low)', color: 'var(--md-sys-color-on-surface)' }}
              >
                Tahun Ini
              </button>
            </div>
          </div>

          <div
            className="text-xs font-semibold px-3 py-1 rounded-full border border-[var(--neu-border)] self-start md:self-auto flex items-center gap-1.5"
            style={{ background: 'var(--neu-surface-low)', color: '#34d399' }}
          >
            <span>📅</span>
            <span>Periode: <b>{periodLabel}</b></span>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Integrated Recap */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-84 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div className="absolute top-0 right-0 bg-emerald-500/10 border-b border-l border-emerald-500/20 px-3 py-1 rounded-bl-2xl text-[10px] font-bold text-emerald-400">
              REKOMENDASI
            </div>
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                🥋
              </div>
              <h3 className="font-bold text-base mb-1 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Rekap Terpadu Tagihan &amp; Absensi
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Laporan gabungan rekap kehadiran (H, I, S, A, %) dan rincian iuran belum lunas per siswa untuk periode <b>{periodLabel}</b>.
              </p>
            </div>
            <div className="space-y-2 mt-4">
              <button
                onClick={exportIntegratedBilling}
                disabled={loading || students.length === 0}
                className="apple-btn w-full cursor-pointer font-semibold text-xs py-2.5"
              >
                📥 Unduh Rekap Terpadu (CSV)
              </button>
              <Link
                href="/owner/finance"
                className="apple-btn-secondary w-full cursor-pointer font-semibold text-xs py-2 text-center block rounded-xl"
              >
                💬 Buka Menu Penagihan WA ↗
              </Link>
            </div>
          </div>

          {/* Card 2: Fees */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-84 transition-all duration-300 hover:-translate-y-1 group"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                💳
              </div>
              <h3 className="font-bold text-base mb-1 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Laporan Iuran Siswa
              </h3>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Unduh rekapitulasi pembayaran iuran siswa karate pada rentang <b>{periodLabel}</b> beserta metode bayar dan tanggal pelunasan.
              </p>
            </div>
            <button
              onClick={exportFees}
              disabled={loading}
              className="apple-btn w-full mt-4 cursor-pointer font-semibold text-xs py-2.5"
            >
              📥 Unduh Laporan Iuran
            </button>
          </div>

          {/* Card 3: Attendance */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-84 transition-all duration-300 hover:-translate-y-1 group"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                📋
              </div>
              <h3 className="font-bold text-base mb-1 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Laporan Absensi Siswa
              </h3>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Unduh rekap kehadiran seluruh siswa karate pada rentang <b>{periodLabel}</b> untuk seluruh sesi latihan tercatat.
              </p>
            </div>
            <button
              onClick={exportAttendance}
              disabled={loading}
              className="apple-btn w-full mt-4 cursor-pointer font-semibold text-xs py-2.5"
            >
              📥 Unduh Laporan Absensi
            </button>
          </div>

          {/* Card 4: Students Master Data */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-84 transition-all duration-300 hover:-translate-y-1 group"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                👥
              </div>
              <h3 className="font-bold text-base mb-1 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Data Master Siswa Aktif
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Ekspor seluruh data profil siswa karate aktif beserta tingkatan sabuk resmi, kontak wali, dan riwayat bergabung dojo.
              </p>
            </div>
            <button
              onClick={exportStudents}
              disabled={loading || students.length === 0}
              className="apple-btn w-full mt-4 cursor-pointer font-semibold text-xs py-2.5"
            >
              📥 Unduh Data Siswa
            </button>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
