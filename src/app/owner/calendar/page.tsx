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
        list.push({ type: 'class', label: `🥋 ${c.name}`, bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' });
      }
    });

    // Check exams
    exams.forEach(e => {
      if (e.exam_date === dateStr) {
        list.push({ type: 'exam', label: `📝 Ujian: ${e.location}`, bg: 'rgba(234, 88, 12, 0.15)', text: '#fb923c', border: 'rgba(234, 88, 12, 0.3)' });
      }
    });

    // Check tournaments
    tournaments.forEach(t => {
      const tourneyDate = t.tournament_date || t.start_date;
      if (tourneyDate === dateStr) {
        list.push({ type: 'tournament', label: `🏆 ${t.name}`, bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' });
      }
    });

    return list;
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Kalender Akademik Dojo
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Jadwal rutin kelas karate, pelaksanaan ujian kenaikan tingkat sabuk, dan turnamen.
            </p>
          </div>
          
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-[var(--neu-border)] w-fit"
            style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
          >
            <button
              onClick={prevMonth}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat-sm)', color: 'var(--md-sys-color-on-surface)' }}
            >
              ⟨ Prev
            </button>
            <span className="text-xs font-bold px-3 text-[var(--md-sys-color-on-surface)]">{months[month]} {year}</span>
            <button
              onClick={nextMonth}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat-sm)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Next ⟩
            </button>
          </div>
        </div>

        {/* Legend */}
        <div
          className="flex flex-wrap items-center gap-5 text-xs p-4 rounded-3xl border border-[var(--neu-border)]"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Keterangan:
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-lg bg-blue-500/20 border border-blue-500/40" />
            <span className="font-semibold text-blue-400">Latihan Rutin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-lg bg-orange-500/20 border border-orange-500/40" />
            <span className="font-semibold text-orange-400">Ujian Sabuk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-lg bg-red-500/20 border border-red-500/40" />
            <span className="font-semibold text-red-400">Turnamen / Event</span>
          </div>
        </div>

        {/* Grid Calendar */}
        <div
          className="rounded-3xl border border-[var(--neu-border)] p-6 overflow-x-auto shadow-2xl"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          <div className="min-w-[650px]">
            <div
              className="grid grid-cols-7 gap-3 text-center font-bold text-xs pb-3 border-b border-[var(--neu-border)] mb-3"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {days.map(d => <div key={d} className="uppercase tracking-wider">{d}</div>)}
            </div>
            
            {loading ? (
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl animate-pulse"
                    style={{ background: 'var(--neu-surface-low)' }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((day, idx) => {
                  const evs = day ? getEventsForDate(day) : [];
                  const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  
                  if (!day) {
                    return <div key={idx} className="min-h-28 p-2 rounded-2xl opacity-20" />;
                  }

                  return (
                    <div
                      key={idx}
                      className={`min-h-28 p-3 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 border ${
                        isToday
                          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 shadow-lg'
                          : 'border-[var(--neu-border)]'
                      }`}
                      style={{
                        background: isToday ? 'var(--neu-surface-high)' : 'var(--neu-surface-low)',
                        boxShadow: isToday ? 'var(--neu-shadow-hover)' : 'var(--neu-shadow-pressed-sm)'
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${isToday ? 'text-[var(--md-sys-color-primary)] font-extrabold' : 'text-[var(--md-sys-color-on-surface)]'}`}>
                          {day}
                        </span>
                        {isToday && (
                          <span
                            className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'var(--neu-accent-grad)', boxShadow: 'var(--neu-shadow-accent)' }}
                          >
                            Hari Ini
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {evs.map((e, eIdx) => (
                          <div
                            key={eIdx}
                            className="text-[10px] px-2 py-1 rounded-xl font-bold truncate border transition-transform hover:scale-102"
                            style={{ background: e.bg, color: e.text, borderColor: e.border }}
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
