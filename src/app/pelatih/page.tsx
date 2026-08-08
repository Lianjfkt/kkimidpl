'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { ClassSession, Student, Coach } from '@/lib/mockData';

export default function PelatihDashboard() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const getDayName = (dayIndex: number) => {
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex];
  };

  const loadData = async () => {
    setLoading(true);
    // Get coach profile
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: coachData } = await supabase
        .from('coaches')
        .eq('profile_id', userData.user.id)
        .single();
      
      if (coachData) {
        setCoach(coachData);

        // Load classes under this coach
        const { data: classesData } = await supabase
          .from('classes')
          .eq('coach_id', coachData.id)
          .select('*');
        if (classesData) setClasses(classesData);
      }
    }

    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    if (studentsData) setStudents(studentsData);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Navigation>
      <div className="space-y-6">
        <div>
          <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Halo Sempai, {coach ? coach.full_name : 'Pelatih'}
          </h2>
          <p className="body-text mt-1">
            Selamat berlatih hari ini! Berikut jadwal kelas dan aksi cepat untuk Anda.
          </p>
        </div>

        {/* Coach Info Card */}
        {coach && (
          <div className="apple-card grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tingkat Sabuk</span>
              <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{coach.belt_level}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Siswa Dojo Aktif</span>
              <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{students.length} Siswa</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Jumlah Kelas Saya</span>
              <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{classes.length} Jadwal Sesi</p>
            </div>
          </div>
        )}

        {/* Schedule grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Jadwal Kelas Saya
          </h3>

          {loading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Memuat kelas...</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Anda belum terdaftar mengajar di kelas manapun.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {classes.map((cls) => (
                <div key={cls.id} className="apple-card flex flex-col justify-between h-48">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg text-[var(--color-text-primary)]">{cls.name}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-amber-50 text-[var(--color-status-warning)] border border-amber-200">
                        {cls.category}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                      📅 Hari: {getDayName(cls.day_of_week)}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      ⏰ Jam: {cls.time_start} - {cls.time_end}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border-hairline)] flex justify-end">
                    <a
                      href={`/pelatih/attendance?classId=${cls.id}`}
                      className="apple-btn px-4 py-2 text-xs font-semibold"
                    >
                      ✏️ Isi Absensi Sekarang
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
