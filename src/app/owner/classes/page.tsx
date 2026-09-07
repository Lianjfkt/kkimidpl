'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { ClassSession, Coach, Student } from '@/lib/mockData';

function M3Dialog({
  open,
  onClose,
  title,
  maxWidth = 'max-w-lg',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-slate-500/10"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
}

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-medium mb-1.5';
const fieldWrap = 'flex flex-col';
const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const BELT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Putih:       { bg: 'bg-slate-200',   text: 'text-slate-800',  border: 'border-slate-300' },
  Kuning:      { bg: 'bg-yellow-300',  text: 'text-yellow-900', border: 'border-yellow-400' },
  Orange:      { bg: 'bg-orange-400',  text: 'text-white',      border: 'border-orange-500' },
  Hijau:       { bg: 'bg-green-500',   text: 'text-white',      border: 'border-green-600' },
  'Biru Muda': { bg: 'bg-blue-400',    text: 'text-white',      border: 'border-blue-500' },
  'Biru Tua':  { bg: 'bg-blue-700',    text: 'text-white',      border: 'border-blue-800' },
  'Coklat Muda':{ bg: 'bg-amber-700',  text: 'text-white',      border: 'border-amber-800' },
  Coklat:      { bg: 'bg-amber-800',   text: 'text-white',      border: 'border-amber-900' },
  Hitam:       { bg: 'bg-gray-900',    text: 'text-white',      border: 'border-red-500' },
};

function getBeltStyle(belt: string) {
  if (!belt) return { bg: 'bg-slate-700', text: 'text-slate-100', border: 'border-slate-600' };
  for (const key of Object.keys(BELT_COLORS)) {
    if (belt.toLowerCase().includes(key.toLowerCase())) {
      return BELT_COLORS[key];
    }
  }
  return { bg: 'bg-slate-700', text: 'text-slate-100', border: 'border-slate-600' };
}

const categoryChip = (cat: string) => {
  if (cat === 'kompetisi') return { background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' };
  if (cat === 'remaja') return { background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' };
  return { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' };
};

export default function OwnerClasses() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<{ class_id: string; student_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Class Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeStart, setTimeStart] = useState('16:00');
  const [timeEnd, setTimeEnd] = useState('17:30');
  const [coachId, setCoachId] = useState('');
  const [category, setCategory] = useState<'anak' | 'remaja' | 'kompetisi'>('anak');

  // Student Management Modal
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<ClassSession | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [studentToAddId, setStudentToAddId] = useState('');
  const [studentActionLoading, setStudentActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [classesRes, coachesRes, studentsRes, enrollmentsRes] = await Promise.all([
      supabase.from('classes').select('*'),
      supabase.from('coaches').select('*'),
      supabase.from('students').select('*'),
      supabase.from('class_students').select('*'),
    ]);

    if (classesRes.data) setClasses(classesRes.data);
    if (coachesRes.data) {
      setCoaches(coachesRes.data);
      if (coachesRes.data.length > 0 && !coachId) setCoachId(coachesRes.data[0].id);
    }
    if (studentsRes.data) setStudents(studentsRes.data);
    if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setName('');
    setDayOfWeek(1);
    setTimeStart('16:00');
    setTimeEnd('17:30');
    if (coaches.length > 0) setCoachId(coaches[0].id);
    setCategory('anak');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassSession) => {
    setEditingClass(cls);
    setName(cls.name);
    setDayOfWeek(cls.day_of_week);
    setTimeStart(cls.time_start);
    setTimeEnd(cls.time_end);
    setCoachId(cls.coach_id);
    setCategory(cls.category);
    setIsModalOpen(true);
  };

  const openStudentModal = (cls: ClassSession) => {
    setSelectedClassForStudents(cls);
    setSearchStudentQuery('');
    setStudentToAddId('');
    setIsStudentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId);
    const cleanedCoachId = isValidUUID ? coachId : null;

    const classData = {
      name,
      day_of_week: Number(dayOfWeek),
      time_start: timeStart,
      time_end: timeEnd,
      coach_id: cleanedCoachId,
      category,
    };

    let error = null;
    if (editingClass) {
      const res = await supabase.from('classes').eq('id', editingClass.id).update(classData);
      error = res.error;
    } else {
      const res = await supabase.from('classes').insert(classData);
      error = res.error;
    }

    if (error) {
      alert('Gagal menyimpan jadwal kelas: ' + error.message);
      return;
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal kelas ini?')) {
      await supabase.from('classes').eq('id', id).delete();
      loadData();
    }
  };

  // Student CRUD for selected class
  const classEnrollments = useMemo(() => {
    if (!selectedClassForStudents) return [];
    return enrollments.filter((e) => e.class_id === selectedClassForStudents.id);
  }, [enrollments, selectedClassForStudents]);

  const enrolledStudentIds = useMemo(() => {
    return new Set(classEnrollments.map((e) => e.student_id));
  }, [classEnrollments]);

  const enrolledStudents = useMemo(() => {
    return students.filter((s) => enrolledStudentIds.has(s.id));
  }, [students, enrolledStudentIds]);

  const filteredEnrolledStudents = useMemo(() => {
    const q = searchStudentQuery.toLowerCase().trim();
    if (!q) return enrolledStudents;
    return enrolledStudents.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.current_belt?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [enrolledStudents, searchStudentQuery]);

  const availableStudentsToAdd = useMemo(() => {
    return students
      .filter((s) => !enrolledStudentIds.has(s.id) && s.status !== 'inactive')
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [students, enrolledStudentIds]);

  const handleAddStudentToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForStudents || !studentToAddId) return;

    setStudentActionLoading(true);
    const { error } = await supabase.from('class_students').insert({
      class_id: selectedClassForStudents.id,
      student_id: studentToAddId,
    });

    if (error) {
      alert('Gagal menambahkan siswa ke kelas: ' + error.message);
    } else {
      setEnrollments((prev) => [...prev, { class_id: selectedClassForStudents.id, student_id: studentToAddId }]);
      setStudentToAddId('');
    }
    setStudentActionLoading(false);
  };

  const handleRemoveStudentFromClass = async (studentId: string, studentName: string) => {
    if (!selectedClassForStudents) return;
    if (!confirm(`Keluarkan ${studentName} dari kelas ${selectedClassForStudents.name}?`)) return;

    setStudentActionLoading(true);
    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', selectedClassForStudents.id)
      .eq('student_id', studentId);

    if (error) {
      alert('Gagal mengeluarkan siswa dari kelas: ' + error.message);
    } else {
      setEnrollments((prev) =>
        prev.filter((e) => !(e.class_id === selectedClassForStudents.id && e.student_id === studentId))
      );
    }
    setStudentActionLoading(false);
  };

  const getCoachName = (id: string) => coaches.find((c) => c.id === id)?.full_name ?? 'Tidak Ditentukan';
  const getClassStudentCount = (classId: string) => enrollments.filter((e) => e.class_id === classId).length;

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Jadwal Sesi Latihan
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Atur kelas latihan dojo KKI DPL, tentukan pelatih penanggung jawab, dan kelola siswa per kelas.
            </p>
          </div>
          <button onClick={openAddModal} className="m3-btn-filled px-5 py-2.5 text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Sesi Kelas
          </button>
        </div>

        {/* Classes grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-[var(--md-sys-shape-corner-extra-large)] animate-pulse"
                style={{ background: 'var(--md-sys-color-surface-container)' }}
              />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-14 h-14 rounded-[var(--md-sys-shape-corner-large)] flex items-center justify-center"
              style={{ background: 'var(--md-sys-color-surface-container)' }}
            >
              <svg className="w-7 h-7" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Belum ada sesi kelas dibuat.
            </p>
            <button onClick={openAddModal} className="m3-btn-tonal px-5 py-2.5 text-sm">
              Tambah Kelas Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const studentCount = getClassStudentCount(cls.id);
              return (
                <div
                  key={cls.id}
                  className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-lg border border-transparent"
                  style={{
                    background: 'var(--md-sys-color-surface-container-low)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container-low)')}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-lg leading-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {cls.name}
                        </h4>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          🥋 Pelatih: <span className="font-semibold">{getCoachName(cls.coach_id)}</span>
                        </p>
                      </div>
                      <span
                        className="inline-flex px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold capitalize flex-shrink-0"
                        style={categoryChip(cls.category)}
                      >
                        {cls.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{days[cls.day_of_week]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{cls.time_start} – {cls.time_end}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface)' }}>
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{studentCount} Siswa</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-3 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <button
                      onClick={() => openStudentModal(cls)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                      style={{
                        background: 'var(--md-sys-color-primary-container)',
                        color: 'var(--md-sys-color-on-primary-container)',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Kelola Siswa ({studentCount})
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(cls)} className="m3-btn-text py-1.5 px-2.5 text-xs font-medium">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="m3-btn-text py-1.5 px-2.5 text-xs font-medium"
                        style={{ color: 'var(--md-sys-color-error)' }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* M3 Modal Add/Edit Class */}
        <M3Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingClass ? 'Edit Jadwal Kelas' : 'Tambah Kelas Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Nama Sesi Latihan *
              </label>
              <input
                type="text"
                required
                className={inputClass}
                placeholder="mis. Kelas Anak Sore"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Hari Sesi
                </label>
                <select className={inputClass} value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
                  {days.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Kategori
                </label>
                <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as any)}>
                  <option value="anak">Anak</option>
                  <option value="remaja">Remaja</option>
                  <option value="kompetisi">Kompetisi</option>
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Jam Mulai
                </label>
                <input type="time" required className={inputClass} value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Jam Selesai
                </label>
                <input type="time" required className={inputClass} value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
              </div>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Pelatih Penanggung Jawab
              </label>
              <select className={inputClass} value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="m3-btn-text px-5 py-2.5 text-sm">
                Batal
              </button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">
                Simpan
              </button>
            </div>
          </form>
        </M3Dialog>

        {/* Modal Manage Students in Class */}
        <M3Dialog
          open={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          maxWidth="max-w-2xl"
          title={`Siswa di ${selectedClassForStudents?.name || 'Kelas'}`}
        >
          {selectedClassForStudents && (
            <div className="space-y-5">
              {/* Class summary badge info */}
              <div
                className="p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                style={{ background: 'var(--md-sys-color-surface-container)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {days[selectedClassForStudents.day_of_week]}, {selectedClassForStudents.time_start} - {selectedClassForStudents.time_end}
                  </span>
                  <span className="opacity-40">•</span>
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Pelatih: <span className="font-medium">{getCoachName(selectedClassForStudents.coach_id)}</span>
                  </span>
                </div>
                <div className="font-semibold text-primary">
                  Total: {enrolledStudents.length} Siswa Terdaftar
                </div>
              </div>

              {/* Form Tambah Siswa ke Kelas */}
              <form onSubmit={handleAddStudentToClass} className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  + Tambahkan Siswa ke Kelas Ini
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    className="flex-1 m3-textfield-outlined text-sm"
                    value={studentToAddId}
                    onChange={(e) => setStudentToAddId(e.target.value)}
                    disabled={studentActionLoading}
                  >
                    <option value="">-- Pilih Siswa Dojo ({availableStudentsToAdd.length} siswa tersedia) --</option>
                    {availableStudentsToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.current_belt})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!studentToAddId || studentActionLoading}
                    className="m3-btn-filled px-4 py-2 text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    {studentActionLoading ? 'Menyimpan...' : 'Tambahkan'}
                  </button>
                </div>
              </form>

              {/* Search & Student List */}
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Daftar Siswa Kelas ({enrolledStudents.length})
                  </h4>
                  {enrolledStudents.length > 5 && (
                    <input
                      type="text"
                      placeholder="Cari siswa di kelas..."
                      className="m3-textfield-outlined text-xs py-1 px-3 w-48"
                      value={searchStudentQuery}
                      onChange={(e) => setSearchStudentQuery(e.target.value)}
                    />
                  )}
                </div>

                {enrolledStudents.length === 0 ? (
                  <div className="py-10 text-center rounded-xl" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
                    <div className="text-3xl mb-2">🥋</div>
                    <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      Belum ada siswa di kelas ini
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Gunakan dropdown di atas untuk memasukkan siswa ke jadwal latihan ini.
                    </p>
                  </div>
                ) : filteredEnrolledStudents.length === 0 ? (
                  <div className="py-6 text-center text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Tidak ada siswa yang cocok dengan pencarian &quot;{searchStudentQuery}&quot;
                  </div>
                ) : (
                  <div className="divide-y max-h-72 overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    {filteredEnrolledStudents.map((st) => {
                      const belt = getBeltStyle(st.current_belt);
                      return (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-3 transition-colors hover:bg-slate-500/5"
                          style={{ background: 'var(--md-sys-color-surface-container-low)' }}
                        >
                          <div className="flex items-center gap-3">
                            {st.photo_url ? (
                              <img
                                src={st.photo_url}
                                alt={st.full_name}
                                className="w-10 h-10 rounded-full object-cover border"
                                style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                                style={{
                                  background: 'var(--md-sys-color-primary-container)',
                                  color: 'var(--md-sys-color-on-primary-container)',
                                }}
                              >
                                {st.full_name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {st.full_name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${belt.bg} ${belt.text} ${belt.border}`}>
                                  {st.current_belt}
                                </span>
                                {st.phone && (
                                  <span className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    📱 {st.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStudentFromClass(st.id, st.full_name)}
                            disabled={studentActionLoading}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors hover:bg-red-500/10"
                            style={{ color: 'var(--md-sys-color-error)' }}
                            title="Keluarkan dari kelas"
                          >
                            Keluarkan
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="m3-btn-filled px-5 py-2 text-sm"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </M3Dialog>
      </div>
    </Navigation>
  );
}

