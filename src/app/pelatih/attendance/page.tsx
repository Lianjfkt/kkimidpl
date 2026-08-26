'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, ClassSession, StudentAttendance, Coach } from '@/lib/mockData';
import { useSearchParams } from 'next/navigation';

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-fade-in"
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

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
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: coachData } = await supabase
        .from('coaches')
        .eq('profile_id', userData.user.id)
        .single();
      
      if (coachData) {
        setCoach(coachData);
        const { data: classesData } = await supabase
          .from('classes')
          .eq('coach_id', coachData.id)
          .select('*');
        if (classesData) {
          setClasses(classesData);
          if (!selectedClassId && classesData.length > 0) {
            setSelectedClassId(classesData[0].id);
          }
        }
      }
    }

    const [studentsRes, enrollRes] = await Promise.all([
      supabase.from('students').eq('status', 'active').select('*'),
      supabase.from('class_students').select('*')
    ]);

    if (studentsRes.data) {
      setAllStudents(studentsRes.data);
    }
    if (enrollRes.data) {
      setEnrollments(enrollRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter students whenever selectedClassId or allStudents/enrollments changes
  useEffect(() => {
    if (!selectedClassId) return;
    const enrolledIds = enrollments
      .filter((e: any) => e.class_id === selectedClassId)
      .map((e: any) => e.student_id);
    
    const filtered = allStudents.filter(s => enrolledIds.includes(s.id));
    setStudents(filtered);

    const initialStates: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'> = {};
    filtered.forEach((s: Student) => {
      initialStates[s.id] = 'hadir';
    });
    setAttendanceState(initialStates);
  }, [selectedClassId, allStudents, enrollments]);

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
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '20px' }}>
          <div className="flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kelas Latihan</label>
            <select
              className="m3-textfield-outlined text-sm"
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
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Latihan</label>
            <input
              type="date"
              required
              className="m3-textfield-outlined text-sm"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Student Grid */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)]"
          style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '24px' }}>
          <div className="pb-4 mb-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Daftar Kehadiran Siswa
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse"
                  style={{ background: 'var(--md-sys-color-surface-container)' }} />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada siswa terdaftar pada kelas ini.</p>
          ) : (
            <div className="divide-y animate-fade-in" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              {students.map((student) => (
                <div key={student.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.full_name}</h4>
                      <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.current_belt}</p>
                    </div>
                  </div>

                  {/* Attendance toggle buttons */}
                  <div className="flex space-x-1 p-1 rounded-xl w-fit"
                    style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                    {(['hadir', 'izin', 'sakit', 'alpha'] as const).map((status) => {
                      const isActive = attendanceState[student.id] === status;
                      const getStatusStyle = () => {
                        if (!isActive) return { color: 'var(--md-sys-color-on-surface-variant)', background: 'transparent' };
                        switch (status) {
                          case 'hadir': return { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 'bold' };
                          case 'izin': return { background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 'bold' };
                          case 'sakit': return { background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontWeight: 'bold' };
                          case 'alpha': return { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', fontWeight: 'bold' };
                        }
                      };

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(student.id, status)}
                          className="px-3.5 py-1.5 rounded-lg text-xs capitalize transition-all cursor-pointer"
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

          <div className="pt-6 border-t mt-6 flex justify-end" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <button
              type="submit"
              disabled={submitLoading || loading || students.length === 0}
              className="m3-btn-filled px-6 py-2.5 font-semibold text-sm cursor-pointer"
            >
              {submitLoading ? 'Menyimpan...' : 'Simpan Absensi Sesi'}
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
          <button type="button" onClick={() => setShowDuplicateDialog(false)} className="m3-btn-text text-sm px-4 py-2">Batal</button>
          <button type="button" onClick={performSubmit} className="m3-btn-filled text-sm px-4 py-2" style={{ background: 'var(--md-sys-color-error)' }}>Timpah Data</button>
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
