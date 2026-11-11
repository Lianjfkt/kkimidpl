'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Student } from '@/lib/mockData';
import { OFFICIAL_BELTS, getBeltStyle } from '@/lib/constants/belts';

interface ClassSession {
  id: string;
  name: string;
  category: string;
}

export const BELT_OPTIONS = OFFICIAL_BELTS;

export default function OwnerStudents() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currentBelt, setCurrentBelt] = useState('Putih');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [parentName, setParentName] = useState('');
  const [parentJob, setParentJob] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    const [studRes, clsRes] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('classes').select('*'),
    ]);
    if (studRes.data) setStudents(studRes.data);
    if (clsRes.data) setClasses(clsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setDob('');
    setGender('Laki-laki');
    setAddress('');
    setPhone('');
    setParentName('');
    setParentJob('');
    setSelectedClassId('');
    setCurrentBelt('Putih');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = async (student: Student) => {
    // Reset & populate form state first
    setEditingStudent(student);
    setFullName(student.full_name);
    setDob(student.dob);
    setGender(student.gender);
    setAddress(student.address);
    setPhone(student.phone);
    setParentName(student.parent_name || '');
    setParentJob(student.parent_job || '');
    setCurrentBelt(student.current_belt);
    setStatus(student.status as 'active' | 'inactive');
    setSelectedClassId(''); // reset dulu

    // Buka modal DULU agar tidak tampak tidak responsif
    setIsModalOpen(true);

    // Load data kelas enrollment di background setelah modal terbuka
    try {
      const { data: enrollment } = await supabase
        .from('class_students')
        .eq('student_id', student.id)
        .select('class_id');
      setSelectedClassId(enrollment?.[0]?.class_id || '');
    } catch (err) {
      console.error('[openEditModal] Gagal load enrollment:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const studentData: any = {
      full_name: fullName,
      dob,
      gender,
      address,
      phone,
      parent_name: parentName,
      parent_job: parentJob,
      current_belt: currentBelt,
      status,
      photo_url: editingStudent ? editingStudent.photo_url : '',
      join_date: editingStudent ? editingStudent.join_date : new Date().toISOString().split('T')[0]
    };

    // parent_id hanya diisi jika sedang edit dan siswa sudah punya parent_id valid (UUID ortu)
    // Saat tambah baru oleh owner/pelatih, parent_id dibiarkan null agar tidak melanggar FK
    if (editingStudent) {
      const pid = editingStudent.parent_id;
      if (pid && pid !== 'user-parent-id') {
        studentData.parent_id = pid;
      } else {
        studentData.parent_id = null;
      }
    }
    // Saat insert baru: JANGAN sertakan parent_id sama sekali (biarkan null dari DB)

    let savedStudentId = editingStudent?.id;
    let error = null;
    if (editingStudent) {
      // Update
      const res = await supabase.from('students').eq('id', editingStudent.id).update(studentData);
      error = res.error;
    } else {
      // Create
      const res = await supabase.from('students').insert(studentData);
      error = res.error;
      // Get the newly created student's ID
      if (!error) {
        const { data: newStudents } = await supabase
          .from('students')
          .eq('full_name', fullName)
          .select('id');
        if (newStudents && newStudents.length > 0) {
          savedStudentId = newStudents[newStudents.length - 1].id;
        }
      }
    }

    if (error) {
      alert('Gagal menyimpan data siswa: ' + error.message);
      return;
    }

    // Save class enrollment if a class was selected
    if (savedStudentId && selectedClassId) {
      // Delete old enrollment first
      await supabase.from('class_students').eq('student_id', savedStudentId).delete();
      // Insert new enrollment
      await supabase.from('class_students').insert({
        student_id: savedStudentId,
        class_id: selectedClassId,
      });
    } else if (savedStudentId && !selectedClassId) {
      // Remove from any class if "Tidak Ada" selected
      await supabase.from('class_students').eq('student_id', savedStudentId).delete();
    }

    setIsModalOpen(false);
    loadStudents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      await supabase.from('class_students').eq('student_id', id).delete();
      await supabase.from('students').eq('id', id).delete();
      loadStudents();
    }
  };

  // Filter logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          student.phone.includes(search);
    const matchesBelt = beltFilter ? student.current_belt.includes(beltFilter) : true;
    return matchesSearch && matchesBelt;
  });

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Manajemen Siswa
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftar siswa karate aktif dan tidak aktif di Dojo KKI DPL.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="apple-btn px-4 py-2 text-sm font-semibold cursor-pointer rounded-2xl"
          >
            ＋ Tambah Siswa Baru
          </button>
        </div>

        {/* Filters */}
        <div
          className="rounded-3xl p-4 border border-[var(--neu-border)] flex flex-col md:flex-row gap-4"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama atau nomor telepon..."
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                border: '1px solid var(--neu-border)',
                color: 'var(--md-sys-color-on-surface)',
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'var(--neu-surface-low)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                border: '1px solid var(--neu-border)',
                color: 'var(--md-sys-color-on-surface)',
              }}
              value={beltFilter}
              onChange={(e) => setBeltFilter(e.target.value)}
            >
              <option value="">Semua Sabuk</option>
              {BELT_OPTIONS.map((belt) => (
                <option key={belt} value={belt}>
                  {belt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div
          className="rounded-3xl overflow-hidden border border-[var(--neu-border)] overflow-x-auto"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          {loading ? (
            <p className="p-6 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Memuat data siswa...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ditemukan data siswa.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>TTL</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Gender</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Sabuk</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Telepon</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const beltStyle = getBeltStyle(student.current_belt);
                  return (
                    <tr
                      key={student.id}
                      className="transition-all duration-200"
                      style={{ borderBottom: '1px solid var(--neu-border)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{student.full_name}</div>
                        {student.parent_name && (
                          <div className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Ortu: {student.parent_name} {student.parent_job ? `(${student.parent_job})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.dob}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.gender}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${beltStyle.text}`}
                          style={{
                            background: 'var(--neu-surface-low)',
                            boxShadow: 'var(--neu-shadow-pressed-sm)',
                            border: '1px solid var(--neu-border)',
                          }}
                        >
                          {student.current_belt}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.phone}</td>
                      <td className="px-6 py-4 text-sm">
                        {student.status === 'active' ? (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: 'var(--neu-accent-grad)', color: '#fff', boxShadow: '0 2px 8px rgba(255,82,82,0.3)' }}
                          >
                            Aktif
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border border-[var(--neu-border)]"
                            style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}
                          >
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => router.push(`/owner/students/${student.id}`)}
                          className="text-xs font-semibold cursor-pointer transition-all duration-200 px-2.5 py-1 rounded-xl"
                          style={{ color: 'var(--md-sys-color-primary)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat-sm)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="text-xs font-semibold cursor-pointer transition-all duration-200 px-2.5 py-1 rounded-xl"
                          style={{ color: '#60a5fa' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-high)'; e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat-sm)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-xs font-semibold cursor-pointer transition-all duration-200 px-2.5 py-1 rounded-xl"
                          style={{ color: '#f87171' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat-sm)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div
              className="w-full max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
              style={{
                background: 'var(--neu-surface-high)',
                boxShadow: 'var(--neu-shadow-flat-lg), 0 20px 48px rgba(0,0,0,0.5)',
                border: '1px solid var(--neu-border)',
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer transition-all duration-200 border border-[var(--neu-border)]"
                  style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    background: 'var(--neu-surface-low)',
                    boxShadow: 'var(--neu-shadow-pressed-sm)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat-sm)'; e.currentTarget.style.background = 'var(--neu-surface)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; e.currentTarget.style.background = 'var(--neu-surface-low)'; }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                        colorScheme: 'dark',
                      } as React.CSSProperties}
                      onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Gender
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  {/* Alamat */}
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Alamat Rumah
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  {/* Telepon */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      No. Telepon
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Nama Orang Tua */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Nama Orang Tua
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>

                  {/* Pekerjaan Orang Tua */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Pekerjaan Orang Tua
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      onFocus={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm), 0 0 0 2px var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.currentTarget.style.boxShadow = 'var(--neu-shadow-pressed-sm)'; }}
                      value={parentJob}
                      onChange={(e) => setParentJob(e.target.value)}
                    />
                  </div>

                  {/* Kelas Latihan */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Kelas Latihan
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      <option value="">— Tidak Ada / Belum Ditentukan —</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tingkat Sabuk */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Tingkat Sabuk
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      value={currentBelt}
                      onChange={(e) => setCurrentBelt(e.target.value)}
                    >
                      {BELT_OPTIONS.map((belt) => (
                        <option key={belt} value={belt}>
                          {belt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Status
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        border: '1px solid var(--neu-border)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div
                  className="pt-4 flex justify-end gap-3"
                  style={{ borderTop: '1px solid var(--neu-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="apple-btn-secondary px-5 py-2.5 text-sm font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
