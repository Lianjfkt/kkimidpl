'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Coach } from '@/lib/mockData';

export default function OwnerCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [beltLevel, setBeltLevel] = useState('Dan I');
  const [joinDate, setJoinDate] = useState('');
  const [honorRate, setHonorRate] = useState(150000);

  const loadCoaches = async () => {
    setLoading(true);
    const { data } = await supabase.from('coaches').select('*');
    if (data) setCoaches(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const openAddModal = () => {
    setEditingCoach(null);
    setFullName('');
    setPhone('');
    setBeltLevel('Dan I');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setHonorRate(150000);
    setIsModalOpen(true);
  };

  const openEditModal = (coach: Coach) => {
    setEditingCoach(coach);
    setFullName(coach.full_name);
    setPhone(coach.phone);
    setBeltLevel(coach.belt_level);
    setJoinDate(coach.join_date);
    setHonorRate(Number(coach.honor_rate));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coachData = {
      full_name: fullName,
      phone,
      belt_level: beltLevel,
      join_date: joinDate,
      honor_rate: Number(honorRate),
      profile_id: editingCoach ? editingCoach.profile_id : 'user-coach-id' // Seed linkage
    };

    if (editingCoach) {
      await supabase.from('coaches').eq('id', editingCoach.id).update(coachData);
    } else {
      await supabase.from('coaches').insert(coachData);
    }

    setIsModalOpen(false);
    loadCoaches();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pelatih ini?')) {
      await supabase.from('coaches').eq('id', id).delete();
      loadCoaches();
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="hero-headline text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Manajemen Pelatih
            </h2>
            <p className="body-text mt-1">
              Daftar pelatih (Sempai/Sensai) dan tarif honor per sesi latihan.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            ＋ Tambah Pelatih Baru
          </button>
        </div>

        {/* Coaches Table */}
        <div className="apple-card overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)]">Memuat data pelatih...</p>
          ) : coaches.length === 0 ? (
            <p className="p-6 text-sm text-[var(--color-text-secondary)] text-center">Tidak ditemukan data pelatih.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-hairline)] bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Lengkap</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tingkat Sabuk (Dan)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">No. Telepon</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Mulai Bergabung</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tarif Honor Sesi</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-hairline)]">
                {coaches.map((coach) => (
                  <tr key={coach.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-primary)]">{coach.full_name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{coach.belt_level}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{coach.phone}</td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{coach.join_date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--color-text-primary)]">
                      Rp {Number(coach.honor_rate).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => openEditModal(coach)}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coach.id)}
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
                {editingCoach ? 'Edit Data Pelatih' : 'Tambah Pelatih Baru'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tingkat Sabuk (Dan)</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={beltLevel}
                    onChange={(e) => setBeltLevel(e.target.value)}
                  >
                    <option value="Dan I">Dan I</option>
                    <option value="Dan II">Dan II</option>
                    <option value="Dan III">Dan III</option>
                    <option value="Dan IV">Dan IV</option>
                    <option value="Dan V">Dan V</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Mulai Bergabung</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Tarif Honor Sesi (Rp)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-hairline)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-karate)]"
                    value={honorRate}
                    onChange={(e) => setHonorRate(Number(e.target.value))}
                  />
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
