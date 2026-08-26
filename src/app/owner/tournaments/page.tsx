'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Tournament, TournamentParticipant } from '@/lib/mockData';

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

export default function OwnerTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tournament selection state
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>('');

  // Form states (Create Tournament)
  const [isTourneyModalOpen, setIsTourneyModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [tourneyDate, setTourneyDate] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState<'lokal' | 'regional' | 'nasional'>('lokal');
  const [organizer, setOrganizer] = useState('');

  // Form states (Register Competitor)
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<'kata' | 'kumite'>('kata');
  const [weightClass, setWeightClass] = useState('');

  // Medal winner state
  const [medalState, setMedalState] = useState<Record<string, 'emas' | 'perak' | 'perunggu' | 'none'>>({});

  const loadData = async () => {
    setLoading(true);
    const { data: tourneysData } = await supabase.from('tournaments').select('*');
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    const { data: participantsData } = await supabase.from('tournament_participants').select('*');

    if (tourneysData) {
      setTournaments(tourneysData);
      if (tourneysData.length > 0 && !selectedTourneyId) {
        setSelectedTourneyId(tourneysData[0].id);
      }
    }
    if (studentsData) {
      setStudents(studentsData);
      if (studentsData.length > 0) setSelectedStudentId(studentsData[0].id);
    }
    if (participantsData) {
      setParticipants(participantsData);
      
      const medals: Record<string, 'emas' | 'perak' | 'perunggu' | 'none'> = {};
      participantsData.forEach((p: TournamentParticipant) => {
        medals[p.id] = (p.medal as any) || 'none';
      });
      setMedalState(medals);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTourney = {
      name,
      tournament_date: tourneyDate,
      location,
      level,
      organizer
    };

    await supabase.from('tournaments').insert(newTourney);
    
    // Broadcast notifications to parents
    const parentNotifications = students.map(s => ({
      user_id: s.parent_id || 'user-parent-id',
      title: 'Event Turnamen Baru',
      message: `Telah dibuka pendaftaran atlet untuk event turnamen "${name}" yang diadakan pada tanggal ${tourneyDate} di ${location}.`,
      type: 'turnamen' as const,
      is_read: false
    }));
    await supabase.from('notifications').insert(parentNotifications);

    setIsTourneyModalOpen(false);
    setName('');
    setTourneyDate('');
    setLocation('');
    setOrganizer('');
    loadData();
  };

  const handleRegisterCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTourneyId || !selectedStudentId) return;

    // Check duplicate
    const exists = participants.some(p => p.tournament_id === selectedTourneyId && p.student_id === selectedStudentId);
    if (exists) {
      alert('Atlet ini sudah didaftarkan di turnamen.');
      return;
    }

    const newParticipant = {
      tournament_id: selectedTourneyId,
      student_id: selectedStudentId,
      category,
      weight_class: weightClass || null,
      result: 'Berpartisipasi',
      medal: 'none' as const
    };

    await supabase.from('tournament_participants').insert(newParticipant);
    setIsRegModalOpen(false);
    setWeightClass('');
    loadData();
  };

  const handleMedalChange = async (partId: string, medal: 'emas' | 'perak' | 'perunggu' | 'none') => {
    setMedalState(prev => ({ ...prev, [partId]: medal }));
    
    await supabase.from('tournament_participants').eq('id', partId).update({
      medal,
      result: medal !== 'none' ? `Juara Medal ${medal}` : 'Berpartisipasi'
    });

    if (medal !== 'none') {
      const part = participants.find(p => p.id === partId);
      const student = students.find(s => s.id === part?.student_id);
      const tourney = tournaments.find(t => t.id === selectedTourneyId);
      if (student && tourney) {
        await supabase.from('notifications').insert({
          user_id: student.parent_id || 'user-parent-id',
          title: 'Medali Turnamen!',
          message: `Selamat! ${student.full_name} berhasil memenangkan Medali ${medal.toUpperCase()} di turnamen ${tourney.name}.`,
          type: 'turnamen',
          is_read: false
        });
      }
    }
  };

  const activeParticipants = participants.filter(p => p.tournament_id === selectedTourneyId);

  const levelBadgeStyle = (lvl: string) => {
    if (lvl === 'nasional') return { background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' };
    if (lvl === 'regional') return { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' };
    return { background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' };
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Kejuaraan & Turnamen
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftar kontingen atlet dojo KKI DPL dan catat perolehan medali karate mereka.
            </p>
          </div>
          <button
            onClick={() => setIsTourneyModalOpen(true)}
            className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Event Turnamen
          </button>
        </div>

        {/* Tournament Select bar */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] flex flex-col md:flex-row gap-4 items-end justify-between"
          style={{ background: 'var(--md-sys-color-surface-container-low)', padding: '20px' }}>
          <div className="w-full md:w-72 flex flex-col">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pilih Event Turnamen</label>
            <select
              className={inputClass}
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
            >
              {tournaments.length === 0 ? (
                <option value="">Belum ada event turnamen</option>
              ) : (
                tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))
              )}
            </select>
          </div>

          {selectedTourneyId && (
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="m3-btn-outlined px-5 py-2.5 text-sm font-semibold cursor-pointer w-full md:w-auto"
            >
              Daftarkan Atlet Kontingen
            </button>
          )}
        </div>

        {/* Competitors List */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Daftar Atlet Kontingen Dojo
            </h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse"
                  style={{ background: 'var(--md-sys-color-surface-container)' }} />
              ))}
            </div>
          ) : activeParticipants.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Belum ada atlet didaftarkan pada event turnamen ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    {['Nama Atlet', 'Kategori Tanding', 'Kelas Berat (Kumite)', 'Status Hasil', 'Perolehan Medali'].map((h, idx) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${idx === 4 ? 'text-right' : ''}`}
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeParticipants.map((part, idx) => {
                    const studentName = students.find(s => s.id === part.student_id)?.full_name || 'Siswa';
                    return (
                      <tr key={part.id}
                        style={{ borderBottom: idx < activeParticipants.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}>
                        <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{studentName}</td>
                        <td className="px-5 py-4 text-sm capitalize" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{part.category}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{part.weight_class || '-'}</td>
                        <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{part.result}</td>
                        <td className="px-5 py-4 text-sm text-right">
                          <select
                            className="px-3 py-1.5 rounded-lg border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                            style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                            value={medalState[part.id] || 'none'}
                            onChange={(e) => handleMedalChange(part.id, e.target.value as any)}
                          >
                            <option value="none">Tanpa Medali</option>
                            <option value="emas">🥇 Emas</option>
                            <option value="perak">🥈 Perak</option>
                            <option value="perunggu">🥉 Perunggu</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Tourney Modal */}
        <M3Dialog
          open={isTourneyModalOpen}
          onClose={() => setIsTourneyModalOpen(false)}
          title="Tambah Event Turnamen"
        >
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Kejuaraan *</label>
              <input
                type="text"
                required
                placeholder="mis. Sirkuit Karate Jabar Ke-3"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Pelaksanaan *</label>
              <input
                type="date"
                required
                className={inputClass}
                value={tourneyDate}
                onChange={(e) => setTourneyDate(e.target.value)}
              />
            </div>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Lokasi GOR *</label>
              <input
                type="text"
                required
                placeholder="mis. GOR Pajajaran Bandung"
                className={inputClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tingkat</label>
                <select
                  className={inputClass}
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                >
                  <option value="lokal">Lokal</option>
                  <option value="regional">Regional</option>
                  <option value="nasional">Nasional</option>
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Penyelenggara *</label>
                <input
                  type="text"
                  required
                  placeholder="mis. Forki Jabar"
                  className={inputClass}
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                type="button"
                onClick={() => setIsTourneyModalOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">
                Simpan
              </button>
            </div>
          </form>
        </M3Dialog>

        {/* Register competitor Modal */}
        <M3Dialog
          open={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          title="Daftarkan Atlet Kontingen"
        >
          <form onSubmit={handleRegisterCompetitor} className="space-y-4">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Siswa</label>
              <select
                className={inputClass}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.full_name} ({student.current_belt})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kategori Kejuaraan</label>
                <select
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="kata">Kata (Jurus)</option>
                  <option value="kumite">Kumite (Tanding)</option>
                </select>
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Berat Kumite (Kg)</label>
                <input
                  type="text"
                  placeholder="mis. -35Kg"
                  className={inputClass}
                  value={weightClass}
                  disabled={category === 'kata'}
                  onChange={(e) => setWeightClass(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                type="button"
                onClick={() => setIsRegModalOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button type="submit" className="m3-btn-filled px-5 py-2.5 text-sm">
                Daftarkan
              </button>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
