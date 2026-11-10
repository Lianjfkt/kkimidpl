'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, BeltExam, ExamParticipant } from '@/lib/mockData';
import { OFFICIAL_BELTS, getBeltEmoji, getBeltStyle, getNextBelt } from '@/lib/constants/belts';

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

// Belt Level Up Celebration Overlay
interface CelebrationData {
  studentName: string;
  fromBelt: string;
  toBelt: string;
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
  const [submittingExam, setSubmittingExam] = useState(false);

  // Form states (Batch Register Candidates)
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [filterBelt, setFilterBelt] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customTargetBelts, setCustomTargetBelts] = useState<Record<string, string>>({});

  // Search & Filter in Main Participants Table
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'pending' | 'lulus' | 'tidak_lulus'>('all');
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Belt level up celebration
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const loadData = useCallback(async (selectId?: string) => {
    setLoading(true);
    const { data: examsData } = await supabase.from('belt_exams').select('*').order('exam_date', { ascending: false });
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    const { data: participantsData } = await supabase.from('exam_participants').select('*');

    if (examsData) {
      setExams(examsData);
      if (selectId) {
        setSelectedExamId(selectId);
      } else if (examsData.length > 0 && (!selectedExamId || !examsData.some((e: BeltExam) => e.id === selectedExamId))) {
        setSelectedExamId(examsData[0].id);
      }
    }
    if (studentsData) {
      setStudents(studentsData);
    }
    if (participantsData) setParticipants(participantsData);
    setLoading(false);
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDate || !examLocation) {
      alert('Mohon lengkapi tanggal dan lokasi ujian.');
      return;
    }

    setSubmittingExam(true);
    const newExam = {
      exam_date: examDate,
      location: examLocation,
      fee: Number(examFee),
      registration_fee: Number(examFee),
      status: 'terjadwal' as const,
      notes: examNotes || null
    };

    let createdId: string | null = null;
    let { data, error } = await supabase.from('belt_exams').insert(newExam).select();

    // Fallback jika schema DB lama belum menambahkan fee/notes atau status check
    if (error && (error.message.includes('column') || error.code === 'PGRST204' || error.message.includes('status'))) {
      const fallbackExam = {
        exam_date: examDate,
        location: examLocation,
        registration_fee: Number(examFee),
        status: 'mendatang'
      };
      const retry = await supabase.from('belt_exams').insert(fallbackExam).select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      alert(`Gagal menjadwalkan ujian: ${error.message}\nPastikan Anda sudah login sebagai Owner.`);
      setSubmittingExam(false);
      return;
    }

    if (data && data.length > 0) {
      createdId = data[0].id;
    }

    // Broadcast notifications to parents secara aman
    try {
      const parentNotifications = students
        .filter(s => s.parent_id)
        .map(s => ({
          id: `notif-${Date.now()}-${s.id}`,
          user_id: s.parent_id,
          title: 'Ujian Kenaikan Sabuk Baru',
          message: `Jadwal ujian kenaikan sabuk (grading) baru telah dibuka pada tanggal ${examDate} di ${examLocation}.`,
          type: 'ujian' as const,
          is_read: false
        }));
      if (parentNotifications.length > 0) {
        await supabase.from('notifications').insert(parentNotifications);
      }
    } catch (notifErr) {
      console.warn('Gagal broadcast notifikasi (dilewati):', notifErr);
    }

    setIsExamModalOpen(false);
    setExamDate('');
    setExamLocation('');
    setExamNotes('');
    setSubmittingExam(false);
    await loadData(createdId || undefined);
  };

  const handleOpenBatchRegister = () => {
    setSelectedStudentIds([]);
    setSearchStudent('');
    setFilterBelt('all');
    setCustomTargetBelts({});
    setIsRegModalOpen(true);
  };

  // Siswa yang belum terdaftar di jadwal ujian ini
  const registeredStudentIds = useMemo(() => {
    return new Set(participants.filter(p => p.exam_id === selectedExamId).map(p => p.student_id));
  }, [participants, selectedExamId]);

  const availableStudents = useMemo(() => {
    return students.filter(s => !registeredStudentIds.has(s.id));
  }, [students, registeredStudentIds]);

  const filteredStudents = useMemo(() => {
    return availableStudents.filter(s => {
      const matchSearch = s.full_name.toLowerCase().includes(searchStudent.toLowerCase());
      const matchBelt = filterBelt === 'all' || s.current_belt === filterBelt;
      return matchSearch && matchBelt;
    });
  }, [availableStudents, searchStudent, filterBelt]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBatchRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || selectedStudentIds.length === 0) {
      alert('Pilih minimal satu siswa untuk didaftarkan.');
      return;
    }

    setSubmittingReg(true);

    const newParticipants = selectedStudentIds.map(studentId => {
      const st = students.find(s => s.id === studentId);
      const curBelt = st?.current_belt || 'Putih';
      const tgtBelt = customTargetBelts[studentId] || getNextBelt(curBelt);

      return {
        exam_id: selectedExamId,
        student_id: studentId,
        current_belt: curBelt,
        target_belt: tgtBelt,
        result: 'pending' as const,
        status: 'daftar' as const,
        score_notes: ''
      };
    });

    let { error } = await supabase.from('exam_participants').insert(newParticipants);

    // Fallback jika database belum ada kolom current_belt/result/score_notes
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const fallbackPayload = newParticipants.map(p => ({
        exam_id: p.exam_id,
        student_id: p.student_id,
        target_belt: p.target_belt,
        status: 'daftar'
      }));
      const retry = await supabase.from('exam_participants').insert(fallbackPayload);
      error = retry.error;
    }

    if (error) {
      alert(`Gagal mendaftarkan peserta: ${error.message}`);
      setSubmittingReg(false);
      return;
    }

    setIsRegModalOpen(false);
    setSelectedStudentIds([]);
    setSubmittingReg(false);
    await loadData(selectedExamId);
  };

  const handleUpdateResult = async (participantId: string, result: 'lulus' | 'tidak_lulus') => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // 1. Update result in participant logs
    let { error } = await supabase.from('exam_participants').eq('id', participantId).update({
      result,
      status: result === 'lulus' ? 'lulus' : 'tidak_lulus'
    });

    // Fallback jika kolom result belum ada di database
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const retry = await supabase.from('exam_participants').eq('id', participantId).update({
        status: result === 'lulus' ? 'lulus' : 'tidak_lulus'
      });
      error = retry.error;
    }

    if (error) {
      alert(`Gagal memperbarui status kelulusan: ${error.message}`);
      return;
    }

    // 2. If lulus, update student current_belt + trigger celebration
    if (result === 'lulus') {
      await supabase.from('students').eq('id', participant.student_id).update({
        current_belt: participant.target_belt
      });

      // Notify parent secara aman
      const student = students.find(s => s.id === participant.student_id);
      if (student && student.parent_id) {
        try {
          await supabase.from('notifications').insert({
            id: `notif-${Date.now()}-${student.id}`,
            user_id: student.parent_id,
            title: 'Hasil Ujian Kenaikan Sabuk',
            message: `Selamat! ${student.full_name} dinyatakan LULUS ujian dan naik ke tingkat ${participant.target_belt}.`,
            type: 'ujian',
            is_read: false
          });
        } catch (e) {
          console.warn('Gagal notifikasi ortu:', e);
        }

        // 🎉 Trigger belt level up celebration overlay
        setCelebration({
          studentName: student.full_name,
          fromBelt: participant.current_belt || student.current_belt,
          toBelt: participant.target_belt,
        });
      }
    }

    loadData(selectedExamId);
  };

  const handleBatchPassAllPending = async () => {
    const pendingParticipants = activeParticipants.filter(p => {
      const res = p.result || (p.status === 'lulus' ? 'lulus' : p.status === 'tidak_lulus' ? 'tidak_lulus' : 'pending');
      return res === 'pending';
    });

    if (pendingParticipants.length === 0) {
      alert('Tidak ada peserta dengan status pending di jadwal ini.');
      return;
    }

    const confirm = window.confirm(`Luluskan ${pendingParticipants.length} peserta ujian pending sekaligus? Sabuk siswa akan otomatis diperbarui ke target.`);
    if (!confirm) return;

    setBatchActionLoading(true);

    try {
      // 1. Update status di exam_participants
      for (const p of pendingParticipants) {
        await supabase.from('exam_participants').eq('id', p.id).update({
          result: 'lulus',
          status: 'lulus'
        });

        // 2. Update sabuk siswa
        await supabase.from('students').eq('id', p.student_id).update({
          current_belt: p.target_belt
        });

        // 3. Notifikasi
        const st = students.find(s => s.id === p.student_id);
        if (st && st.parent_id) {
          try {
            await supabase.from('notifications').insert({
              id: `notif-${Date.now()}-${st.id}`,
              user_id: st.parent_id,
              title: 'Hasil Ujian Kenaikan Sabuk',
              message: `Selamat! ${st.full_name} dinyatakan LULUS ujian dan naik ke tingkat ${p.target_belt}.`,
              type: 'ujian',
              is_read: false
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }

      await loadData(selectedExamId);
      alert(`Berhasil meluluskan ${pendingParticipants.length} peserta.`);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const activeParticipants = participants.filter(p => p.exam_id === selectedExamId);
  const currentExam = exams.find(e => e.id === selectedExamId);

  // Filter peserta di tabel utama
  const filteredActiveParticipants = useMemo(() => {
    return activeParticipants.filter(p => {
      const s = students.find(stud => stud.id === p.student_id);
      const name = s?.full_name?.toLowerCase() || '';
      const matchSearch = name.includes(tableSearch.toLowerCase());
      
      const res = p.result || (p.status === 'lulus' ? 'lulus' : p.status === 'tidak_lulus' ? 'tidak_lulus' : 'pending');
      const matchStatus = tableStatusFilter === 'all' || res === tableStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [activeParticipants, students, tableSearch, tableStatusFilter]);

  // Statistik ujian aktif
  const stats = useMemo(() => {
    const total = activeParticipants.length;
    let lulus = 0;
    let gagal = 0;
    let pending = 0;

    activeParticipants.forEach(p => {
      const res = p.result || (p.status === 'lulus' ? 'lulus' : p.status === 'tidak_lulus' ? 'tidak_lulus' : 'pending');
      if (res === 'lulus') lulus++;
      else if (res === 'tidak_lulus') gagal++;
      else pending++;
    });

    const lulusPercent = total > 0 ? Math.round((lulus / total) * 100) : 0;
    return { total, lulus, gagal, pending, lulusPercent };
  }, [activeParticipants]);

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
              Jadwalkan ujian kenaikan tingkat (Sistem Kyu KKI) dan input hasil kelulusan siswa.
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

        {/* Event Select & Quick Metric Header Cards */}
        {exams.length === 0 ? (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-8 text-center border"
            style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <div className="text-4xl mb-2">🥋</div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>Belum Ada Jadwal Ujian Sabuk</h3>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Mulai dengan menjadwalkan tanggal dan lokasi ujian kenaikan tingkat baru.
            </p>
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
            >
              + Jadwalkan Ujian Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Horizontal Event Selection Pills / Cards */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Pilih Jadwal Ujian Aktif ({exams.length})
                </span>
                <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Klik kartu untuk beralih jadwal
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exams.map((ex) => {
                  const isSelected = ex.id === selectedExamId;
                  const partCount = participants.filter(p => p.exam_id === ex.id).length;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => setSelectedExamId(ex.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'ring-2 ring-[var(--md-sys-color-primary)] shadow-lg'
                          : 'hover:border-[var(--md-sys-color-outline)]'
                      }`}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(255,82,82,0.12) 0%, rgba(20,13,12,0.95) 100%)'
                          : 'var(--md-sys-color-surface-container-low)',
                        borderColor: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1.5"
                            style={{
                              background: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                              color: isSelected ? 'white' : 'var(--md-sys-color-on-surface)'
                            }}>
                            📅 {ex.exam_date}
                          </div>
                          <h4 className="font-bold text-base line-clamp-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {ex.location}
                          </h4>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase"
                          style={{
                            background: ex.status === 'selesai' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)',
                            color: ex.status === 'selesai' ? '#4caf50' : 'var(--md-sys-color-primary)'
                          }}>
                          {ex.status || 'terjadwal'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t"
                        style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Peserta: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{partCount} Siswa</strong>
                        </span>
                        <span className="font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                          Rp {(ex.fee || ex.registration_fee || 100000).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Exam Metric Banner & Primary Action */}
            {currentExam && (
              <div className="rounded-3xl p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 border"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-surface-container-high) 0%, var(--md-sys-color-surface-container) 100%)',
                  borderColor: 'var(--md-sys-color-outline-variant)'
                }}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥋</span>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {currentExam.location}
                    </h3>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Tanggal Pelaksanaan: <strong>{currentExam.exam_date}</strong> {currentExam.notes ? `• ${currentExam.notes}` : ''}
                  </p>
                </div>

                {/* 4 Stats Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-xl">
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total Peserta</div>
                    <div className="text-xl font-black mt-0.5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{stats.total}</div>
                  </div>
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium text-amber-500">⏳ Pending</div>
                    <div className="text-xl font-black mt-0.5 text-amber-500">{stats.pending}</div>
                  </div>
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium text-emerald-500">✅ Lulus</div>
                    <div className="text-xl font-black mt-0.5 text-emerald-500">{stats.lulus}</div>
                  </div>
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium text-rose-500">❌ Tidak Lulus</div>
                    <div className="text-xl font-black mt-0.5 text-rose-500">{stats.gagal}</div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleOpenBatchRegister}
                  className="m3-btn-filled px-6 py-3 text-sm font-bold cursor-pointer whitespace-nowrap shadow-lg hover:scale-102 transition-transform"
                >
                  + Daftarkan Peserta (Batch)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Table with Live Filter & Search */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden border"
          style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
          
          {/* Table Toolbar Header */}
          <div className="p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b"
            style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Daftar Peserta Ujian ({filteredActiveParticipants.length}/{activeParticipants.length})
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Kelola penilaian hasil ujian kelulusan tingkat kyu siswa dojo.
              </p>
            </div>

            {/* Quick Actions & Live Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari peserta..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              />

              <select
                value={tableStatusFilter}
                onChange={(e) => setTableStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              >
                <option value="all">Semua Status</option>
                <option value="pending">⏳ Pending ({stats.pending})</option>
                <option value="lulus">✅ Lulus ({stats.lulus})</option>
                <option value="tidak_lulus">❌ Tidak Lulus ({stats.gagal})</option>
              </select>

              {stats.pending > 0 && (
                <button
                  onClick={handleBatchPassAllPending}
                  disabled={batchActionLoading}
                  className="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-emerald-600/40 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                >
                  {batchActionLoading ? 'Memproses...' : `🎉 Luluskan Semua (${stats.pending})`}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse"
                  style={{ background: 'var(--md-sys-color-surface-container)' }} />
              ))}
            </div>
          ) : activeParticipants.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3 opacity-40">🥋</div>
              <h4 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Belum ada siswa terdaftar di jadwal ini
              </h4>
              <p className="text-xs mt-1 mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Gunakan tombol pendaftaran massal untuk memilih dan mendaftarkan atlet sekaligus.
              </p>
              {selectedExamId && (
                <button
                  onClick={handleOpenBatchRegister}
                  className="m3-btn-filled px-5 py-2.5 text-sm cursor-pointer"
                >
                  + Daftarkan Peserta Ujian Sekarang
                </button>
              )}
            </div>
          ) : filteredActiveParticipants.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Tidak ada peserta yang cocok dengan filter pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    {['Nama Siswa', 'Sabuk Saat Ini', 'Target Kenaikan', 'Status Hasil', 'Aksi Kelulusan'].map((h, idx) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${idx === 4 ? 'text-right' : ''}`}
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                  {filteredActiveParticipants.map((part) => {
                    const student = students.find(s => s.id === part.student_id);
                    const studentName = student?.full_name || 'Siswa';
                    const curBelt = part.current_belt || student?.current_belt || 'Putih';
                    const partRes = part.result || (part.status === 'lulus' ? 'lulus' : part.status === 'tidak_lulus' ? 'tidak_lulus' : 'pending');

                    return (
                      <tr key={part.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {studentName}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {student?.phone || 'No telp -'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                            style={{
                              background: 'var(--md-sys-color-surface-container)',
                              borderColor: 'var(--md-sys-color-outline-variant)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}>
                            {getBeltEmoji(curBelt)} {curBelt}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400">
                            → {getBeltEmoji(part.target_belt)} {part.target_belt}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                            style={
                              partRes === 'lulus' ? { background: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.3)' } :
                              partRes === 'tidak_lulus' ? { background: 'rgba(244, 67, 54, 0.15)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.3)' } :
                              { background: 'rgba(255, 193, 7, 0.15)', color: '#ffb300', border: '1px solid rgba(255, 193, 7, 0.3)' }
                            }>
                            {partRes === 'lulus' ? '✅ Lulus' :
                             partRes === 'tidak_lulus' ? '❌ Tidak Lulus' : '⏳ Belum Diuji'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateResult(part.id, 'lulus')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                partRes === 'lulus'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/20'
                              }`}
                            >
                              🎉 Lulus
                            </button>
                            <button
                              onClick={() => handleUpdateResult(part.id, 'tidak_lulus')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                                partRes === 'tidak_lulus'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'border border-rose-600/40 text-rose-400 hover:bg-rose-600/20'
                              }`}
                            >
                              Gagal
                            </button>
                          </div>
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
              <button type="submit" disabled={submittingExam} className="m3-btn-filled px-5 py-2.5 text-sm">
                {submittingExam ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </M3Dialog>

        {/* Batch Register Participant Modal */}
        <M3Dialog
          open={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          title="Daftarkan Peserta Ujian Sekaligus"
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleBatchRegister} className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Pilih satu atau banyak siswa yang akan diikutsertakan. Target sabuk otomatis dihitung naik 1 tingkat (Kyu), tetapi tetap dapat disesuaikan per siswa.
            </p>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
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
                  <option value="all">Semua Sabuk ({availableStudents.length} siswa)</option>
                  {OFFICIAL_BELTS.map((belt) => {
                    const cnt = availableStudents.filter(s => s.current_belt === belt).length;
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
                Ditemukan {filteredStudents.length} siswa | Dipilih: <strong style={{ color: 'var(--md-sys-color-primary)' }}>{selectedStudentIds.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--md-sys-color-primary)' }}
              >
                {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id))
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
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {availableStudents.length === 0
                    ? 'Semua siswa aktif sudah terdaftar di ujian ini.'
                    : 'Tidak ada siswa yang cocok dengan filter pencarian.'}
                </div>
              ) : (
                filteredStudents.map((st) => {
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
                  onClick={() => setIsRegModalOpen(false)}
                  className="m3-btn-text px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReg || selectedStudentIds.length === 0}
                  className="m3-btn-filled px-5 py-2 text-sm font-semibold"
                >
                  {submittingReg ? 'Mendaftarkan...' : `Daftarkan ${selectedStudentIds.length} Peserta`}
                </button>
              </div>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
