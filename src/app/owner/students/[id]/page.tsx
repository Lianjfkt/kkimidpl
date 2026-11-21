'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, StudentAttendance, TournamentParticipant, Tournament, BeltExam, ExamParticipant, StudentPhysicalTest } from '@/lib/mockData';
import { OFFICIAL_BELTS } from '@/lib/constants/belts';
import PhysicalRadarChart from '@/components/PhysicalRadarChart';
import PhysicalProgressChart from '@/components/PhysicalProgressChart';
import { calculatePhysicalAssessment } from '@/lib/physicalScoring';

const beltOrder = OFFICIAL_BELTS;

const STATUS_CONFIG = {
  hadir:  { label: 'Hadir', dot: 'bg-emerald-500' },
  izin:   { label: 'Izin', dot: 'bg-blue-500' },
  sakit:  { label: 'Sakit', dot: 'bg-amber-500' },
  alpha:  { label: 'Alpha', dot: 'bg-red-500' },
};

export default function StudentDetailPage() {
  // Use useParams hook instead of use(params) Promise for better client-side stability
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [tournamentRuns, setTournamentRuns] = useState<any[]>([]);
  const [examsPlayed, setExamsPlayed] = useState<any[]>([]);
  const [physicalTests, setPhysicalTests] = useState<StudentPhysicalTest[]>([]);
  const [coachNotes, setCoachNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // Load each query independently so one failure doesn't block others
        const studRes = await supabase.from('students').eq('id', studentId).maybeSingle();

        if (!studRes.data) {
          setErrorMsg(`Siswa dengan ID "${studentId}" tidak ditemukan.`);
          setLoading(false);
          return;
        }

        setStudent(studRes.data as Student);
        setCoachNotes(studRes.data.medical_history || '');

        // Load related data in parallel, each independently
        const [feesRes, attRes, tournPartsRes, tournsRes, examPartsRes, examsRes, physicalTestsRes] = await Promise.all([
          supabase.from('fees').eq('student_id', studentId).select('*'),
          supabase.from('attendance_students').eq('student_id', studentId).select('*'),
          supabase.from('tournament_participants').eq('student_id', studentId).select('*'),
          supabase.from('tournaments').select('*'),
          supabase.from('exam_participants').eq('student_id', studentId).select('*'),
          supabase.from('belt_exams').select('*'),
          supabase.from('student_physical_tests').eq('student_id', studentId).order('test_date', { ascending: false }).select('*'),
        ]);

        if (feesRes.data) setFees(feesRes.data as Fee[]);
        if (attRes.data) setAttendance(attRes.data as StudentAttendance[]);

        if (physicalTestsRes.data) setPhysicalTests(physicalTestsRes.data as StudentPhysicalTest[]);

        if (tournPartsRes.data && tournsRes.data) {
          const matches = (tournPartsRes.data as TournamentParticipant[]).map(tp => {
            const t = (tournsRes.data as Tournament[]).find(tourn => tourn.id === tp.tournament_id);
            return { ...tp, tournamentName: t?.name || 'Turnamen', date: t?.tournament_date };
          });
          setTournamentRuns(matches);
        }

        if (examPartsRes.data && examsRes.data) {
          const matches = (examPartsRes.data as ExamParticipant[]).map(ep => {
            const e = (examsRes.data as BeltExam[]).find(ex => ex.id === ep.exam_id);
            return { ...ep, examDate: e?.exam_date, location: e?.location };
          });
          setExamsPlayed(matches);
        }
      } catch (err) {
        console.error('[StudentDetail] Error loading data:', err);
        setErrorMsg('Terjadi kesalahan saat memuat data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase.from('students').eq('id', studentId).update({ medical_history: coachNotes });
      if (error) {
        throw error;
      }
      alert('Catatan pelatih berhasil disimpan!');
    } catch (err: any) {
      console.error('Error saving notes:', err);
      alert('Gagal menyimpan catatan: ' + (err?.message || 'Terjadi kesalahan.'));
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <Navigation>
        <div className="flex flex-col items-center justify-center p-24">
          <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-6"
            style={{ borderColor: 'var(--md-sys-color-primary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Memuat profil detail atlet...</p>
          <p className="text-xs mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>ID: {studentId}</p>
        </div>
      </Navigation>
    );
  }

  if (errorMsg || !student) {
    return (
      <Navigation>
        <div className="space-y-4">
          <button
            onClick={() => router.push('/owner/students')}
            className="apple-btn-secondary py-1.5 px-4 text-xs font-semibold cursor-pointer rounded-2xl"
          >
            ← Kembali ke Daftar
          </button>
          <div className="p-8 text-center rounded-3xl border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-bold text-lg" style={{ color: 'var(--md-sys-color-error)' }}>
              {errorMsg || 'Siswa tidak ditemukan.'}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.7 }}>
              ID yang dicari: <code className="font-mono">{studentId}</code>
            </p>
          </div>
        </div>
      </Navigation>
    );
  }

  // Calculate belt level index for progress
  const currentBeltIdx = beltOrder.findIndex(b => student.current_belt.toLowerCase().includes(b.toLowerCase()));
  const progressPct = currentBeltIdx >= 0 ? Math.round(((currentBeltIdx + 1) / beltOrder.length) * 100) : 0;

  // Attendance rate
  const totalAtt = attendance.length;
  const hadirAtt = attendance.filter(a => a.status === 'hadir').length;
  const attPct = totalAtt > 0 ? Math.round((hadirAtt / totalAtt) * 100) : 100;

  // Physical assessment computation
  const latestTest = physicalTests[0] ?? null;
  const attendanceRate = totalAtt > 0 ? Math.round((hadirAtt / totalAtt) * 100) : 0;
  const physicalAssessment = latestTest
    ? calculatePhysicalAssessment(
        {
          push_up_30s: latestTest.push_up_30s,
          sit_up_30s: latestTest.sit_up_30s,
          punches_30s: latestTest.punches_30s,
          kicks_30s: latestTest.kicks_30s,
          skipping_sec: latestTest.skipping_sec,
          split_front_cm: latestTest.split_front_cm,
          split_side_cm: latestTest.split_side_cm,
        },
        attendanceRate,
        student.dob,
        student.current_belt
      )
    : null;

  // Grade color helper for history table
  const gradeColors: Record<string, React.CSSProperties> = {
    S: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' },
    A: { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)' },
    B: { background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.4)' },
    C: { background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.4)' },
    D: { background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' },
  };

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/owner/students')}
            className="apple-btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer rounded-2xl transition-all duration-200"
          >
            ← Kembali ke Daftar
          </button>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Profil Detail Atlet
          </h2>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main profile card */}
          <div
            className="rounded-3xl p-6 flex flex-col items-center text-center border border-[var(--neu-border)] transition-all duration-200"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold mb-3 border border-[var(--neu-border)]"
              style={{
                background: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              {student.full_name.charAt(0)}
            </div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.full_name}</h3>
            <span className="text-xs uppercase tracking-wider font-semibold opacity-60 mt-0.5">{student.nik || 'No NIK'}</span>
            <span
              className="mt-2 inline-block px-3.5 py-1 rounded-full text-xs font-bold border border-[var(--neu-border)]"
              style={{
                background: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              🥋 Sabuk {student.current_belt}
            </span>

            {/* Status badge */}
            <span
              className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold"
              style={
                student.status === 'active'
                  ? { background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 8px rgba(255,82,82,0.3)' }
                  : { background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface-variant)' }
              }
            >
              {student.status === 'active' ? '✓ Aktif' : '✗ Nonaktif'}
            </span>

            <div className="w-full grid grid-cols-2 gap-2 text-left mt-6 pt-6 border-t" style={{ borderColor: 'var(--neu-border)' }}>
              <div>
                <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Status Kehadiran</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{attPct}% ({hadirAtt}/{totalAtt})</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tanggal Join</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.join_date}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>TTL</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.dob}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Gender</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.gender}</span>
              </div>
            </div>

            {student.phone && (
              <div className="w-full text-left mt-4 pt-4 border-t" style={{ borderColor: 'var(--neu-border)' }}>
                <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>No. Telepon</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.phone}</span>
              </div>
            )}

            {(student.parent_name || student.parent_job) && (
              <div className="w-full text-left mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--neu-border)' }}>
                <span className="block text-[10px] uppercase tracking-wider font-bold opacity-50" style={{ color: 'var(--md-sys-color-on-surface)' }}>Data Orang Tua</span>
                {student.parent_name && (
                  <div>
                    <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Nama Orang Tua</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.parent_name}</span>
                  </div>
                )}
                {student.parent_job && (
                  <div>
                    <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pekerjaan</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.parent_job}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Belt journey progress timeline */}
          <div
            className="rounded-3xl p-6 md:col-span-2 border border-[var(--neu-border)] transition-all duration-200"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <h4 className="font-bold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Belt Journey &amp; Progress</h4>

            {/* Visual belt progress bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                <span>Sabuk {student.current_belt}</span>
                <span>{progressPct}% menuju Sabuk Hitam</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: 'var(--neu-accent-grad)' }}
                />
              </div>
            </div>

            {/* Horizontal Timeline steps */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {beltOrder.map((belt, idx) => {
                const isPassed = idx <= currentBeltIdx;
                const isCurrent = idx === currentBeltIdx;
                return (
                  <div key={belt} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                          isCurrent
                            ? 'text-white border-transparent'
                            : isPassed
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'text-gray-400 border-[var(--neu-border)]'
                        }`}
                        style={
                          isCurrent
                            ? { background: 'var(--neu-accent-grad)', boxShadow: 'var(--neu-shadow-accent)' }
                            : !isPassed
                              ? { background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }
                              : {}
                        }
                      >
                        {idx + 1}
                      </div>
                      <span className="text-[9px] font-semibold" style={{ color: isCurrent ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}>{belt}</span>
                    </div>
                    {idx < beltOrder.length - 1 && (
                      <div className={`w-6 h-1 rounded-full ${isPassed ? 'bg-emerald-500' : ''}`}
                        style={!isPassed ? { background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' } : {}} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Physical stats if available */}
            {(student.weight || student.height || student.specialization) && (
              <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: 'var(--neu-border)' }}>
                {student.weight && (
                  <div className="text-center p-3 rounded-2xl border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.weight}</p>
                    <p className="text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>kg</p>
                  </div>
                )}
                {student.height && (
                  <div className="text-center p-3 rounded-2xl border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.height}</p>
                    <p className="text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>cm</p>
                  </div>
                )}
                {student.specialization && (
                  <div className="text-center p-3 rounded-2xl border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                    <p className="text-sm font-extrabold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.specialization}</p>
                    <p className="text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Spesialisasi</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Kemampuan Fisik & Kebugaran ── */}
        <div
          className="rounded-3xl p-6 border border-[var(--neu-border)]"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          {/* Section heading */}
          <div className="flex flex-wrap items-baseline gap-3 mb-5">
            <h4 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              💪 Kemampuan Fisik &amp; Kebugaran
            </h4>
            {latestTest && (
              <span className="text-[10px] font-semibold opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Tes terakhir: {latestTest.test_date}
              </span>
            )}
          </div>

          {!physicalTests.length ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="text-4xl">🏋️</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Belum ada data tes fisik.
              </p>
              <p className="text-xs opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Minta pelatih untuk input tes pertama di halaman Tes Fisik.
              </p>
              <a
                href="/pelatih/physical-tests"
                className="apple-btn mt-2 py-2 px-5 text-xs font-semibold rounded-2xl inline-block"
              >
                → Buka Halaman Tes Fisik
              </a>
            </div>
          ) : physicalAssessment ? (
            <div className="space-y-6">
              {/* ── Exam Readiness Dual-Gate Badge ── */}
              <div
                className="rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-start gap-4"
                style={
                  physicalAssessment.examReadiness.statusColor === 'emerald'
                    ? { background: 'rgba(52,211,153,0.07)', borderColor: 'rgba(52,211,153,0.3)' }
                    : physicalAssessment.examReadiness.statusColor === 'amber'
                      ? { background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.3)' }
                      : { background: 'rgba(248,113,113,0.07)', borderColor: 'rgba(248,113,113,0.3)' }
                }
              >
                {/* Overall status */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={
                        physicalAssessment.examReadiness.statusColor === 'emerald'
                          ? { background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.5)' }
                          : physicalAssessment.examReadiness.statusColor === 'amber'
                            ? { background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.5)' }
                            : { background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid rgba(248,113,113,0.5)' }
                      }
                    >
                      {physicalAssessment.examReadiness.isEligible ? '✓' : '✗'}{' '}
                      {physicalAssessment.examReadiness.statusText}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      Skor: {physicalAssessment.totalScore} · Grade {physicalAssessment.grade}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] opacity-70" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {physicalAssessment.examReadiness.reason}
                  </p>
                </div>
                {/* Gate indicators */}
                <div className="flex gap-3 flex-shrink-0">
                  {/* Physical gate */}
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={
                        physicalAssessment.totalScore >= (physicalAssessment.radarDimensions[0]?.target ?? 60)
                          ? { background: 'rgba(52,211,153,0.2)', color: '#34d399' }
                          : { background: 'rgba(248,113,113,0.2)', color: '#f87171' }
                      }
                    >
                      {physicalAssessment.totalScore >= (physicalAssessment.radarDimensions[0]?.target ?? 60) ? '✓' : '✗'}
                    </span>
                    <span className="text-[9px] font-semibold opacity-70" style={{ color: 'var(--md-sys-color-on-surface)' }}>Fisik</span>
                  </div>
                  {/* Attendance gate */}
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={
                        attendanceRate >= 75
                          ? { background: 'rgba(52,211,153,0.2)', color: '#34d399' }
                          : { background: 'rgba(248,113,113,0.2)', color: '#f87171' }
                      }
                    >
                      {attendanceRate >= 75 ? '✓' : '✗'}
                    </span>
                    <span className="text-[9px] font-semibold opacity-70" style={{ color: 'var(--md-sys-color-on-surface)' }}>Hadir</span>
                  </div>
                </div>
              </div>

              {/* ── Radar Chart + Recommendations ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <PhysicalRadarChart
                  dimensions={physicalAssessment.radarDimensions}
                  showTarget={true}
                />
                {/* Smart Drill Recommendations */}
                <div className="space-y-3 flex flex-col justify-center">
                  <h5 className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Rekomendasi Latihan
                  </h5>
                  {physicalAssessment.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl text-xs leading-relaxed border"
                      style={{
                        background: i === 0
                          ? 'rgba(248,113,113,0.08)'
                          : i === 1
                            ? 'rgba(251,191,36,0.08)'
                            : 'rgba(96,165,250,0.08)',
                        borderColor: i === 0
                          ? 'rgba(248,113,113,0.25)'
                          : i === 1
                            ? 'rgba(251,191,36,0.25)'
                            : 'rgba(96,165,250,0.25)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                    >
                      <span className="mr-1">{i === 0 ? '🔴' : i === 1 ? '🟡' : '🔵'}</span>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Progress Trend Chart ── */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Tren Perkembangan Fisik
                </h5>
                <PhysicalProgressChart
                  records={physicalTests.map(t => ({
                    id: t.id,
                    test_date: t.test_date,
                    total_score: t.total_score,
                    grade: t.grade,
                    push_up_30s: t.push_up_30s,
                    sit_up_30s: t.sit_up_30s,
                    punches_30s: t.punches_30s,
                    kicks_30s: t.kicks_30s,
                    skipping_sec: t.skipping_sec,
                    split_front_cm: t.split_front_cm,
                    split_side_cm: t.split_side_cm,
                  }))}
                />
              </div>

              {/* ── Historical Test Log Table ── */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Riwayat Tes Fisik
                </h5>
                <div className="overflow-x-auto rounded-2xl border border-[var(--neu-border)]" style={{ background: 'var(--neu-surface-low)' }}>
                  <table className="w-full text-[11px]" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--neu-border)' }}>
                        {['Tanggal', 'Grade', 'Skor', 'Push-Up', 'Sit-Up', 'Pukulan', 'Tendangan', 'Skipping(s)', 'Split D(cm)', 'Split S(cm)', 'Catatan'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold opacity-60 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                      {physicalTests.map(t => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{t.test_date}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={gradeColors[t.grade] ?? gradeColors['D']}
                            >
                              {t.grade}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>{t.total_score}</td>
                          <td className="px-3 py-2.5">{t.push_up_30s}</td>
                          <td className="px-3 py-2.5">{t.sit_up_30s}</td>
                          <td className="px-3 py-2.5">{t.punches_30s}</td>
                          <td className="px-3 py-2.5">{t.kicks_30s}</td>
                          <td className="px-3 py-2.5">{t.skipping_sec}</td>
                          <td className="px-3 py-2.5">{t.split_front_cm}</td>
                          <td className="px-3 py-2.5">{t.split_side_cm}</td>
                          <td className="px-3 py-2.5 opacity-70 max-w-[160px] truncate" title={t.notes ?? ''}>{t.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Lower Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance list */}
          <div
            className="rounded-3xl p-6 lg:col-span-2 space-y-4 border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <h4 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Riwayat Absensi Terakhir</h4>
            {attendance.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada data kehadiran latihan tercatat.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                {attendance.slice(0, 10).map(rec => {
                  const cfg = STATUS_CONFIG[rec.status as keyof typeof STATUS_CONFIG];
                  return (
                    <div
                      key={rec.id}
                      className="py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors"
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{rec.session_date}</span>
                      </div>
                      <span className="text-xs font-bold capitalize" style={{ color: 'var(--md-sys-color-primary)' }}>{cfg?.label || rec.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coach Notes */}
          <div
            className="rounded-3xl p-6 flex flex-col justify-between border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div>
              <h4 className="font-bold text-base mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>Catatan Khusus Pelatih</h4>
              <p className="text-[10px] opacity-70 mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Informasi riwayat medis, cedera, atau evaluasi teknik khusus atlet</p>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                placeholder="Tulis evaluasi atau riwayat medis..."
                rows={5}
                className="w-full text-xs p-3 rounded-2xl outline-none transition-all"
                style={{
                  background: 'var(--neu-surface-low)',
                  boxShadow: 'var(--neu-shadow-pressed-sm)',
                  color: 'var(--md-sys-color-on-surface)',
                  border: '1px solid var(--neu-border)',
                  resize: 'vertical',
                } as React.CSSProperties}
                onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
              />
            </div>
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="apple-btn w-full mt-4 py-2.5 text-xs font-semibold cursor-pointer"
            >
              {savingNotes ? 'Menyimpan...' : '💾 Simpan Catatan'}
            </button>
          </div>
        </div>

        {/* Fees */}
        {fees.length > 0 && (
          <div
            className="rounded-3xl p-6 border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <h4 className="font-bold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Riwayat Iuran</h4>
            <div className="space-y-2">
              {fees.slice(0, 6).map(fee => (
                <div
                  key={fee.id}
                  className="p-3.5 rounded-2xl flex items-center justify-between border border-[var(--neu-border)] transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {fee.period_month}/{fee.period_year}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Rp {fee.amount?.toLocaleString('id-ID')}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize"
                    style={
                      fee.status === 'lunas'
                        ? { background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 8px rgba(255,82,82,0.3)' }
                        : { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                    }
                  >
                    {fee.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exams & Tournaments history */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ujian */}
          <div
            className="rounded-3xl p-6 border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <h4 className="font-bold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Riwayat Ujian Sabuk</h4>
            {examsPlayed.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum pernah berpartisipasi dalam ujian kenaikan sabuk.</p>
            ) : (
              <div className="space-y-3">
                {examsPlayed.map(ep => (
                  <div
                    key={ep.id}
                    className="p-3.5 rounded-2xl flex items-center justify-between border border-[var(--neu-border)] transition-all"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                  >
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{ep.current_belt} → {ep.target_belt}</p>
                      <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{ep.examDate} · {ep.location}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize"
                      style={
                        ep.result === 'lulus'
                          ? { background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 8px rgba(255,82,82,0.3)' }
                          : { background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }
                      }
                    >
                      {ep.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Turnamen */}
          <div
            className="rounded-3xl p-6 border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <h4 className="font-bold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pencapaian Turnamen</h4>
            {tournamentRuns.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum pernah mengikuti kejuaraan karate resmi.</p>
            ) : (
              <div className="space-y-3">
                {tournamentRuns.map(tr => (
                  <div
                    key={tr.id}
                    className="p-3.5 rounded-2xl flex items-center justify-between border border-[var(--neu-border)] transition-all"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                  >
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{tr.tournamentName}</p>
                      <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tr.category} · {tr.date}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={
                        tr.medal !== 'none'
                          ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                          : { background: 'var(--neu-surface-low)', color: 'var(--md-sys-color-on-surface-variant)', border: '1px solid var(--neu-border)' }
                      }
                    >
                      🏅 {tr.medal === 'none' ? 'Partisipan' : tr.medal}
                    </span>
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
