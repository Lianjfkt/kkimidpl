'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, StudentAttendance } from '@/lib/mockData';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
  };

  const exportStudents = () => {
    const headers = 'ID,Nama Lengkap,Tanggal Lahir,Jenis Kelamin,Sabuk Saat Ini,Status,Tanggal Bergabung,No Telepon,Spesialisasi\n';
    const rows = students.map(s => 
      `"${s.id}","${s.full_name}","${s.dob}","${s.gender}","${s.current_belt}","${s.status}","${s.join_date}","${s.phone || ''}","${s.specialization || ''}"`
    ).join('\n');
    downloadCSV(headers + rows, `Siswa_Dojo_KKI_DPL_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportFees = () => {
    const filtered = fees.filter(f => f.period_month === selectedMonth && f.period_year === selectedYear);
    const headers = 'ID,Nama Siswa,Nominal,Status Pembayaran,Tanggal Bayar,Metode Pembayaran,Catatan\n';
    const rows = filtered.map(f => {
      const sName = students.find(s => s.id === f.student_id)?.full_name || 'Tidak Diketahui';
      return `"${f.id}","${sName}","${f.amount}","${f.status}","${f.paid_date || ''}","${f.payment_method || ''}","${f.notes || ''}"`;
    }).join('\n');
    downloadCSV(headers + rows, `Iuran_Dojo_${months[selectedMonth - 1]}_${selectedYear}.csv`);
  };

  const exportAttendance = () => {
    const headers = 'Tanggal,Nama Siswa,Status Kehadiran\n';
    const rows = attendance
      .filter(a => {
        const d = new Date(a.session_date);
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      })
      .map(a => {
        const sName = students.find(s => s.id === a.student_id)?.full_name || 'Tidak Diketahui';
        return `"${a.session_date}","${sName}","${a.status}"`;
      }).join('\n');
    downloadCSV(headers + rows, `Kehadiran_Dojo_${months[selectedMonth - 1]}_${selectedYear}.csv`);
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Laporan &amp; Ekspor Data
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Ekspor rekap data dojo karate KKI DPL ke format CSV/Excel untuk pengarsipan dan pembukuan luar jaringan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Students */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-72 transition-all duration-300 hover:-translate-y-1 group"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                🥋
              </div>
              <h3 className="font-bold text-lg mb-2 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>Daftar Siswa Aktif</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Ekspor seluruh data profil siswa karate aktif saat ini beserta tingkatan sabuk dan riwayat bergabung.
              </p>
            </div>
            <button
              onClick={exportStudents}
              disabled={loading || students.length === 0}
              className="apple-btn w-full mt-4 cursor-pointer font-semibold"
            >
              📥 Unduh Data Siswa
            </button>
          </div>

          {/* Card 2: Fees */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-72 transition-all duration-300 hover:-translate-y-1 group"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                💳
              </div>
              <h3 className="font-bold text-lg mb-2 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>Laporan Iuran Bulanan</h3>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Unduh rekapitulasi status pembayaran iuran siswa karate per bulan terpilih.
              </p>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs flex-1 outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                >
                  {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs w-24 outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                >
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={exportFees}
              disabled={loading}
              className="apple-btn w-full mt-4 cursor-pointer font-semibold"
            >
              📥 Unduh Laporan Iuran
            </button>
          </div>

          {/* Card 3: Attendance */}
          <div
            className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between h-72 transition-all duration-300 hover:-translate-y-1 group"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--neu-surface-high)', boxShadow: 'var(--neu-shadow-flat-sm)' }}
              >
                📋
              </div>
              <h3 className="font-bold text-lg mb-2 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>Laporan Absensi Siswa</h3>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Unduh rekapitulasi kehadiran (Hadir, Izin, Sakit, Alpha) seluruh siswa karate per bulan terpilih.
              </p>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs flex-1 outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                >
                  {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs w-24 outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                >
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={exportAttendance}
              disabled={loading}
              className="apple-btn w-full mt-4 cursor-pointer font-semibold"
            >
              📥 Unduh Laporan Absensi
            </button>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
