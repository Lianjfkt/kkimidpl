'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Fee, StudentAttendance, TournamentParticipant, Tournament, BeltExam, ExamParticipant } from '@/lib/mockData';

const beltOrder = ['Putih', 'Kuning', 'Orange', 'Hijau', 'Biru Muda', 'Biru Tua', 'Coklat Muda', 'Coklat', 'Hitam'];

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
        const studRes = await supabase.from('students').eq('id', studentId).single();

        if (!studRes.data) {
          // Fallback: try fetching all students and find by ID manually
          const allStudRes = await supabase.from('students').select('*');
          const found = (allStudRes.data || []).find((s: Student) => s.id === studentId);
          if (found) {
            setStudent(found);
            setCoachNotes(found.medical_history || '');
          } else {
            setErrorMsg(`Siswa dengan ID "${studentId}" tidak ditemukan.`);
            setLoading(false);
            return;
          }
        } else {
          setStudent(studRes.data as Student);
          setCoachNotes(studRes.data.medical_history || '');
        }

        // Load related data in parallel, each independently
        const [feesRes, attRes, tournPartsRes, tournsRes, examPartsRes, examsRes] = await Promise.all([
          supabase.from('fees').eq('student_id', studentId).select('*'),
          supabase.from('attendance_students').eq('student_id', studentId).select('*'),
          supabase.from('tournament_participants').eq('student_id', studentId).select('*'),
          supabase.from('tournaments').select('*'),
          supabase.from('exam_participants').eq('student_id', studentId).select('*'),
          supabase.from('belt_exams').select('*'),
        ]);

        if (feesRes.data) setFees(feesRes.data as Fee[]);
        if (attRes.data) setAttendance(attRes.data as StudentAttendance[]);

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
      await supabase.from('students').eq('id', studentId).update({ medical_history: coachNotes });
      alert('Catatan pelatih berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan catatan.');
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
          <p className="text-xs mt-2" style={{ color: 'var(--md-sys-color-outline)' }}>ID: {studentId}</p>
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
            className="m3-btn-outlined py-1.5 px-4 text-xs font-semibold"
          >
            ← Kembali ke Daftar
          </button>
          <div className="p-8 text-center rounded-3xl" style={{ background: 'var(--md-sys-color-error-container)' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
              {errorMsg || 'Siswa tidak ditemukan.'}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.7 }}>
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

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/owner/students')}
            className="m3-btn-outlined py-1.5 px-3 text-xs font-semibold cursor-pointer"
          >
            ← Kembali ke Daftar
          </button>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Profil Detail Atlet
          </h2>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main profile card */}
          <div className="m3-card-elevated flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-3xl font-extrabold mb-3">
              {student.full_name.charAt(0)}
            </div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.full_name}</h3>
            <span className="text-xs uppercase tracking-wider font-semibold opacity-60">{student.nik || 'No NIK'}</span>
            <span className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold bg-[var(--md-sys-color-surface-variant)]" style={{ color: 'var(--md-sys-color-primary)' }}>
              🥋 Sabuk {student.current_belt}
            </span>

            {/* Status badge */}
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
              student.status === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {student.status === 'active' ? '✓ Aktif' : '✗ Nonaktif'}
            </span>

            <div className="w-full grid grid-cols-2 gap-2 text-left mt-6 pt-6 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
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
              <div className="w-full text-left mt-4 pt-4 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <span className="block text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>No. Telepon</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.phone}</span>
              </div>
            )}

            {(student.parent_name || student.parent_job) && (
              <div className="w-full text-left mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
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
          <div className="m3-card-elevated md:col-span-2">
            <h4 className="font-bold text-base mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Belt Journey &amp; Progress</h4>

            {/* Visual belt progress bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                <span>Sabuk {student.current_belt}</span>
                <span>{progressPct}% menuju Sabuk Hitam</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--md-sys-color-surface-container-highest)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: 'var(--md-sys-color-primary)' }}
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-[var(--md-sys-color-primary)] text-white ring-2 ring-red-300'
                          : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-400'
                      }`}
                        style={!isCurrent && !isPassed ? { background: 'var(--md-sys-color-surface-container-highest)' } : {}}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-[9px] font-semibold" style={{ color: isCurrent ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}>{belt}</span>
                    </div>
                    {idx < beltOrder.length - 1 && (
                      <div className={`w-6 h-0.5 ${isPassed ? 'bg-emerald-500' : ''}`}
                        style={!isPassed ? { background: 'var(--md-sys-color-surface-container-highest)' } : {}} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Physical stats if available */}
            {(student.weight || student.height || student.specialization) && (
              <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                {student.weight && (
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.weight}</p>
                    <p className="text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>kg</p>
                  </div>
                )}
                {student.height && (
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    <p className="text-2xl font-extrabold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.height}</p>
                    <p className="text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>cm</p>
                  </div>
                )}
                {student.specialization && (
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    <p className="text-sm font-extrabold" style={{ color: 'var(--md-sys-color-primary)' }}>{student.specialization}</p>
                    <p className="text-[10px] opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>Spesialisasi</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lower Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance list */}
          <div className="m3-card-elevated lg:col-span-2 space-y-4">
            <h4 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Riwayat Absensi Terakhir</h4>
            {attendance.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada data kehadiran latihan tercatat.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                {attendance.slice(0, 10).map(rec => {
                  const cfg = STATUS_CONFIG[rec.status as keyof typeof STATUS_CONFIG];
                  return (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between">
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
          <div className="m3-card-elevated flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-base mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>Catatan Khusus Pelatih</h4>
              <p className="text-[10px] opacity-70 mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Informasi riwayat medis, cedera, atau evaluasi teknik khusus atlet</p>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                placeholder="Tulis evaluasi atau riwayat medis..."
                rows={5}
                className="w-full text-xs p-3 rounded-xl focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  resize: 'vertical',
                } as React.CSSProperties}
              />
            </div>
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="m3-btn-filled w-full mt-4 text-xs font-semibold cursor-pointer"
            >
              {savingNotes ? 'Menyimpan...' : '💾 Simpan Catatan'}
            </button>
          </div>
        </div>

        {/* Fees */}
        {fees.length > 0 && (
          <div className="m3-card-elevated">
            <h4 className="font-bold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Riwayat Iuran</h4>
            <div className="space-y-2">
              {fees.slice(0, 6).map(fee => (
                <div key={fee.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {fee.period_month}/{fee.period_year}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Rp {fee.amount?.toLocaleString('id-ID')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    fee.status === 'lunas'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
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
          <div className="m3-card-elevated">
            <h4 className="font-bold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Riwayat Ujian Sabuk</h4>
            {examsPlayed.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum pernah berpartisipasi dalam ujian kenaikan sabuk.</p>
            ) : (
              <div className="space-y-3">
                {examsPlayed.map(ep => (
                  <div key={ep.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{ep.current_belt} → {ep.target_belt}</p>
                      <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{ep.examDate} · {ep.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      ep.result === 'lulus'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {ep.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Turnamen */}
          <div className="m3-card-elevated">
            <h4 className="font-bold text-base mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pencapaian Turnamen</h4>
            {tournamentRuns.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum pernah mengikuti kejuaraan karate resmi.</p>
            ) : (
              <div className="space-y-3">
                {tournamentRuns.map(tr => (
                  <div key={tr.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{tr.tournamentName}</p>
                      <p className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tr.category} · {tr.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tr.medal !== 'none'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : ''
                    }`}
                      style={tr.medal === 'none' ? { background: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface-variant)' } : {}}
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
