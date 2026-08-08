'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, ClassSession, StudentAttendance } from '@/lib/mockData';

export default function OwnerAttendanceRecap() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);

  const loadData = async () => {
    setLoading(true);
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    const { data: classesData } = await supabase.from('classes').select('*');
    const { data: attendanceData } = await supabase.from('attendance_students').select('*');

    if (studentsData) setStudents(studentsData);
    if (classesData) {
      setClasses(classesData);
      if (classesData.length > 0) setClassFilter(classesData[0].id);
    }
    if (attendanceData) setAttendance(attendanceData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getAttendanceStats = (studentId: string) => {
    const records = attendance.filter(a => {
      const aDate = new Date(a.session_date);
      const matchesClass = classFilter ? a.class_id === classFilter : true;
      const matchesMonth = aDate.getMonth() + 1 === Number(monthFilter);
      return a.student_id === studentId && matchesClass && matchesMonth;
    });

    const total = records.length;
    const hadir = records.filter(r => r.status === 'hadir').length;
    const izin = records.filter(r => r.status === 'izin').length;
    const sakit = records.filter(r => r.status === 'sakit').length;
    const alpha = records.filter(r => r.status === 'alpha').length;

    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;

    return { total, hadir, izin, sakit, alpha, percentage };
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Rekap Absensi Dojo
          </h2>
          <p className="body-text mt-1">
            Persentase dan rincian rekam kehadiran siswa karate per kelas bulanan.
          </p>
        </div>

        {/* Filters */}
        <div className="apple-card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Kelas</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Bulan</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
              value={monthFilter}
              onChange={(e) => setMonthFilter(Number(e.target.value))}
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Table */}
        <div className="apple-card overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)]">Memuat data absensi...</p>
          ) : students.length === 0 ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)] text-center">Belum ada data absensi terekam.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-hairline)] bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Siswa</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Sabuk</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-center">Total Sesi</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-center text-emerald-700">Hadir</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-center text-amber-600">Izin</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-center text-blue-600">Sakit</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-center text-red-600">Alpha</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-hairline)]">
                {students.map((student) => {
                  const stats = getAttendanceStats(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-primary)]">{student.full_name}</td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{student.current_belt}</td>
                      <td className="px-6 py-4 text-sm text-center text-[var(--color-text-primary)]">{stats.total}</td>
                      <td className="px-6 py-4 text-sm text-center text-emerald-700 font-semibold">{stats.hadir}</td>
                      <td className="px-6 py-4 text-sm text-center text-amber-600">{stats.izin}</td>
                      <td className="px-6 py-4 text-sm text-center text-blue-600">{stats.sakit}</td>
                      <td className="px-6 py-4 text-sm text-center text-red-600">{stats.alpha}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-[var(--color-text-primary)]">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          stats.percentage >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {stats.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Navigation>
  );
}
