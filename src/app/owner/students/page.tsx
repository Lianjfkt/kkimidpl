'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Student } from '@/lib/mockData';

interface ClassSession {
  id: string;
  name: string;
  category: string;
}

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
  for (const key of Object.keys(BELT_COLORS)) {
    if (belt.toLowerCase().includes(key.toLowerCase())) {
      return BELT_COLORS[key];
    }
  }
  return { bg: 'bg-slate-700', text: 'text-slate-100', border: 'border-slate-600' };
}

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
  const [currentBelt, setCurrentBelt] = useState('Putih (Geup 10)');
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
    setCurrentBelt('Putih (Geup 10)');
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

    // If using real Supabase, avoid passing invalid UUID string for parent_id
    if (editingStudent) {
      if (editingStudent.parent_id && editingStudent.parent_id !== 'user-parent-id') {
        studentData.parent_id = editingStudent.parent_id;
      }
    } else {
      if (!isSupabaseConfigured) {
        studentData.parent_id = 'user-parent-id';
      }
    }

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
            className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            ＋ Tambah Siswa Baru
          </button>
        </div>

        {/* Filters */}
        <div className="apple-card flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama atau nomor telepon..."
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
              value={beltFilter}
              onChange={(e) => setBeltFilter(e.target.value)}
            >
              <option value="">Semua Sabuk</option>
              <option value="Putih">Putih</option>
              <option value="Kuning">Kuning</option>
              <option value="Hijau">Hijau</option>
              <option value="Biru">Biru</option>
              <option value="Coklat">Coklat</option>
              <option value="Hitam">Hitam</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="apple-card overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Memuat data siswa...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ditemukan data siswa.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container)' }}>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>TTL</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Gender</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Sabuk</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Telepon</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const beltStyle = getBeltStyle(student.current_belt);
                  return (
                    <tr
                      key={student.id}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                        background: idx % 2 === 0 ? 'var(--md-sys-color-surface-container-low)' : 'var(--md-sys-color-surface-container)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--md-sys-color-surface-container-low)' : 'var(--md-sys-color-surface-container)')}
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                          {student.current_belt}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.phone}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          student.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {student.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => router.push(`/owner/students/${student.id}`)}
                          className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                          style={{ color: 'var(--md-sys-color-primary)' }}
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                          style={{ color: '#60a5fa' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                          style={{ color: '#f87171' }}
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
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div
              className="rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              style={{
                background: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer transition-colors"
                  style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    background: 'var(--md-sys-color-surface-container)',
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        colorScheme: 'dark',
                      } as React.CSSProperties}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Gender
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
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
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Alamat Rumah
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  {/* Telepon */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      No. Telepon
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Nama Orang Tua */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Nama Orang Tua
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>

                  {/* Pekerjaan Orang Tua */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Pekerjaan Orang Tua
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      value={parentJob}
                      onChange={(e) => setParentJob(e.target.value)}
                    />
                  </div>

                  {/* Kelas Latihan */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Kelas Latihan
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
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
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Tingkat Sabuk
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                      }}
                      value={currentBelt}
                      onChange={(e) => setCurrentBelt(e.target.value)}
                    >
                      <option value="Putih (Geup 10)">Putih (Geup 10)</option>
                      <option value="Kuning (Geup 9)">Kuning (Geup 9)</option>
                      <option value="Hijau (Geup 8)">Hijau (Geup 8)</option>
                      <option value="Biru (Geup 7)">Biru (Geup 7)</option>
                      <option value="Cokelat (Geup 6)">Cokelat (Geup 6)</option>
                      <option value="Hitam (Dan I)">Hitam (Dan I)</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
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
                  style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-colors"
                    style={{
                      background: 'var(--md-sys-color-surface-container)',
                      color: 'var(--md-sys-color-on-surface)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                    }}
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
