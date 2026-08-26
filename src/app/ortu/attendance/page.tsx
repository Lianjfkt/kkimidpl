'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, StudentAttendance, ClassSession } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_CONFIG = {
  hadir:  { label: 'Hadir',  color: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]', dot: 'bg-emerald-500' },
  izin:   { label: 'Izin',   color: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]', dot: 'bg-blue-500' },
  sakit:  { label: 'Sakit',  color: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]', dot: 'bg-amber-500' },
  alpha:  { label: 'Alpha',  color: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]', dot: 'bg-red-500' },
};

export default function OrtuAttendance() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChild, setSelectedChild] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      const { data: kidsData } = await supabase
        .from('students')
        .eq('parent_id', user?.id || 'user-parent-id')
        .select('*');
      const kids = (kidsData || []) as Student[];
      setChildren(kids);
      if (kids.length > 0) setSelectedChild(kids[0].id);

      const kidIds = kids.map((k: Student) => k.id);
      if (kidIds.length > 0) {
        const { data: attData } = await supabase.from('attendance_students').select('*');
        setAttendance(((attData || []) as StudentAttendance[]).filter(a => kidIds.includes(a.student_id)));
      }

      const { data: classData } = await supabase.from('classes').select('*');
      if (classData) setClasses(classData as ClassSession[]);

      setLoading(false);
    };
    load();
  }, [user?.id]);

  const getClassName = (classId: string) =>
    classes.find(c => c.id === classId)?.name || classId;

  const filteredRecords = attendance.filter(a => {
    const d = new Date(a.session_date);
    return (
      a.student_id === selectedChild &&
      d.getMonth() + 1 === monthFilter &&
      d.getFullYear() === yearFilter
    );
  });

  const stats = {
    hadir: filteredRecords.filter(a => a.status === 'hadir').length,
    izin:  filteredRecords.filter(a => a.status === 'izin').length,
    sakit: filteredRecords.filter(a => a.status === 'sakit').length,
    alpha: filteredRecords.filter(a => a.status === 'alpha').length,
  };
  const total = filteredRecords.length;
  const pct = total > 0 ? Math.round((stats.hadir / total) * 100) : 100;

  const child = children.find(c => c.id === selectedChild);

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Rekap Absensi
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Riwayat kehadiran latihan anak Anda per bulan.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] grid grid-cols-1 sm:grid-cols-3 gap-4"
          style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '16px' }}>
          <div className="flex flex-col sm:col-span-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Atlet (Anak)</label>
            <div className="flex flex-wrap gap-2">
              {children.map(k => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSelectedChild(k.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedChild === k.id
                      ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                      : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]'
                  }`}
                >
                  🥋 {k.full_name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bulan</label>
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(Number(e.target.value))}
              className="m3-textfield-outlined text-sm"
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tahun</label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(Number(e.target.value))}
              className="m3-textfield-outlined text-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            {child && (
              <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-4"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                    {child.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{child.full_name}</h3>
                    <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {MONTHS[monthFilter - 1]} {yearFilter} &middot; {total} sesi tercatat
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-3xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{pct}%</p>
                    <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kehadiran</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--md-sys-color-surface-container-highest)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? 'var(--md-sys-color-tertiary)' : pct >= 60 ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-error)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="rounded-xl px-3 py-3 flex flex-col items-center justify-center" style={{ background: cfg.color.split(' ')[0] }}>
                      <p className="text-2xl font-bold leading-none" style={{ color: cfg.color.split(' ')[1] }}>{stats[key as keyof typeof stats]}</p>
                      <p className="text-xs font-semibold mt-1.5" style={{ color: cfg.color.split(' ')[1] }}>{cfg.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail Records */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Detail Per Sesi
                </h3>
              </div>
              {filteredRecords.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">📭</span>
                  <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada data absensi untuk periode ini</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                  {filteredRecords
                    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
                    .map(rec => {
                      const cfg = STATUS_CONFIG[rec.status as keyof typeof STATUS_CONFIG];
                      return (
                        <div key={rec.id} className="flex items-center justify-between py-4 px-6 transition-colors hover:bg-[var(--md-sys-color-surface-container)]">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {new Date(rec.session_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{getClassName(rec.class_id)}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold" style={cfg ? { background: cfg.color.split(' ')[0], color: cfg.color.split(' ')[1] } : {}}>
                            {cfg?.label || rec.status}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Navigation>
  );
}
