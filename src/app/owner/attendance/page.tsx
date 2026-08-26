'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, ClassSession, StudentAttendance } from '@/lib/mockData';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function OwnerAttendanceRecap() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [classFilter, setClassFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);

  const loadData = async () => {
    setLoading(true);
    const [studRes, clsRes, attRes] = await Promise.all([
      supabase.from('students').eq('status', 'active').select('*'),
      supabase.from('classes').select('*'),
      supabase.from('attendance_students').select('*'),
    ]);
    if (studRes.data) setStudents(studRes.data);
    if (clsRes.data) {
      setClasses(clsRes.data);
      if (clsRes.data.length > 0) setClassFilter(clsRes.data[0].id);
    }
    if (attRes.data) setAttendance(attRes.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStats = (studentId: string) => {
    const records = attendance.filter((a) => {
      const aDate = new Date(a.session_date);
      return a.student_id === studentId &&
        (classFilter ? a.class_id === classFilter : true) &&
        aDate.getMonth() + 1 === Number(monthFilter);
    });
    const total = records.length;
    const hadir = records.filter((r) => r.status === 'hadir').length;
    const izin = records.filter((r) => r.status === 'izin').length;
    const sakit = records.filter((r) => r.status === 'sakit').length;
    const alpha = records.filter((r) => r.status === 'alpha').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return { total, hadir, izin, sakit, alpha, percentage };
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Rekap Absensi Dojo
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Persentase dan rincian rekam kehadiran siswa karate per kelas bulanan.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '16px' }}>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Kelas</label>
            <select className="m3-textfield-outlined text-sm" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">Semua Kelas</option>
              {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Bulan</label>
            <select className="m3-textfield-outlined text-sm" value={monthFilter} onChange={(e) => setMonthFilter(Number(e.target.value))}>
              {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada data absensi terekam.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    {[
                      { label: 'Nama Siswa', align: '' },
                      { label: 'Sabuk', align: '' },
                      { label: 'Total Sesi', align: 'text-center' },
                      { label: 'Hadir', align: 'text-center' },
                      { label: 'Izin', align: 'text-center' },
                      { label: 'Sakit', align: 'text-center' },
                      { label: 'Alpha', align: 'text-center' },
                      { label: 'Persentase', align: 'text-right' },
                    ].map(({ label, align }) => (
                      <th key={label} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${align}`}
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const stats = getStats(student.id);
                    return (
                      <tr key={student.id}
                        style={{ borderBottom: idx < students.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                        <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[var(--md-sys-shape-corner-full)] flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                              {student.full_name.charAt(0)}
                            </div>
                            {student.full_name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.current_belt}</td>
                        <td className="px-5 py-4 text-sm text-center font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{stats.total}</td>
                        <td className="px-5 py-4 text-sm text-center font-semibold" style={{ color: 'var(--md-sys-color-tertiary)' }}>{stats.hadir}</td>
                        <td className="px-5 py-4 text-sm text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{stats.izin}</td>
                        <td className="px-5 py-4 text-sm text-center" style={{ color: 'var(--md-sys-color-secondary)' }}>{stats.sakit}</td>
                        <td className="px-5 py-4 text-sm text-center" style={{ color: 'var(--md-sys-color-error)' }}>{stats.alpha}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold"
                            style={stats.percentage >= 80
                              ? { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }
                              : { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }
                            }>
                            {stats.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
