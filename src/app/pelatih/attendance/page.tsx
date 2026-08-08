'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, ClassSession, StudentAttendance } from '@/lib/mockData';
import { useSearchParams } from 'next/navigation';

function AttendanceFormContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'>>({});
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    // Load coach classes
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: coachData } = await supabase
        .from('coaches')
        .eq('profile_id', userData.user.id)
        .single();
      
      if (coachData) {
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

    // Load active students
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    if (studentsData) {
      setStudents(studentsData);
      
      // Initialize attendance state with 'hadir' (present) as default
      const initialStates: Record<string, 'hadir' | 'izin' | 'sakit' | 'alpha'> = {};
      studentsData.forEach((s: Student) => {
        initialStates[s.id] = 'hadir';
      });
      setAttendanceState(initialStates);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected class if search parameter changes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMsg('');

    const { data: userData } = await supabase.auth.getUser();
    const markedBy = userData?.user?.id || 'user-coach-id';

    const attendanceRecords: Omit<StudentAttendance, 'id' | 'created_at'>[] = Object.entries(attendanceState).map(([studentId, status]) => ({
      student_id: studentId,
      class_id: selectedClassId,
      session_date: sessionDate,
      status,
      marked_by: markedBy
    }));

    // Save records
    await supabase.from('attendance_students').insert(attendanceRecords);

    // Create a log in notifications
    await supabase.from('notifications').insert({
      user_id: markedBy,
      title: 'Absensi Disubmit',
      message: `Absensi untuk kelas sesi ${classes.find(c => c.id === selectedClassId)?.name || ''} tanggal ${sessionDate} berhasil disimpan.`,
      type: 'absensi',
      is_read: false
    });

    setSuccessMsg('Absensi berhasil disimpan!');
    setSubmitLoading(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Pencatatan Absensi Sesi
        </h2>
        <p className="body-text mt-1">
          Pilih kelas dan tanggal latihan, lalu tandai kehadiran seluruh siswa karate.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Class and Date Selector */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="apple-card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Kelas Latihan</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loading}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal Latihan</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Student Grid */}
        <div className="apple-card">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Daftar Kehadiran Siswa
          </h3>

          {loading ? (
            <p className="text-sm text-[var(--color-text-secondary)] py-4">Memuat daftar siswa...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] py-4">Tidak ada siswa aktif terdaftar.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border-hairline)]">
              {students.map((student) => (
                <div key={student.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-red-50 text-[var(--color-accent-karate)] flex items-center justify-center font-bold text-sm">
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{student.full_name}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">{student.current_belt}</p>
                    </div>
                  </div>

                  {/* Attendance toggle buttons */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {(['hadir', 'izin', 'sakit', 'alpha'] as const).map((status) => {
                      const isActive = attendanceState[student.id] === status;
                      const getStatusColor = () => {
                        if (!isActive) return 'text-gray-500 hover:bg-black/5';
                        switch (status) {
                          case 'hadir': return 'bg-emerald-600 text-white font-semibold';
                          case 'izin': return 'bg-amber-500 text-white font-semibold';
                          case 'sakit': return 'bg-blue-500 text-white font-semibold';
                          case 'alpha': return 'bg-red-600 text-white font-semibold';
                        }
                      };

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(student.id, status)}
                          className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all cursor-pointer ${getStatusColor()}`}
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

          <div className="pt-6 border-t border-[var(--color-border-hairline)] mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitLoading || loading || students.length === 0}
              className="apple-btn px-6 py-2.5 font-semibold text-sm cursor-pointer"
            >
              {submitLoading ? 'Menyimpan...' : 'Simpan Absensi Sesi'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PelatihAttendance() {
  return (
    <Navigation>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <span className="w-12 h-12 rounded-full bg-[var(--color-accent-karate)] flex items-center justify-center text-white font-extrabold text-lg animate-pulse">
            KKI
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mt-4">
            Memuat Formulir Absensi...
          </p>
        </div>
      }>
        <AttendanceFormContent />
      </Suspense>
    </Navigation>
  );
}
