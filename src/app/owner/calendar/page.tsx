'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { ClassSession, BeltExam, Tournament } from '@/lib/mockData';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function CalendarPage() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [exams, setExams] = useState<BeltExam[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [classRes, examRes, tournRes] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('belt_exams').select('*'),
        supabase.from('tournaments').select('*'),
      ]);
      if (classRes.data) setClasses(classRes.data);
      if (examRes.data) setExams(examRes.data);
      if (tournRes.data) setTournaments(tournRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  // Empty spaces for previous month's padding
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (dateNum: number) => {
    if (!dateNum) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, dateNum).getDay();

    const list: any[] = [];
    
    // Check classes (weekly recurring)
    classes.forEach(c => {
      if (c.day_of_week === dayOfWeek) {
        list.push({ type: 'class', label: `🥋 ${c.name}`, color: 'var(--md-sys-color-secondary-container)' });
      }
    });

    // Check exams
    exams.forEach(e => {
      if (e.exam_date === dateStr) {
        list.push({ type: 'exam', label: `📝 Ujian: ${e.location}`, color: 'var(--md-sys-color-tertiary-container)' });
      }
    });

    // Check tournaments
    tournaments.forEach(t => {
      if (t.tournament_date === dateStr) {
        list.push({ type: 'tournament', label: `🏆 ${t.name}`, color: 'var(--md-sys-color-primary-container)' });
      }
    });

    return list;
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Kalender Akademik Dojo
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Jadwal rutin kelas karate, pelaksanaan ujian kenaikan tingkat sabuk, dan turnamen.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-full w-fit">
            <button onClick={prevMonth} className="px-3.5 py-1.5 rounded-full hover:bg-black/10 text-xs font-semibold cursor-pointer">⟨ Prev</button>
            <span className="text-xs font-bold px-3 text-[var(--md-sys-color-on-surface)]">{months[month]} {year}</span>
            <button onClick={nextMonth} className="px-3.5 py-1.5 rounded-full hover:bg-black/10 text-xs font-semibold cursor-pointer">Next ⟩</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md" style={{ background: 'var(--md-sys-color-secondary-container)' }} />
            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Latihan Rutin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md" style={{ background: 'var(--md-sys-color-tertiary-container)' }} />
            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Ujian Sabuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md" style={{ background: 'var(--md-sys-color-primary-container)' }} />
            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Turnamen / Event</span>
          </div>
        </div>

        {/* Grid Calendar */}
        <div className="m3-card-elevated p-4 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs pb-3 border-b mb-3" style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}>
              {days.map(d => <div key={d}>{d}</div>)}
            </div>
            
            {loading ? (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const evs = day ? getEventsForDate(day) : [];
                  const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  
                  return (
                    <div
                      key={idx}
                      className="min-h-24 p-2 rounded-xl flex flex-col justify-between border"
                      style={{
                        background: isToday ? 'var(--md-sys-color-surface-container-highest)' : 'var(--md-sys-color-surface-container-lowest)',
                        borderColor: isToday ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-semibold ${isToday ? 'text-[var(--md-sys-color-primary)] font-extrabold' : 'text-[var(--md-sys-color-on-surface)]'}`}>
                          {day || ''}
                        </span>
                        {isToday && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">Hari Ini</span>}
                      </div>

                      <div className="space-y-1 mt-2">
                        {evs.map((e, eIdx) => (
                          <div
                            key={eIdx}
                            className="text-[9px] p-1 rounded font-semibold truncate"
                            style={{ background: e.color, color: 'var(--md-sys-color-on-surface)' }}
                            title={e.label}
                          >
                            {e.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Navigation>
  );
}
