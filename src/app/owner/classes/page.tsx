'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { ClassSession, Coach } from '@/lib/mockData';

export default function OwnerClasses() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeStart, setTimeStart] = useState('16:00');
  const [timeEnd, setTimeEnd] = useState('17:30');
  const [coachId, setCoachId] = useState('');
  const [category, setCategory] = useState<'anak' | 'remaja' | 'kompetisi'>('anak');

  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const loadData = async () => {
    setLoading(true);
    const { data: classesData } = await supabase.from('classes').select('*');
    const { data: coachesData } = await supabase.from('coaches').select('*');
    
    if (classesData) setClasses(classesData);
    if (coachesData) {
      setCoaches(coachesData);
      if (coachesData.length > 0) setCoachId(coachesData[0].id);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const classData = {
      name,
      day_of_week: Number(dayOfWeek),
      time_start: timeStart,
      time_end: timeEnd,
      coach_id: coachId,
      category,
    };

    if (editingClass) {
      await supabase.from('classes').eq('id', editingClass.id).update(classData);
    } else {
      await supabase.from('classes').insert(classData);
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

  const getCoachName = (id: string) => {
    const coach = coaches.find(c => c.id === id);
    return coach ? coach.full_name : 'Tidak Ditentukan';
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Jadwal Sesi Latihan
            </h2>
            <p className="body-text mt-1">
              Atur kelas latihan dojo KKI DPL dan tentukan pelatih penanggung jawab.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            ＋ Tambah Sesi Kelas
          </button>
        </div>

        {/* Classes Table */}
        <div className="apple-card overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)]">Memuat data kelas...</p>
          ) : classes.length === 0 ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)] text-center">Belum ada sesi kelas dibuat.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-hairline)] bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Kelas</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Hari</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Waktu Sesi</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pelatih</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kategori</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-hairline)]">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-primary)]">{cls.name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{days[cls.day_of_week]}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{cls.time_start} - {cls.time_end}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{getCoachName(cls.coach_id)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-amber-50 text-[var(--color-status-warning)] border border-amber-100">
                        {cls.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                {editingClass ? 'Edit Jadwal Kelas' : 'Tambah Kelas Baru'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Sesi Latihan</label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Kelas Anak Sore"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Hari Sesi</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    >
                      {days.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Kategori</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as 'anak' | 'remaja' | 'kompetisi')}
                    >
                      <option value="anak">Anak</option>
                      <option value="remaja">Remaja</option>
                      <option value="kompetisi">Kompetisi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Jam Mulai</label>
                    <input
                      type="time"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Jam Selesai</label>
                    <input
                      type="time"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pelatih Penanggung Jawab</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={coachId}
                    onChange={(e) => setCoachId(e.target.value)}
                  >
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>{coach.full_name}</option>
                    ))}
                  </select>
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
