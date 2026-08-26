'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { ClassSession, Student, Coach } from '@/lib/mockData';

const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const categoryColors: Record<string, React.CSSProperties> = {
  kompetisi: { background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' },
  remaja: { background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' },
  anak: { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' },
};

export default function PelatihDashboard() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: coachData } = await supabase.from('coaches').eq('profile_id', userData.user.id).single();
      if (coachData) {
        setCoach(coachData);
        const { data: classesData } = await supabase.from('classes').eq('coach_id', coachData.id).select('*');
        if (classesData) setClasses(classesData);
      }
    }
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    if (studentsData) setStudents(studentsData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const todayDayOfWeek = new Date().getDay();
  const todayClasses = classes.filter(cls => cls.day_of_week === todayDayOfWeek);
  const otherClasses = classes.filter(cls => cls.day_of_week !== todayDayOfWeek);

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Halo, Sempai {coach ? coach.full_name.split(' ')[1] || coach.full_name.split(' ')[0] : 'Pelatih'} 👋
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Selamat berlatih hari ini! Berikut jadwal kelas dan aksi cepat untuk Anda.
          </p>
        </div>

        {/* Coach info strip */}
        {coach && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Tingkat Sabuk', value: coach.belt_level },
              { label: 'Siswa Dojo Aktif', value: `${students.length} Siswa` },
              { label: 'Jumlah Kelas Saya', value: `${classes.length} Jadwal Sesi` },
            ].map(({ label, value }) => (
              <div key={label} className="m3-card-filled animate-fade-in" style={{ padding: '20px' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
                <p className="text-xl font-bold mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Class schedule */}
        <div className="space-y-6">
          {/* Today's Classes Highlight */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--md-sys-color-primary)' }}>Kelas Latihan Hari Ini</h3>
            {loading ? (
              <div className="h-40 rounded-[var(--md-sys-shape-corner-extra-large)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />
            ) : todayClasses.length === 0 ? (
              <div className="p-5 rounded-[var(--md-sys-shape-corner-large)] border border-dashed flex flex-col items-center justify-center text-center py-8"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-lowest)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada jadwal mengajar untuk hari ini. Waktunya istirahat atau latihan mandiri!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6 flex flex-col gap-4 border border-[var(--md-sys-color-primary)] shadow-md"
                    style={{ background: 'var(--md-sys-color-surface-container-high)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{cls.name}</h4>
                      <span className="px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold capitalize flex-shrink-0"
                        style={categoryColors[cls.category] ?? categoryColors.anak}>
                        {cls.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4.5 h-4.5" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-[var(--md-sys-color-primary)]">{cls.time_start} – {cls.time_end}</span>
                      </div>
                    </div>

                    <div className="pt-3" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <a
                        href={`/pelatih/attendance?classId=${cls.id}`}
                        className="m3-btn-filled w-full py-2.5 text-sm font-semibold text-center flex items-center justify-center cursor-pointer"
                        style={{ background: 'var(--md-sys-color-primary)' }}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Mulai Isi Absensi Hari Ini
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other Classes */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Jadwal Sesi Lainnya</h3>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => <div key={i} className="h-40 rounded-[var(--md-sys-shape-corner-extra-large)] animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}
              </div>
            ) : otherClasses.length === 0 ? (
              <p className="text-sm text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada sesi latihan lainnya.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-4"
                    style={{ background: 'var(--md-sys-color-surface-container-low)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>{cls.name}</h4>
                      <span className="px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold capitalize flex-shrink-0"
                        style={categoryColors[cls.category] ?? categoryColors.anak}>
                        {cls.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{days[cls.day_of_week]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{cls.time_start} – {cls.time_end}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <a
                        href={`/pelatih/attendance?classId=${cls.id}`}
                        className="m3-btn-outlined w-full py-2 text-xs font-semibold text-center flex items-center justify-center cursor-pointer"
                      >
                        Lihat / Edit Absensi
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Navigation>
  );
}
