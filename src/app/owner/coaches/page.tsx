'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Coach } from '@/lib/mockData';

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-[var(--neu-border)] p-6 shadow-2xl animate-fade-in"
        style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-flat-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = 'w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';
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

    const coachData: any = {
      full_name: fullName,
      phone,
      belt_level: beltLevel,
      join_date: joinDate,
      honor_rate: Number(honorRate)
    };

    // If using real Supabase, avoid passing invalid UUID string for profile_id
    if (editingCoach) {
      if (editingCoach.profile_id && editingCoach.profile_id !== 'user-coach-id') {
        coachData.profile_id = editingCoach.profile_id;
      }
    } else {
      if (!isSupabaseConfigured) {
        coachData.profile_id = 'user-coach-id';
      }
    }

    let error = null;
    if (editingCoach) {
      const res = await supabase.from('coaches').eq('id', editingCoach.id).update(coachData);
      error = res.error;
    } else {
      const res = await supabase.from('coaches').insert(coachData);
      error = res.error;
    }

    if (error) {
      alert('Gagal menyimpan data pelatih: ' + error.message);
      return;
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
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Manajemen Pelatih
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftar pelatih (Sempai/Sensai) dan tarif honor per sesi latihan.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pelatih
          </button>
        </div>

        {/* Coaches Cards / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-3xl animate-pulse"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              />
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 rounded-3xl border border-[var(--neu-border)] text-center p-6"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <span className="text-4xl">🥋</span>
            <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Tidak ditemukan data pelatih.
            </p>
            <button onClick={openAddModal} className="apple-btn px-4 py-2 text-xs font-semibold mt-2">
              Tambah Pelatih Baru
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:-translate-y-1 group"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          background: 'var(--neu-surface-high)',
                          boxShadow: 'var(--neu-shadow-flat-sm)',
                        }}
                      >
                        🥋
                      </div>
                      <div>
                        <h4 className="font-bold text-base tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {coach.full_name}
                        </h4>
                        <span
                          className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: 'var(--neu-surface-low)',
                            boxShadow: 'var(--neu-shadow-pressed-sm)',
                            color: 'var(--md-sys-color-primary)',
                          }}
                        >
                          Sabuk {coach.belt_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[var(--neu-border)]">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                    >
                      <span className="block text-[11px] font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Telepon
                      </span>
                      <span className="font-semibold text-xs truncate block mt-0.5" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {coach.phone || '-'}
                      </span>
                    </div>
                    <div
                      className="p-3 rounded-2xl"
                      style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                    >
                      <span className="block text-[11px] font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Honor per Sesi
                      </span>
                      <span className="font-bold text-xs block mt-0.5 text-emerald-400">
                        Rp {Number(coach.honor_rate).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--neu-border)]">
                  <button
                    onClick={() => openEditModal(coach)}
                    className="apple-btn-secondary px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coach.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-rose-400 transition-all hover:bg-rose-500/10 cursor-pointer"
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
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
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
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tingkat Sabuk (Dan)</label>
                <select
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
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
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
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
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                value={honorRate}
                onChange={(e) => setHonorRate(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="apple-btn-secondary px-5 py-2.5 text-sm cursor-pointer"
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
        </M3Dialog>
      </div>
    </Navigation>
  );
}
