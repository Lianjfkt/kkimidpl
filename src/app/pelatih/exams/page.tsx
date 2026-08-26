'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { BeltExam, ExamParticipant, Tournament, TournamentParticipant, Student, Coach } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

const BELTS = [
  'Kuning (Geup 9)',
  'Hijau (Geup 8)',
  'Biru Muda (Geup 7)',
  'Biru Tua (Geup 6)',
  'Coklat Muda (Geup 5)',
  'Coklat Tua (Geup 4)',
  'Hitam (Dan I)',
  'Hitam (Dan II)',
  'Hitam (Dan III)',
];
const MEDALS = ['emas', 'perak', 'perunggu', 'none'] as const;

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-fade-in"
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
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
  const [selStudentId, setSelStudentId] = useState('');
  const [targetBelt, setTargetBelt] = useState('Kuning (Geup 9)');

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
      const { data: coachData } = await supabase.from('coaches').eq('profile_id', userData.user.id).single();
      if (coachData) setCoach(coachData as Coach);
    }
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    if (studentsData) {
      setStudents(studentsData as Student[]);
      setSelStudentId((studentsData[0] as Student)?.id || '');
      setSelTournStudentId((studentsData[0] as Student)?.id || '');
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

  const handleRegisterExamParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selStudentId);
    if (!student || !selExamId) return;
    const already = participants.some(p => p.exam_id === selExamId && p.student_id === selStudentId);
    if (already) { alert('Siswa sudah terdaftar di ujian ini.'); return; }
    await supabase.from('exam_participants').insert({
      exam_id: selExamId,
      student_id: selStudentId,
      current_belt: student.current_belt,
      target_belt: targetBelt,
      result: 'pending',
      score_notes: '',
    });
    setRegExamModal(false);
    loadData();
  };

  const handleRegisterTournParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selTournId || !selTournStudentId) return;
    await supabase.from('tournament_participants').insert({
      tournament_id: selTournId,
      student_id: selTournStudentId,
      category: tournCategory,
      weight_class: tournWeightClass || null,
      result: '',
      medal: 'none',
    });
    setRegTournModal(false);
    loadData();
  };

  const handleSubmitExamResult = async () => {
    if (!resultModal) return;
    const part = participants.find(p => p.id === resultModal.id);
    if (!part) return;
    await supabase.from('exam_participants').eq('id', resultModal.id).update({
      result: examResult,
      score_notes: examNotes,
    });
    if (examResult === 'lulus') {
      await supabase.from('students').eq('id', part.student_id).update({ current_belt: part.target_belt });
      const student = students.find(s => s.id === part.student_id);
      if (student) {
        await supabase.from('notifications').insert({
          user_id: student.parent_id || 'user-parent-id',
          title: 'Hasil Ujian Kenaikan Sabuk',
          message: `Selamat! ${student.full_name} dinyatakan LULUS dan naik ke sabuk ${part.target_belt}.`,
          type: 'ujian',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
    setResultModal(null);
    setExamNotes('');
    loadData();
  };

  const handleSubmitTournResult = async () => {
    if (!resultModal) return;
    await supabase.from('tournament_participants').eq('id', resultModal.id).update({
      result: tournResult,
      medal: tournMedal,
    });
    const tp = tournParticipants.find(p => p.id === resultModal.id);
    if (tp) {
      const student = students.find(s => s.id === tp.student_id);
      if (student) {
        await supabase.from('notifications').insert({
          user_id: student.parent_id || 'user-parent-id',
          title: 'Hasil Turnamen',
          message: `Hasil turnamen untuk ${student.full_name}: ${tournResult}${tournMedal !== 'none' ? ` — Meraih medali ${tournMedal}! 🏅` : ''}.`,
          type: 'turnamen',
          is_read: false,
          created_at: new Date().toISOString(),
        });
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
            onClick={() => activeTab === 'ujian' ? setRegExamModal(true) : setRegTournModal(true)}
            className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Daftarkan Peserta
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

        {/* Register Exam Participant Modal */}
        <M3Dialog
          open={regExamModal}
          onClose={() => setRegExamModal(false)}
          title="Daftarkan Peserta Ujian"
        >
          <form onSubmit={handleRegisterExamParticipant} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Jadwal Ujian</label>
              <select value={selExamId} onChange={e => setSelExamId(e.target.value)} className={inputClass}>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_date} — {ex.location}</option>)}
              </select>
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Siswa</label>
              <select value={selStudentId} onChange={e => setSelStudentId(e.target.value)} className={inputClass}>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.current_belt})</option>)}
              </select>
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Target Sabuk</label>
              <select value={targetBelt} onChange={e => setTargetBelt(e.target.value)} className={inputClass}>
                {BELTS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button type="button" onClick={() => setRegExamModal(false)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">Daftarkan</button>
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
