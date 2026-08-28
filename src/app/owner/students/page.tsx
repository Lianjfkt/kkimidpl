'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student } from '@/lib/mockData';

export default function OwnerStudents() {
  const [students, setStudents] = useState<Student[]>([]);
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

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    const { data } = await supabase.from('students').select('*');
    if (data) setStudents(data);
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
    setCurrentBelt('Putih (Geup 10)');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const studentData = {
      full_name: fullName,
      dob,
      gender,
      address,
      phone,
      parent_name: parentName,
      parent_job: parentJob,
      current_belt: currentBelt,
      status,
      parent_id: editingStudent ? editingStudent.parent_id : 'user-parent-id',
      photo_url: editingStudent ? editingStudent.photo_url : '',
      join_date: editingStudent ? editingStudent.join_date : new Date().toISOString().split('T')[0]
    };

    if (editingStudent) {
      // Update
      await supabase.from('students').eq('id', editingStudent.id).update(studentData);
    } else {
      // Create
      await supabase.from('students').insert(studentData);
    }

    setIsModalOpen(false);
    loadStudents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
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
            <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Manajemen Siswa
            </h2>
            <p className="body-text mt-1">
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
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
              value={beltFilter}
              onChange={(e) => setBeltFilter(e.target.value)}
            >
              <option value="">Semua Sabuk</option>
              <option value="Putih">Putih</option>
              <option value="Kuning">Kuning</option>
              <option value="Hijau">Hijau</option>
              <option value="Biru">Biru</option>
              <option value="Cokelat">Cokelat</option>
              <option value="Hitam">Hitam</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="apple-card overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)]">Memuat data siswa...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)] text-center">Tidak ditemukan data siswa.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-hairline)] bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">TTL</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Gender</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Sabuk</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Telepon</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-hairline)]">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-primary)]">
                      <div>{student.full_name}</div>
                      {student.parent_name && (
                        <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                          Ortu: {student.parent_name} {student.parent_job ? `(${student.parent_job})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{student.dob}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{student.gender}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-[var(--color-accent-karate)] border border-red-100">
                        {student.current_belt}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{student.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <Link
                        href={`/owner/students/${student.id}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: 'var(--md-sys-color-primary)' }}
                      >
                        Detail
                      </Link>
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal Lahir</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Gender</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Alamat Rumah</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">No. Telepon</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Orang Tua</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pekerjaan Orang Tua</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={parentJob}
                      onChange={(e) => setParentJob(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tingkat Sabuk</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
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

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Status</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-hairline)] flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="apple-btn-secondary py-2 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="apple-btn py-2 text-xs font-semibold cursor-pointer"
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
