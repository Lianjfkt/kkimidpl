'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Coach } from '@/lib/mockData';

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-fade-in"
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-medium mb-1.5';
const fieldWrap = 'flex flex-col';

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
      profile_id: editingCoach ? editingCoach.profile_id : 'user-coach-id'
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
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Manajemen Pelatih
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftar pelatih (Sempai/Sensai) dan tarif honor per sesi latihan.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pelatih
          </button>
        </div>

        {/* Coaches Cards / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-[var(--md-sys-shape-corner-extra-large)] animate-pulse"
                style={{ background: 'var(--md-sys-color-surface-container)' }} />
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-[var(--md-sys-shape-corner-extra-large)]"
            style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
            <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Tidak ditemukan data pelatih.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-4 transition-colors"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container-low)')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[var(--md-sys-shape-corner-full)] flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                    🥋
                  </div>
                  <div>
                    <h4 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>{coach.full_name}</h4>
                    <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Sabuk: <span className="font-semibold" style={{ color: 'var(--md-sys-color-primary)' }}>{coach.belt_level}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <div>
                    <span className="block text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Telepon</span>
                    <span className="font-medium text-xs truncate block" style={{ color: 'var(--md-sys-color-on-surface)' }}>{coach.phone}</span>
                  </div>
                  <div>
                    <span className="block text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Honor per Sesi</span>
                    <span className="font-semibold text-xs" style={{ color: 'var(--md-sys-color-tertiary)' }}>
                      Rp {Number(coach.honor_rate).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-1 pt-2">
                  <button
                    onClick={() => openEditModal(coach)}
                    className="m3-btn-text py-1.5 px-3 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coach.id)}
                    className="m3-btn-text py-1.5 px-3 text-xs font-semibold"
                    style={{ color: 'var(--md-sys-color-error)' }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        <M3Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCoach ? 'Edit Data Pelatih' : 'Tambah Pelatih Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Lengkap *</label>
              <input
                type="text"
                required
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No. Telepon *</label>
              <input
                type="tel"
                required
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tingkat Sabuk (Dan)</label>
                <select
                  className={inputClass}
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

              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Mulai Bergabung</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                />
              </div>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tarif Honor Sesi (Rp) *</label>
              <input
                type="number"
                required
                className={inputClass}
                value={honorRate}
                onChange={(e) => setHonorRate(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                className="m3-btn-filled px-5 py-2.5 text-sm"
              >
                Simpan
              </button>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
