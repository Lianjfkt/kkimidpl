'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Student, ExamParticipant, TournamentParticipant, BeltExam, Tournament } from '@/lib/mockData';
import Navigation from '@/components/Navigation';

export default function OrtuHistory() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [examParticipants, setExamParticipants] = useState<ExamParticipant[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<TournamentParticipant[]>([]);
  const [exams, setExams] = useState<BeltExam[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ujian' | 'turnamen'>('ujian');

  useEffect(() => {
    const load = async () => {
      const { data: studentsData } = await supabase.from('students').eq('parent_id', user?.id || 'user-parent-id').select();
      const childList = (studentsData || []) as Student[];
      setStudents(childList);
      const childIds = childList.map((s: Student) => s.id);

      const { data: examPData } = await supabase.from('exam_participants').select();
      const filteredExamP = ((examPData || []) as ExamParticipant[]).filter((ep: ExamParticipant) => childIds.includes(ep.student_id));
      setExamParticipants(filteredExamP);

      const { data: tournPData } = await supabase.from('tournament_participants').select();
      const filteredTournP = ((tournPData || []) as TournamentParticipant[]).filter((tp: TournamentParticipant) => childIds.includes(tp.student_id));
      setTournamentParticipants(filteredTournP);

      const { data: examsData } = await supabase.from('belt_exams').select();
      if (examsData) setExams(examsData as BeltExam[]);

      const { data: tournsData } = await supabase.from('tournaments').select();
      if (tournsData) setTournaments(tournsData as Tournament[]);

      setLoading(false);
    };
    load();
  }, [user?.id]);

  const getStudentName = (id: string) => students.find((s: Student) => s.id === id)?.full_name || '-';
  const getExamInfo = (id: string) => exams.find((e: BeltExam) => e.id === id);
  const getTournamentInfo = (id: string) => tournaments.find((t: Tournament) => t.id === id);

  const resultBadge = (result: string) => {
    switch (result) {
      case 'lulus': return { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' };
      case 'tidak_lulus': return { background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' };
      case 'pending': return { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' };
      default: return { background: 'var(--neu-surface-low)', color: 'var(--md-sys-color-on-surface-variant)', border: '1px solid var(--neu-border)' };
    }
  };

  const medalEmoji = (medal: string) => {
    switch (medal) {
      case 'emas': return '🥇';
      case 'perak': return '🥈';
      case 'perunggu': return '🥉';
      default: return '—';
    }
  };

  if (loading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Riwayat Anak
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Histori ujian kenaikan sabuk dan turnamen anak Anda.
          </p>
        </div>

        {/* Belt Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map((student: Student) => (
            <div key={student.id} className="rounded-3xl p-5 flex flex-col gap-3 border border-[var(--neu-border)] transition-all duration-200"
              style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat)'; e.currentTarget.style.transform = ''; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border border-[var(--neu-border)]"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-primary)' }}>
                  {student.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.full_name}</h3>
                  <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status: {student.status === 'active' ? '✅ Aktif' : student.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-2xl border border-[var(--neu-border)]"
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                <span className="text-lg">🥋</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tingkat Sabuk Saat Ini:</span>
                <span className="text-xs font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.current_belt}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Switcher — Neumorphic Segmented Control */}
        <div
          className="flex p-1.5 rounded-2xl gap-1 border border-[var(--neu-border)] w-fit"
          style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed)' }}
        >
          {(['ujian', 'turnamen'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
              style={
                activeTab === tab
                  ? { background: 'var(--neu-accent-grad)', boxShadow: 'var(--neu-shadow-accent)', color: '#fff' }
                  : { background: 'transparent', color: 'var(--md-sys-color-on-surface-variant)' }
              }
            >
              {tab === 'ujian' ? '🥋 Ujian Sabuk' : '🏆 Turnamen'}
            </button>
          ))}
        </div>

        {/* Ujian Tab */}
        {activeTab === 'ujian' && (
          <div className="rounded-3xl overflow-hidden border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
            <div className="px-6 py-4 border-b border-[var(--neu-border)]">
              <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Histori Ujian Kenaikan Sabuk</h3>
            </div>
            {examParticipants.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">🥋</span>
                <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada riwayat ujian</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                {examParticipants.map((ep: ExamParticipant) => {
                  const exam = getExamInfo(ep.exam_id);
                  const badgeStyle = resultBadge(ep.result);
                  return (
                    <div key={ep.id} className="p-5 transition-all duration-200"
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥋</span>
                          <h3 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{getStudentName(ep.student_id)}</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={badgeStyle}>
                          {ep.result === 'lulus' ? 'Lulus' : ep.result === 'tidak_lulus' ? 'Tidak Lulus' : 'Pending'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Dari:</span> {ep.current_belt}</div>
                        <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Ke:</span> {ep.target_belt}</div>
                        {exam && (
                          <>
                            <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tanggal:</span> {new Date(exam.exam_date).toLocaleDateString('id-ID')}</div>
                            <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Lokasi:</span> {exam.location}</div>
                          </>
                        )}
                      </div>
                      {ep.score_notes && (
                        <p className="text-xs mt-3 italic" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>&quot;{ep.score_notes}&quot;</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Turnamen Tab */}
        {activeTab === 'turnamen' && (
          <div className="rounded-3xl overflow-hidden border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
            <div className="px-6 py-4 border-b border-[var(--neu-border)]">
              <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pencapaian Turnamen</h3>
            </div>
            {tournamentParticipants.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">🏆</span>
                <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada riwayat turnamen</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                {tournamentParticipants.map((tp: TournamentParticipant) => {
                  const tourn = getTournamentInfo(tp.tournament_id);
                  return (
                    <div key={tp.id} className="p-5 transition-all duration-200"
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{medalEmoji(tp.medal)}</span>
                          <div>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{getStudentName(tp.student_id)}</h3>
                            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tourn?.name || '-'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize border border-[var(--neu-border)]"
                          style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {tp.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {tourn && (
                          <>
                            <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tanggal:</span> {tourn.tournament_date || tourn.start_date ? new Date(tourn.tournament_date || tourn.start_date || '').toLocaleDateString('id-ID') : '-'}</div>
                            <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Level:</span> <span className="capitalize">{tourn.level || 'lokal'}</span></div>
                          </>
                        )}
                        {tp.weight_class && <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Kelas:</span> {tp.weight_class}</div>}
                        {tp.result && <div><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Hasil:</span> {tp.result}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Navigation>
  );
}
