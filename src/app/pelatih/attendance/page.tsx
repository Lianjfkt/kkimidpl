'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, ClassSession, StudentAttendance, Coach } from '@/lib/mockData';
import { useSearchParams } from 'next/navigation';

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl animate-fade-in p-6"
        style={{
          background: 'var(--neu-surface-high)',
          boxShadow: 'var(--neu-shadow-flat-lg), 0 20px 48px rgba(0,0,0,0.5)',
          border: '1px solid var(--neu-border)',
        }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const neuInputStyle: React.CSSProperties = {
  background: 'var(--neu-surface-low)',
  boxShadow: 'var(--neu-shadow-pressed-sm)',
  border: '1px solid var(--neu-border)',
  color: 'var(--md-sys-color-on-surface)',
};

function AttendanceFormContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'>>({});
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const loadData = async () => {
    setLoading(true);
    let classesList: ClassSession[] = [];
    let coachObj: Coach | null = null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: coachData } = await supabase
          .from('coaches')
          .eq('profile_id', userData.user.id)
          .maybeSingle();
        
        if (coachData) {
          coachObj = coachData;
          setCoach(coachData);
          const { data: coachClasses } = await supabase
            .from('classes')
            .eq('coach_id', coachData.id)
            .select('*');
          if (coachClasses && coachClasses.length > 0) {
            classesList = coachClasses;
          }
        }
      }

      // Fallback jika pelatih belum ditugaskan kelas tertentu: ambil semua kelas
      if (classesList.length === 0) {
        const { data: allCls } = await supabase.from('classes').select('*');
        if (allCls && allCls.length > 0) {
          classesList = allCls;
        }
      }

      setClasses(classesList);
      if (!selectedClassId && classesList.length > 0) {
        setSelectedClassId(classesList[0].id);
      }

      const [studentsRes, enrollRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('class_students').select('*')
      ]);

      if (studentsRes.data && studentsRes.data.length > 0) {
        const activeOnly = studentsRes.data.filter((s: Student) => s.status === 'active');
        setAllStudents(activeOnly.length > 0 ? activeOnly : studentsRes.data);
      }
      if (enrollRes.data) {
        setEnrollments(enrollRes.data);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter students whenever selectedClassId or allStudents/enrollments changes
  useEffect(() => {
    if (allStudents.length === 0) return;

    if (!selectedClassId) {
      setStudents(allStudents);
      const initialStates: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'> = {};
      allStudents.forEach((s: Student) => { initialStates[s.id] = 'hadir'; });
      setAttendanceState(initialStates);
      return;
    }

    const enrolledIds = enrollments
      .filter((e: any) => e.class_id === selectedClassId)
      .map((e: any) => e.student_id);
    
    // Fallback: Jika kelas belum memiliki mapping siswa spesifik di class_students, tampilkan seluruh siswa aktif
    const filtered = (enrolledIds.length > 0)
      ? allStudents.filter(s => enrolledIds.includes(s.id))
      : allStudents;

    setStudents(filtered);

    const initialStates: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'> = {};
    filtered.forEach((s: Student) => {
      initialStates[s.id] = 'hadir';
    });
    setAttendanceState(initialStates);
  }, [selectedClassId, allStudents, enrollments]);

  // Fetch existing attendance records from database to pre-populate the form
  useEffect(() => {
    if (!selectedClassId || !sessionDate || students.length === 0) return;

    const fetchExistingAttendance = async () => {
      const { data: existing, error } = await supabase
        .from('attendance_students')
        .eq('class_id', selectedClassId)
        .eq('session_date', sessionDate)
        .select('student_id, status');

      if (error) {
        console.error('Error fetching existing attendance:', error);
        return;
      }

      if (existing && existing.length > 0) {
        const loadedStates: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'> = {};
        // Default to 'hadir' for all enrolled students
        students.forEach((s) => {
          loadedStates[s.id] = 'hadir';
        });
        // Override with database status
        existing.forEach((record: any) => {
          loadedStates[record.student_id] = record.status;
        });
        setAttendanceState(loadedStates);
      } else {
        // Reset to default 'hadir' if no records are found in database
        const resetStates: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'> = {};
        students.forEach((s) => {
          resetStates[s.id] = 'hadir';
        });
        setAttendanceState(resetStates);
      }
    };

    fetchExistingAttendance();
  }, [selectedClassId, sessionDate, students]);

  useEffect(() => {
    if (classId) {
      setSelectedClassId(classId);
    }
  }, [classId]);

  const handleStatusChange = (studentId: string, status: 'hadir' | 'izin' | 'sakit' | 'alpha') => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const checkAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    // Cek duplikasi
    const { data: existing } = await supabase
      .from('attendance_students')
      .eq('class_id', selectedClassId)
      .eq('session_date', sessionDate)
      .select('*');

    if (existing && existing.length > 0) {
      setSubmitLoading(false);
      setShowDuplicateDialog(true);
    } else {
      await performSubmit();
    }
  };

  const performSubmit = async () => {
    setSubmitLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const markedBy = userData?.user?.id || 'user-coach-id';

    // Delete existing if overwriting
    await supabase.from('attendance_students')
      .eq('class_id', selectedClassId)
      .eq('session_date', sessionDate)
      .delete();

    const attendanceRecords: Omit<StudentAttendance, 'id' | 'created_at'>[] = Object.entries(attendanceState).map(([studentId, status]) => ({
      student_id: studentId,
      class_id: selectedClassId,
      session_date: sessionDate,
      status,
      marked_by: markedBy
    }));

    await supabase.from('attendance_students').insert(attendanceRecords);

    // Coach attendance duplicate prevention
    const { data: coachExisting } = await supabase
      .from('attendance_coaches')
      .eq('coach_id', coach?.id)
      .eq('class_id', selectedClassId)
      .eq('session_date', sessionDate)
      .select('*');

    if (!coachExisting || coachExisting.length === 0) {
      if (coach) {
        await supabase.from('attendance_coaches').insert({
          coach_id: coach.id,
          class_id: selectedClassId,
          session_date: sessionDate,
          status: 'hadir',
        });
      }
    }

    await supabase.from('notifications').insert({
      user_id: markedBy,
      title: 'Absensi Disubmit',
      message: `Absensi untuk kelas sesi ${classes.find(c => c.id === selectedClassId)?.name || ''} tanggal ${sessionDate} berhasil disimpan.`,
      type: 'absensi',
      is_read: false
    });

    setSuccessMsg('Absensi berhasil disimpan!');
    setSubmitLoading(false);
    setShowDuplicateDialog(false);
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          Pencatatan Absensi Sesi
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Pilih kelas dan tanggal latihan, lalu tandai kehadiran seluruh siswa karate.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl text-sm font-semibold animate-fade-in"
          style={{ background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
          {successMsg}
        </div>
      )}

      {/* Class and Date Selector */}
      <form onSubmit={checkAndSubmit} className="space-y-6">
        <div className="rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4 border border-[var(--neu-border)] p-5"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kelas Latihan</label>
            <select
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all duration-200"
              style={neuInputStyle}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loading}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Latihan</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all duration-200"
              style={neuInputStyle}
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Student Grid */}
        <div className="rounded-3xl border border-[var(--neu-border)] p-6"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}>
          <div className="pb-4 mb-4 border-b border-[var(--neu-border)] flex items-center justify-between">
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Daftar Kehadiran Siswa
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full border border-[var(--neu-border)]"
              style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}>
              {students.length} Siswa Terdaftar
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-2xl animate-pulse"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }} />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada siswa terdaftar pada kelas ini.</p>
          ) : (
            <div className="divide-y animate-fade-in" style={{ borderColor: 'var(--neu-border)' }}>
              {students.map((student) => (
                <div key={student.id}
                  className="py-4 px-3 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-200"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-[var(--neu-border)]"
                      style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-primary)' }}>
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.full_name}</h4>
                      <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>🥋 Sabuk {student.current_belt || 'Putih'}</p>
                    </div>
                  </div>

                  {/* Attendance tactile toggle buttons */}
                  <div className="flex space-x-1.5 p-1.5 rounded-2xl w-fit border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed)' }}>
                    {(['hadir', 'izin', 'sakit', 'alpha'] as const).map((status) => {
                      const isActive = attendanceState[student.id] === status;
                      const getStatusStyle = () => {
                        if (!isActive) return { color: 'var(--md-sys-color-on-surface-variant)', background: 'transparent', boxShadow: 'none' };
                        switch (status) {
                          case 'hadir': return { background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.5)', color: '#34d399', boxShadow: 'var(--neu-shadow-flat-sm)', fontWeight: 'bold' };
                          case 'izin': return { background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.5)', color: '#60a5fa', boxShadow: 'var(--neu-shadow-flat-sm)', fontWeight: 'bold' };
                          case 'sakit': return { background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', boxShadow: 'var(--neu-shadow-flat-sm)', fontWeight: 'bold' };
                          case 'alpha': return { background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.5)', color: '#f87171', boxShadow: 'var(--neu-shadow-flat-sm)', fontWeight: 'bold' };
                        }
                      };

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(student.id, status)}
                          className="px-3.5 py-1.5 rounded-xl text-xs capitalize transition-all duration-200 cursor-pointer"
                          style={getStatusStyle()}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 border-t mt-6 flex justify-end" style={{ borderColor: 'var(--neu-border)' }}>
            <button
              type="submit"
              disabled={submitLoading || loading || students.length === 0}
              className="apple-btn px-6 py-2.5 font-semibold text-sm cursor-pointer"
            >
              {submitLoading ? 'Menyimpan...' : '💾 Simpan Absensi Sesi'}
            </button>
          </div>
        </div>
      </form>

      {/* Duplicate warning M3Dialog */}
      <M3Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)} title="Peringatan Duplikasi">
        <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Absensi untuk kelas ini pada tanggal <strong>{sessionDate}</strong> sudah pernah diinput sebelumnya. Apakah Anda ingin menimpanya?
        </p>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={() => setShowDuplicateDialog(false)} className="apple-btn-secondary text-sm px-4 py-2 cursor-pointer">Batal</button>
          <button type="button" onClick={performSubmit} className="apple-btn text-sm px-4 py-2 cursor-pointer" style={{ background: 'linear-gradient(145deg, #e53935, #b71c1c)' }}>Timpah Data</button>
        </div>
      </M3Dialog>
    </div>
  );
}

export default function PelatihAttendance() {
  return (
    <Navigation>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <span className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg animate-pulse"
            style={{ background: 'var(--md-sys-color-primary)' }}>
            KKI
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider mt-4 animate-pulse"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Memuat Formulir Absensi...
          </p>
        </div>
      }>
        <AttendanceFormContent />
      </Suspense>
    </Navigation>
  );
}
