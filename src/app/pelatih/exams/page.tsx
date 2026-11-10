'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { BeltExam, ExamParticipant, Tournament, TournamentParticipant, Student, Coach } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { OFFICIAL_BELTS, getBeltEmoji, getNextBelt } from '@/lib/constants/belts';

const BELTS = OFFICIAL_BELTS.filter((b) => b !== 'Putih');
const MEDALS = ['emas', 'perak', 'perunggu', 'none'] as const;

function M3Dialog({ open, onClose, title, maxWidth = 'max-w-lg', children }: { open: boolean; onClose: () => void; title: string; maxWidth?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className={`w-full ${maxWidth} rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-fade-in max-h-[90vh] flex flex-col`}
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-slate-500/10"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-medium mb-1.5';
const fieldWrap = 'flex flex-col';

export default function PelatihExams() {
  const { user } = useAuth();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<BeltExam[]>([]);
  const [participants, setParticipants] = useState<ExamParticipant[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournParticipants, setTournParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ujian' | 'turnamen'>('ujian');

  // Register exam participant modal
  const [regExamModal, setRegExamModal] = useState(false);
  const [selExamId, setSelExamId] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [filterBelt, setFilterBelt] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customTargetBelts, setCustomTargetBelts] = useState<Record<string, string>>({});
  const [submittingBatchExam, setSubmittingBatchExam] = useState(false);

  // Register tournament participant modal
  const [regTournModal, setRegTournModal] = useState(false);
  const [selTournId, setSelTournId] = useState('');
  const [selTournStudentId, setSelTournStudentId] = useState('');
  const [tournCategory, setTournCategory] = useState<'kata' | 'kumite'>('kata');
  const [tournWeightClass, setTournWeightClass] = useState('');

  // Input result modal
  const [resultModal, setResultModal] = useState<{ type: 'exam' | 'tourn'; id: string } | null>(null);
  const [examResult, setExamResult] = useState<'lulus' | 'tidak_lulus'>('lulus');
  const [examNotes, setExamNotes] = useState('');
  const [tournResult, setTournResult] = useState('');
  const [tournMedal, setTournMedal] = useState<typeof MEDALS[number]>('none');

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: coachData } = await supabase.from('coaches').eq('profile_id', userData.user.id).maybeSingle();
      if (coachData) setCoach(coachData as Coach);
    }
    const { data: studentsData } = await supabase.from('students').select('*');
    const { initialStudents } = await import('@/lib/mockData');
    const allSt = (studentsData && studentsData.length > 0) ? studentsData : initialStudents;
    const activeSt = allSt.filter((s: any) => s.status === 'active' || !s.status);
    const finalSt = activeSt.length > 0 ? activeSt : allSt;
    setStudents(finalSt as Student[]);
    if (finalSt.length > 0) {
      setSelTournStudentId(finalSt[0].id);
    }
    const { data: examsData } = await supabase.from('belt_exams').select('*');
    if (examsData) {
      setExams(examsData as BeltExam[]);
      setSelExamId((examsData[0] as BeltExam)?.id || '');
    }
    const { data: partData } = await supabase.from('exam_participants').select('*');
    if (partData) setParticipants(partData as ExamParticipant[]);

    const { data: tournsData } = await supabase.from('tournaments').select('*');
    if (tournsData) {
      setTournaments(tournsData as Tournament[]);
      setSelTournId((tournsData[0] as Tournament)?.id || '');
    }
    const { data: tpData } = await supabase.from('tournament_participants').select('*');
    if (tpData) setTournParticipants(tpData as TournamentParticipant[]);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleOpenBatchExamModal = () => {
    setSelectedStudentIds([]);
    setSearchStudent('');
    setFilterBelt('all');
    setCustomTargetBelts({});
    setRegExamModal(true);
  };

  const registeredExamStudentIds = useMemo(() => {
    return new Set(participants.filter(p => p.exam_id === selExamId).map(p => p.student_id));
  }, [participants, selExamId]);

  const availableExamStudents = useMemo(() => {
    return students.filter(s => !registeredExamStudentIds.has(s.id));
  }, [students, registeredExamStudentIds]);

  const filteredExamStudents = useMemo(() => {
    return availableExamStudents.filter(s => {
      const matchSearch = s.full_name.toLowerCase().includes(searchStudent.toLowerCase());
      const matchBelt = filterBelt === 'all' || s.current_belt === filterBelt;
      return matchSearch && matchBelt;
    });
  }, [availableExamStudents, searchStudent, filterBelt]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredExamStudents.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleRegisterExamParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selExamId || selectedStudentIds.length === 0) {
      alert('Pilih jadwal ujian dan minimal satu siswa.');
      return;
    }
    setSubmittingBatchExam(true);

    const newParticipants = selectedStudentIds.map(studentId => {
      const st = students.find(s => s.id === studentId);
      const curBelt = st?.current_belt || 'Putih';
      const tgtBelt = customTargetBelts[studentId] || getNextBelt(curBelt);
      return {
        exam_id: selExamId,
        student_id: studentId,
        current_belt: curBelt,
        target_belt: tgtBelt,
        result: 'pending',
        status: 'daftar',
        score_notes: '',
      };
    });

    let { error } = await supabase.from('exam_participants').insert(newParticipants);
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const fallbackPart = newParticipants.map(p => ({
        exam_id: p.exam_id,
        student_id: p.student_id,
        target_belt: p.target_belt,
        status: 'daftar'
      }));
      const retry = await supabase.from('exam_participants').insert(fallbackPart);
      error = retry.error;
    }

    if (error) {
      alert(`Gagal mendaftarkan peserta: ${error.message}`);
      setSubmittingBatchExam(false);
      return;
    }

    setRegExamModal(false);
    setSelectedStudentIds([]);
    setSubmittingBatchExam(false);
    loadData();
  };

  const handleRegisterTournParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selTournId || !selTournStudentId) return;
    const newPart = {
      tournament_id: selTournId,
      student_id: selTournStudentId,
      category: tournCategory,
      weight_class: tournWeightClass || null,
      result: 'Berpartisipasi',
      status: 'daftar',
      medal: 'none',
    };
    let { error } = await supabase.from('tournament_participants').insert(newPart);
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const fallbackPart = {
        tournament_id: selTournId,
        student_id: selTournStudentId,
        category: tournCategory,
        status: 'daftar',
        result: 'Berpartisipasi'
      };
      const retry = await supabase.from('tournament_participants').insert(fallbackPart);
      error = retry.error;
    }
    if (error) {
      alert(`Gagal mendaftarkan atlet: ${error.message}`);
      return;
    }
    setRegTournModal(false);
    loadData();
  };

  const handleSubmitExamResult = async () => {
    if (!resultModal) return;
    const part = participants.find(p => p.id === resultModal.id);
    if (!part) return;
    let { error } = await supabase.from('exam_participants').eq('id', resultModal.id).update({
      result: examResult,
      status: examResult === 'lulus' ? 'lulus' : 'tidak_lulus',
      score_notes: examNotes,
    });
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const retry = await supabase.from('exam_participants').eq('id', resultModal.id).update({
        status: examResult === 'lulus' ? 'lulus' : 'tidak_lulus',
      });
      error = retry.error;
    }
    if (error) {
      alert(`Gagal menyimpan hasil: ${error.message}`);
      return;
    }
    if (examResult === 'lulus') {
      await supabase.from('students').eq('id', part.student_id).update({ current_belt: part.target_belt });
      const student = students.find(s => s.id === part.student_id);
      if (student && student.parent_id) {
        try {
          await supabase.from('notifications').insert({
            id: `notif-${Date.now()}-${student.id}`,
            user_id: student.parent_id,
            title: 'Hasil Ujian Kenaikan Sabuk',
            message: `Selamat! ${student.full_name} dinyatakan LULUS dan naik ke sabuk ${part.target_belt}.`,
            type: 'ujian',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Gagal notifikasi ortu:', e);
        }
      }
    }
    setResultModal(null);
    setExamNotes('');
    loadData();
  };

  const handleSubmitTournResult = async () => {
    if (!resultModal) return;
    let { error } = await supabase.from('tournament_participants').eq('id', resultModal.id).update({
      result: tournResult || (tournMedal !== 'none' ? `Juara Medali ${tournMedal}` : 'Berpartisipasi'),
      medal: tournMedal,
    });
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const retry = await supabase.from('tournament_participants').eq('id', resultModal.id).update({
        result: tournResult || (tournMedal !== 'none' ? `Juara Medali ${tournMedal}` : 'Berpartisipasi'),
      });
      error = retry.error;
    }
    if (error) {
      alert(`Gagal menyimpan hasil turnamen: ${error.message}`);
      return;
    }
    const tp = tournParticipants.find(p => p.id === resultModal.id);
    if (tp) {
      const student = students.find(s => s.id === tp.student_id);
      if (student && student.parent_id) {
        try {
          await supabase.from('notifications').insert({
            id: `notif-${Date.now()}-${student.id}`,
            user_id: student.parent_id,
            title: 'Hasil Turnamen',
            message: `Hasil turnamen untuk ${student.full_name}: ${tournResult}${tournMedal !== 'none' ? ` — Meraih medali ${tournMedal}! 🏅` : ''}.`,
            type: 'turnamen',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Gagal notifikasi ortu:', e);
        }
      }
    }
    setResultModal(null);
    loadData();
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.full_name || '-';
  const medalEmoji: Record<string, string> = { emas: '🥇', perak: '🥈', perunggu: '🥉', none: '—' };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Ujian & Turnamen
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftarkan siswa dan input hasil ujian sabuk serta turnamen.
            </p>
          </div>
          <button
            onClick={() => activeTab === 'ujian' ? handleOpenBatchExamModal() : setRegTournModal(true)}
            className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {activeTab === 'ujian' ? 'Daftarkan Peserta Ujian (Banyak/Satuan)' : 'Daftarkan Peserta'}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          {(['ujian', 'turnamen'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'm3-btn-filled'
                  : 'm3-btn-outlined'
              }`}
            >
              {tab === 'ujian' ? '🥋 Ujian Sabuk' : '🏆 Turnamen'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
          </div>
        ) : activeTab === 'ujian' ? (
          <>
            {/* Exam selector */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="flex flex-col w-full sm:w-80">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Jadwal Ujian</label>
                <select
                  value={selExamId}
                  onChange={e => setSelExamId(e.target.value)}
                  className={inputClass}
                >
                  {exams.length === 0 && <option value="">Belum ada jadwal ujian</option>}
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_date} — {ex.location}</option>)}
                </select>
              </div>
            </div>

            {/* Participants list */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Daftar Peserta Ujian</h3>
              </div>
              {participants.filter(p => p.exam_id === selExamId).length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">🥋</span>
                  <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada peserta terdaftar di ujian ini</p>
                </div>
              ) : (
                <div className="divide-y animate-fade-in" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                  {participants.filter(p => p.exam_id === selExamId).map(part => (
                    <div key={part.id} className="flex items-center justify-between py-4 px-6 transition-colors hover:bg-[var(--md-sys-color-surface-container)]">
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentName(part.student_id)}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{part.current_belt} → <span className="font-semibold" style={{ color: 'var(--md-sys-color-primary)' }}>{part.target_belt}</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold"
                          style={
                            part.result === 'lulus' ? { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' } :
                            part.result === 'tidak_lulus' ? { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' } :
                            { background: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface-variant)' }
                          }>
                          {part.result === 'lulus' ? 'Lulus' : part.result === 'tidak_lulus' ? 'Tidak Lulus' : 'Tertunda'}
                        </span>
                        {part.result === 'pending' && (
                          <button
                            onClick={() => { setResultModal({ type: 'exam', id: part.id }); setExamResult('lulus'); setExamNotes(''); }}
                            className="m3-btn-text py-1.5 px-3 text-xs font-semibold"
                          >
                            Input Hasil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Tournament selector */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="flex flex-col w-full sm:w-80">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Turnamen</label>
                <select
                  value={selTournId}
                  onChange={e => setSelTournId(e.target.value)}
                  className={inputClass}
                >
                  {tournaments.length === 0 && <option value="">Belum ada turnamen</option>}
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.tournament_date})</option>)}
                </select>
              </div>
            </div>

            {/* Tournament participants list */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Daftar Peserta Turnamen</h3>
              </div>
              {tournParticipants.filter(p => p.tournament_id === selTournId).length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">🏆</span>
                  <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada peserta terdaftar di turnamen ini</p>
                </div>
              ) : (
                <div className="divide-y animate-fade-in" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                  {tournParticipants.filter(p => p.tournament_id === selTournId).map(tp => (
                    <div key={tp.id} className="flex items-center justify-between py-4 px-6 transition-colors hover:bg-[var(--md-sys-color-surface-container)]">
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentName(tp.student_id)}</p>
                        <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tp.category}{tp.weight_class ? ` · ${tp.weight_class}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{medalEmoji[tp.medal] || '—'}</span>
                        {tp.result ? (
                          <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tp.result}</span>
                        ) : (
                          <button
                            onClick={() => { setResultModal({ type: 'tourn', id: tp.id }); setTournResult(''); setTournMedal('none'); }}
                            className="m3-btn-text py-1.5 px-3 text-xs font-semibold"
                          >
                            Input Hasil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Register Exam Participant Modal (Batch & Single) */}
        <M3Dialog
          open={regExamModal}
          onClose={() => setRegExamModal(false)}
          title="Daftarkan Peserta Ujian Sekaligus"
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleRegisterExamParticipant} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Jadwal Ujian *</label>
              <select value={selExamId} onChange={e => setSelExamId(e.target.value)} className={inputClass}>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_date} — {ex.location}</option>)}
              </select>
            </div>

            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Pilih satu atau banyak siswa. Target sabuk otomatis naik 1 tingkat (Kyu KKI), namun bisa disesuaikan manual.
            </p>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  className={inputClass}
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
              </div>
              <div className="sm:col-span-5">
                <select
                  className={inputClass}
                  value={filterBelt}
                  onChange={(e) => setFilterBelt(e.target.value)}
                >
                  <option value="all">Semua Sabuk ({availableExamStudents.length} siswa)</option>
                  {OFFICIAL_BELTS.map((belt) => {
                    const cnt = availableExamStudents.filter(s => s.current_belt === belt).length;
                    return (
                      <option key={belt} value={belt}>
                        Sabuk {belt} ({cnt})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-xs py-1 px-1">
              <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Ditemukan {filteredExamStudents.length} siswa | Dipilih: <strong style={{ color: 'var(--md-sys-color-primary)' }}>{selectedStudentIds.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--md-sys-color-primary)' }}
              >
                {filteredExamStudents.length > 0 && filteredExamStudents.every(s => selectedStudentIds.includes(s.id))
                  ? 'Batalkan Pilih Semua di List'
                  : 'Pilih Semua di List Ini'}
              </button>
            </div>

            {/* Students List with Checkboxes */}
            <div
              className="border rounded-[var(--md-sys-shape-corner-medium)] max-h-72 overflow-y-auto divide-y"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                background: 'var(--md-sys-color-surface-container-low)'
              }}
            >
              {filteredExamStudents.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {availableExamStudents.length === 0
                    ? 'Semua siswa sudah terdaftar di jadwal ujian ini.'
                    : 'Tidak ada siswa yang cocok dengan filter pencarian.'}
                </div>
              ) : (
                filteredExamStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  const curBelt = st.current_belt || 'Putih';
                  const defaultNext = getNextBelt(curBelt);
                  const target = customTargetBelts[st.id] || defaultNext;

                  return (
                    <div
                      key={st.id}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isChecked ? 'bg-primary/5' : 'hover:bg-slate-500/5'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(st.id)}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {st.full_name}
                          </div>
                          <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <span>Sabuk Saat Ini:</span>
                            <span className="font-medium px-2 py-0.5 rounded-full text-[11px]" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                              {getBeltEmoji(curBelt)} {curBelt}
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* Target Belt Selector per student */}
                      <div className="flex items-center gap-2 pl-7 sm:pl-0">
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Target:
                        </span>
                        <select
                          disabled={!isChecked}
                          value={target}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomTargetBelts(prev => ({ ...prev, [st.id]: val }));
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          style={{
                            background: isChecked ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container)',
                            color: 'var(--md-sys-color-on-surface)',
                            borderColor: 'var(--md-sys-color-outline-variant)'
                          }}
                        >
                          {OFFICIAL_BELTS.filter(b => b !== 'Putih').map((b) => (
                            <option key={b} value={b}>
                              {getBeltEmoji(b)} {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {selectedStudentIds.length} siswa akan didaftarkan
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegExamModal(false)}
                  className="m3-btn-text px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBatchExam || selectedStudentIds.length === 0}
                  className="m3-btn-filled px-5 py-2 text-sm font-semibold"
                >
                  {submittingBatchExam ? 'Mendaftarkan...' : `Daftarkan ${selectedStudentIds.length} Peserta`}
                </button>
              </div>
            </div>
          </form>
        </M3Dialog>

        {/* Register Tournament Participant Modal */}
        <M3Dialog
          open={regTournModal}
          onClose={() => setRegTournModal(false)}
          title="Daftarkan Peserta Turnamen"
        >
          <form onSubmit={handleRegisterTournParticipant} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Turnamen</label>
              <select value={selTournId} onChange={e => setSelTournId(e.target.value)} className={inputClass}>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Siswa</label>
              <select value={selTournStudentId} onChange={e => setSelTournStudentId(e.target.value)} className={inputClass}>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kategori</label>
                <select value={tournCategory} onChange={e => setTournCategory(e.target.value as 'kata' | 'kumite')} className={inputClass}>
                  <option value="kata">Kata</option>
                  <option value="kumite">Kumite</option>
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kelas Berat</label>
                <input type="text" placeholder="-40kg" value={tournWeightClass} onChange={e => setTournWeightClass(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button type="button" onClick={() => setRegTournModal(false)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">Daftarkan</button>
            </div>
          </form>
        </M3Dialog>

        {/* Input Result Modal */}
        <M3Dialog
          open={!!resultModal}
          onClose={() => setResultModal(null)}
          title={resultModal?.type === 'exam' ? 'Input Hasil Ujian' : 'Input Hasil Turnamen'}
        >
          {resultModal && (
            resultModal.type === 'exam' ? (
              <div className="space-y-4">
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Hasil</label>
                  <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    {(['lulus', 'tidak_lulus'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setExamResult(r)}
                        className="flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                        style={{
                          background: examResult === r ? (r === 'lulus' ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)') : 'transparent',
                          color: examResult === r ? 'white' : 'var(--md-sys-color-on-surface-variant)'
                        }}>
                        {r === 'lulus' ? '✓ Lulus' : '✕ Tidak Lulus'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Catatan Nilai</label>
                  <textarea value={examNotes} onChange={e => setExamNotes(e.target.value)} rows={3} placeholder="Catatan penilaian (opsional)" className="m3-textfield-outlined text-sm resize-none" style={{ height: 'auto' }} />
                </div>
                <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <button onClick={() => setResultModal(null)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
                  <button onClick={handleSubmitExamResult} className="m3-btn-filled px-5 py-2.5 text-sm">Simpan Hasil</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Keterangan Hasil</label>
                  <input type="text" value={tournResult} onChange={e => setTournResult(e.target.value)} placeholder="mis. Juara 1, Babak Semi-final" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Medali</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MEDALS.map(m => (
                      <button key={m} type="button" onClick={() => setTournMedal(m)}
                        className="py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer"
                        style={{
                          borderColor: tournMedal === m ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                          background: tournMedal === m ? 'var(--md-sys-color-primary-container)' : 'transparent',
                          color: tournMedal === m ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)'
                        }}>
                        {medalEmoji[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <button onClick={() => setResultModal(null)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
                  <button onClick={handleSubmitTournResult} className="m3-btn-filled px-5 py-2.5 text-sm">Simpan Hasil</button>
                </div>
              </div>
            )
          )}
        </M3Dialog>
      </div>
    </Navigation>
  );
}
