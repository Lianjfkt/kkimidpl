'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, BeltExam, ExamParticipant } from '@/lib/mockData';

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

// Belt Level Up Celebration Overlay
interface CelebrationData {
  studentName: string;
  fromBelt: string;
  toBelt: string;
}

const BELT_EMOJI: Record<string, string> = {
  'Putih': '🥋',
  'Kuning': '🟡',
  'Hijau': '🟢',
  'Biru Muda': '🔵',
  'Biru Tua': '💙',
  'Coklat Muda': '🟤',
  'Coklat': '🟤',
  'Coklat Tua': '🟫',
  'Hitam': '⬛',
};

function getBeltEmoji(belt: string): string {
  for (const [key, emoji] of Object.entries(BELT_EMOJI)) {
    if (belt.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🥋';
}

function BeltLevelUpCelebration({ data, onDone }: { data: CelebrationData; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);

  const confettiColors = ['#ff5252', '#ffd700', '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0'];
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    left: `${Math.random() * 100}%`,
    cls: `confetti-${(i % 5) + 1}`,
    size: Math.random() * 10 + 6,
    delay: Math.random() * 0.8,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'triangle',
  }));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center belt-celebration-overlay"
      style={{ background: 'rgba(0,0,0,0.85)', pointerEvents: 'none' }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((c) => (
          <div
            key={c.id}
            className={c.cls}
            style={{
              position: 'absolute',
              top: '10%',
              left: c.left,
              width: c.shape === 'circle' ? c.size : c.size * 1.2,
              height: c.shape === 'triangle' ? c.size * 0.7 : c.size,
              background: c.shape === 'triangle' ? 'transparent' : c.color,
              borderRadius: c.shape === 'circle' ? '50%' : '2px',
              borderLeft: c.shape === 'triangle' ? `${c.size * 0.6}px solid transparent` : 'none',
              borderRight: c.shape === 'triangle' ? `${c.size * 0.6}px solid transparent` : 'none',
              borderBottom: c.shape === 'triangle' ? `${c.size}px solid ${c.color}` : 'none',
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div
        className="belt-celebration-card relative text-center px-10 py-10 rounded-[28px] shadow-2xl max-w-sm w-full mx-4"
        style={{ background: 'linear-gradient(135deg, #1a0a08 0%, #2d1210 50%, #1a0a08 100%)', border: '1px solid rgba(255,82,82,0.3)' }}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none" style={{
          boxShadow: '0 0 60px rgba(255,82,82,0.4), 0 0 120px rgba(255,82,82,0.15)',
        }} />

        {/* Stars burst */}
        <div className="belt-stars text-5xl mb-2 select-none">✨⭐✨</div>

        {/* Belt icon spinning */}
        <div className="belt-spin-icon text-7xl my-3 select-none">{getBeltEmoji(data.toBelt)}</div>

        {/* Main text */}
        <div className="belt-text-up">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(255,82,82,0.8)' }}>
            Selamat!
          </p>
          <h2 className="text-2xl font-black mb-1" style={{ color: '#ffdad6' }}>
            {data.studentName}
          </h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(240,223,221,0.7)' }}>
            telah lulus ujian kenaikan sabuk
          </p>

          {/* Belt upgrade path */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.08)', color: '#d8c2be' }}>
              {data.fromBelt}
            </span>
            <span style={{ color: '#ff5252', fontSize: '20px' }}>→</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(255,82,82,0.25)', color: '#ff7070', border: '1px solid rgba(255,82,82,0.4)' }}>
              {data.toBelt} 🎖️
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-medium mb-1.5';
const fieldWrap = 'flex flex-col';

export default function OwnerExams() {
  const [exams, setExams] = useState<BeltExam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [participants, setParticipants] = useState<ExamParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  // Active exam view state
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Form states (Create Exam)
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [examLocation, setExamLocation] = useState('');
  const [examFee, setExamFee] = useState(100000);
  const [examNotes, setExamNotes] = useState('');

  // Form states (Register Candidate)
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetBelt, setTargetBelt] = useState('Kuning (Geup 9)');

  // Belt level up celebration
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: examsData } = await supabase.from('belt_exams').select('*');
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    const { data: participantsData } = await supabase.from('exam_participants').select('*');

    if (examsData) {
      setExams(examsData);
      if (examsData.length > 0 && !selectedExamId) {
        setSelectedExamId(examsData[0].id);
      }
    }
    if (studentsData) {
      setStudents(studentsData);
      if (studentsData.length > 0) setSelectedStudentId(studentsData[0].id);
    }
    if (participantsData) setParticipants(participantsData);
    setLoading(false);
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    const newExam = {
      exam_date: examDate,
      location: examLocation,
      fee: Number(examFee),
      status: 'terjadwal' as const,
      notes: examNotes
    };

    await supabase.from('belt_exams').insert(newExam);
    
    // Broadcast notifications to parents
    const parentNotifications = students.map(s => ({
      user_id: s.parent_id || 'user-parent-id',
      title: 'Ujian Kenaikan Sabuk Baru',
      message: `Jadwal ujian kenaikan sabuk (grading) baru telah dibuka pada tanggal ${examDate} di ${examLocation}.`,
      type: 'ujian' as const,
      is_read: false
    }));
    await supabase.from('notifications').insert(parentNotifications);

    setIsExamModalOpen(false);
    setExamDate('');
    setExamLocation('');
    setExamNotes('');
    loadData();
  };

  const handleRegisterParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !selectedExamId) return;

    // Check if student already registered in this exam
    const exists = participants.some(p => p.exam_id === selectedExamId && p.student_id === selectedStudentId);
    if (exists) {
      alert('Siswa ini sudah terdaftar sebagai peserta ujian.');
      return;
    }

    const newParticipant = {
      exam_id: selectedExamId,
      student_id: selectedStudentId,
      current_belt: student.current_belt,
      target_belt: targetBelt,
      result: 'pending' as const,
      score_notes: ''
    };

    await supabase.from('exam_participants').insert(newParticipant);
    setIsRegModalOpen(false);
    loadData();
  };

  const handleUpdateResult = async (participantId: string, result: 'lulus' | 'tidak_lulus') => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // 1. Update result in participant logs
    await supabase.from('exam_participants').eq('id', participantId).update({ result });

    // 2. If lulus, update student current_belt + trigger celebration
    if (result === 'lulus') {
      await supabase.from('students').eq('id', participant.student_id).update({
        current_belt: participant.target_belt
      });

      // Notify parent
      const student = students.find(s => s.id === participant.student_id);
      if (student) {
        await supabase.from('notifications').insert({
          user_id: student.parent_id || 'user-parent-id',
          title: 'Hasil Ujian Kenaikan Sabuk',
          message: `Selamat! ${student.full_name} dinyatakan LULUS ujian dan naik ke tingkat ${participant.target_belt}.`,
          type: 'ujian',
          is_read: false
        });

        // 🎉 Trigger belt level up celebration overlay
        setCelebration({
          studentName: student.full_name,
          fromBelt: participant.current_belt,
          toBelt: participant.target_belt,
        });
      }
    }

    loadData();
  };

  const activeParticipants = participants.filter(p => p.exam_id === selectedExamId);

  return (
    <Navigation>
      {/* Belt Level Up Celebration Overlay */}
      {celebration && (
        <BeltLevelUpCelebration
          data={celebration}
          onDone={() => setCelebration(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Ujian Kenaikan Sabuk
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Jadwalkan ujian kenaikan tingkat (Geup System KKI) dan input hasil kelulusan siswa.
            </p>
          </div>
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Jadwalkan Ujian Baru
          </button>
        </div>

        {/* Exam Select Event Bar */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] flex flex-col md:flex-row gap-4 items-end justify-between"
          style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '20px' }}>
          <div className="w-full md:w-72 flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Pilih Jadwal Ujian
            </label>
            <select
              className={inputClass}
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {exams.length === 0 ? (
                <option value="">Belum ada jadwal ujian</option>
              ) : (
                exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exam_date} - {ex.location}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedExamId && (
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="m3-btn-outlined px-5 py-2.5 text-sm font-semibold cursor-pointer w-full md:w-auto"
            >
              Daftarkan Peserta Ujian
            </button>
          )}
        </div>

        {/* Participants Table */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Daftar Peserta Ujian
            </h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse"
                  style={{ background: 'var(--md-sys-color-surface-container)' }} />
              ))}
            </div>
          ) : activeParticipants.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl mb-3 opacity-30">🥋</div>
              <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Belum ada siswa didaftarkan di jadwal ujian ini.
              </p>
              {selectedExamId && (
                <button
                  onClick={() => setIsRegModalOpen(true)}
                  className="mt-4 m3-btn-filled px-5 py-2 text-sm cursor-pointer"
                >
                  Daftarkan Peserta Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    {['Nama Siswa', 'Sabuk Sekarang', 'Target Sabuk', 'Status Hasil', 'Kelulusan'].map((h, idx) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${idx === 4 ? 'text-right' : ''}`}
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeParticipants.map((part, idx) => {
                    const studentName = students.find(s => s.id === part.student_id)?.full_name || 'Siswa';
                    return (
                      <tr key={part.id}
                        style={{ borderBottom: idx < activeParticipants.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}>
                        <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentName}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{part.current_belt}</td>
                        <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--md-sys-color-primary)' }}>{part.target_belt}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className="px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold"
                            style={
                              part.result === 'lulus' ? { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' } :
                              part.result === 'tidak_lulus' ? { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' } :
                              { background: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface-variant)' }
                            }>
                            {part.result === 'lulus' ? '✅ Lulus' :
                             part.result === 'tidak_lulus' ? '❌ Tidak Lulus' : '⏳ Tertunda'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-right">
                          {part.result === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleUpdateResult(part.id, 'lulus')}
                                className="m3-btn-text py-1 px-3 text-xs font-bold cursor-pointer"
                                style={{ color: 'var(--md-sys-color-tertiary)' }}
                              >
                                🎉 Lulus
                              </button>
                              <button
                                onClick={() => handleUpdateResult(part.id, 'tidak_lulus')}
                                className="m3-btn-text py-1 px-3 text-xs font-semibold cursor-pointer"
                                style={{ color: 'var(--md-sys-color-error)' }}
                              >
                                Gagal
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Exam Modal */}
        <M3Dialog
          open={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          title="Jadwalkan Ujian Baru"
        >
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Ujian *</label>
              <input
                type="date"
                required
                className={inputClass}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Lokasi Ujian *</label>
              <input
                type="text"
                required
                placeholder="mis. Aula Dojo Pusat DPL"
                className={inputClass}
                value={examLocation}
                onChange={(e) => setExamLocation(e.target.value)}
              />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Biaya Ujian (Rp) *</label>
              <input
                type="number"
                required
                className={inputClass}
                value={examFee}
                onChange={(e) => setExamFee(Number(e.target.value))}
              />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Keterangan Tambahan</label>
              <input
                type="text"
                className={inputClass}
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">
                Simpan
              </button>
            </div>
          </form>
        </M3Dialog>

        {/* Register Participant Modal */}
        <M3Dialog
          open={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          title="Daftarkan Atlet"
        >
          <form onSubmit={handleRegisterParticipant} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Siswa</label>
              <select
                className={inputClass}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.full_name} ({student.current_belt})</option>
                ))}
              </select>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Target Sabuk Baru</label>
              <select
                className={inputClass}
                value={targetBelt}
                onChange={(e) => setTargetBelt(e.target.value)}
              >
                <option value="Kuning (Geup 9)">Kuning (Geup 9)</option>
                <option value="Hijau (Geup 8)">Hijau (Geup 8)</option>
                <option value="Biru Muda (Geup 7)">Biru Muda (Geup 7)</option>
                <option value="Biru Tua (Geup 6)">Biru Tua (Geup 6)</option>
                <option value="Coklat Muda (Geup 5)">Coklat Muda (Geup 5)</option>
                <option value="Coklat Tua (Geup 4)">Coklat Tua (Geup 4)</option>
                <option value="Hitam (Dan I)">Hitam (Dan I)</option>
                <option value="Hitam (Dan II)">Hitam (Dan II)</option>
                <option value="Hitam (Dan III)">Hitam (Dan III)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                type="button"
                onClick={() => setIsRegModalOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">
                Daftarkan
              </button>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
