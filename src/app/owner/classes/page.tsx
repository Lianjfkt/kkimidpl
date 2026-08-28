'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ClassSession, Coach } from '@/lib/mockData';

function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl"
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
const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const categoryChip = (cat: string) => {
  if (cat === 'kompetisi') return { background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' };
  if (cat === 'remaja') return { background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' };
  return { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' };
};

export default function OwnerClasses() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeStart, setTimeStart] = useState('16:00');
  const [timeEnd, setTimeEnd] = useState('17:30');
  const [coachId, setCoachId] = useState('');
  const [category, setCategory] = useState<'anak' | 'remaja' | 'kompetisi'>('anak');

  const loadData = async () => {
    setLoading(true);
    const [classesRes, coachesRes] = await Promise.all([
      supabase.from('classes').select('*'),
      supabase.from('coaches').select('*'),
    ]);
    if (classesRes.data) setClasses(classesRes.data);
    if (coachesRes.data) {
      setCoaches(coachesRes.data);
      if (coachesRes.data.length > 0) setCoachId(coachesRes.data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setName(''); setDayOfWeek(1); setTimeStart('16:00'); setTimeEnd('17:30');
    if (coaches.length > 0) setCoachId(coaches[0].id);
    setCategory('anak');
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassSession) => {
    setEditingClass(cls);
    setName(cls.name); setDayOfWeek(cls.day_of_week); setTimeStart(cls.time_start);
    setTimeEnd(cls.time_end); setCoachId(cls.coach_id); setCategory(cls.category);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if coachId is a valid UUID, if not set to null (or if empty)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId);
    const cleanedCoachId = isValidUUID ? coachId : null;

    const classData = { 
      name, 
      day_of_week: Number(dayOfWeek), 
      time_start: timeStart, 
      time_end: timeEnd, 
      coach_id: cleanedCoachId, 
      category 
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

  const getCoachName = (id: string) => coaches.find((c) => c.id === id)?.full_name ?? 'Tidak Ditentukan';

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Jadwal Sesi Latihan
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Atur kelas latihan dojo KKI DPL dan tentukan pelatih penanggung jawab.
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
              <div key={i} className="h-36 rounded-[var(--md-sys-shape-corner-extra-large)] animate-pulse"
                style={{ background: 'var(--md-sys-color-surface-container)' }} />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-[var(--md-sys-shape-corner-large)] flex items-center justify-center"
              style={{ background: 'var(--md-sys-color-surface-container)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada sesi kelas dibuat.</p>
            <button onClick={openAddModal} className="m3-btn-tonal px-5 py-2.5 text-sm">Tambah Kelas Pertama</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex flex-col gap-3 transition-colors"
                style={{ background: 'var(--md-sys-color-surface-container-low)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container-low)')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>{cls.name}</h4>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {getCoachName(cls.coach_id)}
                    </p>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold capitalize flex-shrink-0"
                    style={categoryChip(cls.category)}>
                    {cls.category}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {days[cls.day_of_week]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {cls.time_start} – {cls.time_end}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <button onClick={() => openEditModal(cls)} className="m3-btn-text py-1.5 px-3 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(cls.id)} className="m3-btn-text py-1.5 px-3 text-xs font-medium"
                    style={{ color: 'var(--md-sys-color-error)' }}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* M3 Modal */}
        <M3Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}
          title={editingClass ? 'Edit Jadwal Kelas' : 'Tambah Kelas Baru'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Sesi Latihan *</label>
              <input type="text" required className={inputClass} placeholder="mis. Kelas Anak Sore" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Hari Sesi</label>
                <select className={inputClass} value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
                  {days.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kategori</label>
                <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as 'anak' | 'remaja' | 'kompetisi')}>
                  <option value="anak">Anak</option>
                  <option value="remaja">Remaja</option>
                  <option value="kompetisi">Kompetisi</option>
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Jam Mulai</label>
                <input type="time" required className={inputClass} value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Jam Selesai</label>
                <input type="time" required className={inputClass} value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
              </div>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pelatih Penanggung Jawab</label>
              <select className={inputClass} value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                {coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.full_name}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="m3-btn-text px-5 py-2.5 text-sm">Batal</button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">Simpan</button>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
