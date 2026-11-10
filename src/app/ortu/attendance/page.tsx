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
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data: kidsData } = await supabase
        .from('students')
        .eq('parent_id', user.id)
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
        <div className="rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 border border-[var(--neu-border)] p-5"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
          <div className="flex flex-col sm:col-span-3">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Atlet (Anak)</label>
            <div className="flex flex-wrap gap-2">
              {children.map(k => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSelectedChild(k.id)}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border border-[var(--neu-border)]"
                  style={selectedChild === k.id
                    ? { background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: 'var(--neu-shadow-accent)' }
                    : { background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }
                  }
                >
                  🥋 {k.full_name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bulan</label>
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                border: '1px solid var(--neu-border)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tahun</label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                border: '1px solid var(--neu-border)',
                color: 'var(--md-sys-color-on-surface)',
              }}
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
              <div className="rounded-3xl p-6 flex flex-col gap-5 border border-[var(--neu-border)]"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-primary)' }}>
                    {child.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl" style={{ color: 'var(--md-sys-color-on-surface)' }}>{child.full_name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {MONTHS[monthFilter - 1]} {yearFilter} &middot; {total} sesi tercatat
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-3xl font-black" style={{ color: 'var(--md-sys-color-primary)' }}>{pct}%</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tingkat Hadir</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? 'linear-gradient(145deg, #10b981, #059669)' : pct >= 60 ? 'linear-gradient(145deg, #f59e0b, #d97706)' : 'var(--neu-accent-grad)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Hadir', count: stats.hadir, bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' },
                    { label: 'Izin', count: stats.izin, bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
                    { label: 'Sakit', count: stats.sakit, bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
                    { label: 'Alpha', count: stats.alpha, bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
                  ].map(({ label, count, bg, text, border }) => (
                    <div key={label} className="rounded-2xl p-3 flex flex-col items-center justify-center border"
                      style={{ background: bg, borderColor: border, boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                      <p className="text-2xl font-black leading-none" style={{ color: text }}>{count}</p>
                      <p className="text-xs font-semibold mt-1.5" style={{ color: text }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail Records */}
            <div className="rounded-3xl overflow-hidden border border-[var(--neu-border)]"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
              <div className="px-6 py-4 border-b border-[var(--neu-border)]">
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Detail Per Sesi Latihan
                </h3>
              </div>
              {filteredRecords.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">📭</span>
                  <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada data absensi untuk periode ini</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                  {filteredRecords
                    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
                    .map(rec => {
                      const cfg = STATUS_CONFIG[rec.status as keyof typeof STATUS_CONFIG];
                      return (
                        <div key={rec.id} className="flex items-center justify-between py-4 px-6 transition-all duration-200"
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {new Date(rec.session_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{getClassName(rec.class_id)}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize border border-[var(--neu-border)]"
                            style={{
                              background: rec.status === 'hadir' ? 'rgba(52,211,153,0.15)' : rec.status === 'izin' ? 'rgba(96,165,250,0.15)' : rec.status === 'sakit' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                              color: rec.status === 'hadir' ? '#34d399' : rec.status === 'izin' ? '#60a5fa' : rec.status === 'sakit' ? '#fbbf24' : '#f87171',
                              boxShadow: 'var(--neu-shadow-pressed-sm)',
                            }}>
                            {rec.status}
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
