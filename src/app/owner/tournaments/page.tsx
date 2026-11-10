'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { Student, Tournament, TournamentParticipant } from '@/lib/mockData';
import { getBeltEmoji } from '@/lib/constants/belts';

function M3Dialog({ open, onClose, title, maxWidth = 'max-w-lg', children }: { open: boolean; onClose: () => void; title: string; maxWidth?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className={`w-full ${maxWidth} rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-fade-in max-h-[90vh] flex flex-col`}
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-slate-500/10"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">
          {children}
        </div>
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

  // Form states (Create / Edit Tournament)
  const [isTourneyModalOpen, setIsTourneyModalOpen] = useState(false);
  const [editingTourneyId, setEditingTourneyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [tourneyDate, setTourneyDate] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState<'lokal' | 'regional' | 'nasional'>('lokal');
  const [status, setStatus] = useState<string>('aktif');
  const [organizer, setOrganizer] = useState('');

  // Form states (Register Competitor)
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [athleteConfigs, setAthleteConfigs] = useState<Record<string, { category: 'kata' | 'kumite'; weightClass: string }>>({});

  // Filter & Search di tabel peserta turnamen
  const [tableSearch, setTableSearch] = useState('');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<'all' | 'kata' | 'kumite'>('all');
  const [tableMedalFilter, setTableMedalFilter] = useState<'all' | 'emas' | 'perak' | 'perunggu' | 'none'>('all');

  // Medal winner state
  const [medalState, setMedalState] = useState<Record<string, 'emas' | 'perak' | 'perunggu' | 'none'>>({});
  const [submittingTourney, setSubmittingTourney] = useState(false);
  const [submittingCompetitor, setSubmittingCompetitor] = useState(false);

  const loadData = async (selectId?: string) => {
    setLoading(true);
    const { data: tourneysData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    const { data: studentsData } = await supabase.from('students').eq('status', 'active').select('*');
    const { data: participantsData } = await supabase.from('tournament_participants').select('*');

    if (tourneysData) {
      setTournaments(tourneysData);
      if (selectId) {
        setSelectedTourneyId(selectId);
      } else if (tourneysData.length > 0 && (!selectedTourneyId || !tourneysData.some((t: Tournament) => t.id === selectedTourneyId))) {
        setSelectedTourneyId(tourneysData[0].id);
      }
    }
    if (studentsData) {
      setStudents(studentsData);
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

  const handleOpenCreateTourney = () => {
    setEditingTourneyId(null);
    setName('');
    setTourneyDate('');
    setLocation('');
    setLevel('lokal');
    setStatus('aktif');
    setOrganizer('');
    setIsTourneyModalOpen(true);
  };

  const handleOpenEditTourney = (t: Tournament, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTourneyId(t.id);
    setName(t.name);
    setTourneyDate(t.tournament_date || t.start_date || '');
    setLocation(t.location);
    setLevel((t.level as any) || 'lokal');
    setStatus(t.status || 'aktif');
    setOrganizer(t.organizer || '');
    setIsTourneyModalOpen(true);
  };

  const handleDeleteTourney = async (tourneyId: string, tourneyName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const count = participants.filter(p => p.tournament_id === tourneyId).length;
    const confirmMsg = count > 0
      ? `Hapus turnamen "${tourneyName}"? PERINGATAN: ${count} data atlet yang terdaftar juga akan terhapus.`
      : `Apakah Anda yakin ingin menghapus turnamen "${tourneyName}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (count > 0) {
        await supabase.from('tournament_participants').eq('tournament_id', tourneyId).delete();
      }

      const { error } = await supabase.from('tournaments').eq('id', tourneyId).delete();
      if (error) throw error;

      alert('Event turnamen berhasil dihapus.');

      const remaining = tournaments.filter(t => t.id !== tourneyId);
      const nextSelected = remaining.length > 0 ? remaining[0].id : '';
      await loadData(nextSelected);
    } catch (err: any) {
      alert(`Gagal menghapus event turnamen: ${err.message || err}`);
    }
  };

  const handleDeleteParticipant = async (participantId: string, studentName: string) => {
    if (!window.confirm(`Hapus ${studentName} dari kontingen turnamen ini?`)) return;

    try {
      const { error } = await supabase.from('tournament_participants').eq('id', participantId).delete();
      if (error) throw error;
      await loadData(selectedTourneyId);
    } catch (err: any) {
      alert(`Gagal menghapus atlet: ${err.message || err}`);
    }
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tourneyDate || !location) {
      alert('Mohon lengkapi nama turnamen, tanggal, dan lokasi.');
      return;
    }

    setSubmittingTourney(true);

    if (editingTourneyId) {
      // MODE UPDATE (EDIT)
      const updatePayload = {
        name,
        tournament_date: tourneyDate,
        start_date: tourneyDate,
        end_date: tourneyDate,
        location,
        level,
        status,
        organizer: organizer || null
      };

      let { error } = await supabase.from('tournaments').eq('id', editingTourneyId).update(updatePayload);

      if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
        const fallbackTourney = {
          name,
          location,
          start_date: tourneyDate,
          end_date: tourneyDate,
          status
        };
        const retry = await supabase.from('tournaments').eq('id', editingTourneyId).update(fallbackTourney);
        error = retry.error;
      }

      if (error) {
        alert(`Gagal memperbarui turnamen: ${error.message}`);
        setSubmittingTourney(false);
        return;
      }

      setIsTourneyModalOpen(false);
      setSubmittingTourney(false);
      await loadData(editingTourneyId);
      return;
    }

    // MODE CREATE (TAMBAH BARU)
    const newTourney = {
      name,
      tournament_date: tourneyDate,
      start_date: tourneyDate,
      end_date: tourneyDate,
      location,
      level,
      organizer: organizer || null,
      registration_fee: 150000,
      status
    };

    let createdId: string | null = null;
    let { data, error } = await supabase.from('tournaments').insert(newTourney).select();

    // Fallback jika database belum ada kolom level/organizer/tournament_date
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const fallbackTourney = {
        name: newTourney.name,
        location: newTourney.location,
        start_date: newTourney.start_date,
        end_date: newTourney.end_date,
        registration_fee: 150000,
        status: 'aktif'
      };
      const retry = await supabase.from('tournaments').insert(fallbackTourney).select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      alert(`Gagal menambahkan event turnamen: ${error.message}\nPastikan Anda sudah login sebagai Owner.`);
      setSubmittingTourney(false);
      return;
    }

    if (data && data.length > 0) {
      createdId = data[0].id;
    }

    // Broadcast notifications to parents
    try {
      const parentNotifications = students
        .filter(s => s.parent_id)
        .map(s => ({
          id: `notif-${Date.now()}-${s.id}`,
          user_id: s.parent_id,
          title: 'Event Turnamen Baru',
          message: `Telah dibuka pendaftaran atlet untuk event turnamen "${name}" yang diadakan pada tanggal ${tourneyDate} di ${location}.`,
          type: 'turnamen' as const,
          is_read: false
        }));
      if (parentNotifications.length > 0) {
        await supabase.from('notifications').insert(parentNotifications);
      }
    } catch (notifErr) {
      console.warn('Gagal broadcast notifikasi turnamen (dilewati):', notifErr);
    }

    setIsTourneyModalOpen(false);
    setName('');
    setTourneyDate('');
    setLocation('');
    setOrganizer('');
    setSubmittingTourney(false);
    await loadData(createdId || undefined);
  };

  const handleOpenBatchRegister = () => {
    setSelectedStudentIds([]);
    setSearchStudent('');
    setAthleteConfigs({});
    setIsRegModalOpen(true);
  };

  const registeredStudentIds = useMemo(() => {
    return new Set(participants.filter(p => p.tournament_id === selectedTourneyId).map(p => p.student_id));
  }, [participants, selectedTourneyId]);

  const availableStudents = useMemo(() => {
    return students.filter(s => !registeredStudentIds.has(s.id));
  }, [students, registeredStudentIds]);

  const filteredStudents = useMemo(() => {
    return availableStudents.filter(s =>
      s.full_name.toLowerCase().includes(searchStudent.toLowerCase())
    );
  }, [availableStudents, searchStudent]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBatchRegisterCompetitors = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourneyId || selectedStudentIds.length === 0) {
      alert('Pilih minimal satu atlet untuk didaftarkan.');
      return;
    }

    setSubmittingCompetitor(true);

    const newParticipants = selectedStudentIds.map(studentId => {
      const cfg = athleteConfigs[studentId] || { category: 'kata', weightClass: '' };
      return {
        tournament_id: selectedTourneyId,
        student_id: studentId,
        category: cfg.category,
        weight_class: cfg.weightClass || null,
        result: 'Berpartisipasi',
        status: 'daftar' as const,
        medal: 'none' as const
      };
    });

    let { error } = await supabase.from('tournament_participants').insert(newParticipants);

    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const fallbackPart = newParticipants.map(p => ({
        tournament_id: p.tournament_id,
        student_id: p.student_id,
        category: p.category,
        status: 'daftar',
        result: 'Berpartisipasi'
      }));
      const retry = await supabase.from('tournament_participants').insert(fallbackPart);
      error = retry.error;
    }

    if (error) {
      alert(`Gagal mendaftarkan atlet: ${error.message}`);
      setSubmittingCompetitor(false);
      return;
    }

    setIsRegModalOpen(false);
    setSelectedStudentIds([]);
    setSubmittingCompetitor(false);
    loadData(selectedTourneyId);
  };

  const handleMedalChange = async (partId: string, medal: 'emas' | 'perak' | 'perunggu' | 'none') => {
    setMedalState(prev => ({ ...prev, [partId]: medal }));
    
    let { error } = await supabase.from('tournament_participants').eq('id', partId).update({
      medal,
      result: medal !== 'none' ? `Juara Medali ${medal}` : 'Berpartisipasi'
    });

    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      const retry = await supabase.from('tournament_participants').eq('id', partId).update({
        result: medal !== 'none' ? `Juara Medali ${medal}` : 'Berpartisipasi'
      });
      error = retry.error;
    }

    if (error) {
      alert(`Gagal memperbarui perolehan medali: ${error.message}`);
      return;
    }

    if (medal !== 'none') {
      const part = participants.find(p => p.id === partId);
      const student = students.find(s => s.id === part?.student_id);
      const tourney = tournaments.find(t => t.id === selectedTourneyId);
      if (student && tourney && student.parent_id) {
        try {
          await supabase.from('notifications').insert({
            id: `notif-${Date.now()}-${student.id}`,
            user_id: student.parent_id,
            title: 'Medali Turnamen!',
            message: `Selamat! ${student.full_name} berhasil memenangkan Medali ${medal.toUpperCase()} di turnamen ${tourney.name}.`,
            type: 'turnamen',
            is_read: false
          });
        } catch (e) {
          console.warn('Gagal notifikasi medali ortu:', e);
        }
      }
    }
  };

  const activeParticipants = participants.filter(p => p.tournament_id === selectedTourneyId);
  const currentTourney = tournaments.find(t => t.id === selectedTourneyId);

  // Filter peserta turnamen di tabel utama
  const filteredActiveParticipants = useMemo(() => {
    return activeParticipants.filter(p => {
      const s = students.find(stud => stud.id === p.student_id);
      const name = s?.full_name?.toLowerCase() || '';
      const matchSearch = name.includes(tableSearch.toLowerCase());

      const matchCategory = tableCategoryFilter === 'all' || p.category === tableCategoryFilter;
      const currentMedal = medalState[p.id] || (p.medal as any) || 'none';
      const matchMedal = tableMedalFilter === 'all' || currentMedal === tableMedalFilter;

      return matchSearch && matchCategory && matchMedal;
    });
  }, [activeParticipants, students, tableSearch, tableCategoryFilter, tableMedalFilter, medalState]);

  // Statistik medali turnamen aktif
  const tourneyStats = useMemo(() => {
    const total = activeParticipants.length;
    let emas = 0;
    let perak = 0;
    let perunggu = 0;
    let tanpaMedali = 0;

    activeParticipants.forEach(p => {
      const m = medalState[p.id] || (p.medal as any) || 'none';
      if (m === 'emas') emas++;
      else if (m === 'perak') perak++;
      else if (m === 'perunggu') perunggu++;
      else tanpaMedali++;
    });

    return { total, emas, perak, perunggu, tanpaMedali };
  }, [activeParticipants, medalState]);

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
            onClick={handleOpenCreateTourney}
            className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Event Turnamen
          </button>
        </div>

        {/* Event Select Cards & KPI Banner */}
        {tournaments.length === 0 ? (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-8 text-center border"
            style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>Belum Ada Event Turnamen</h3>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Tambahkan kejuaraan karate (Kejurda, Kejurnas, Sirkuit) untuk mendaftarkan atlet kontingen.
            </p>
            <button
              onClick={() => setIsTourneyModalOpen(true)}
              className="m3-btn-filled px-5 py-2.5 text-sm font-semibold cursor-pointer"
            >
              + Tambah Event Turnamen Baru
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Horizontal Tournament Selection Cards */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Pilih Event Turnamen Aktif ({tournaments.length})
                </span>
                <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Klik kartu untuk beralih event
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tournaments.map((t) => {
                  const isSelected = t.id === selectedTourneyId;
                  const partCount = participants.filter(p => p.tournament_id === t.id).length;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTourneyId(t.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'ring-2 ring-[var(--md-sys-color-primary)] shadow-lg'
                          : 'hover:border-[var(--md-sys-color-outline)]'
                      }`}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(255,82,82,0.12) 0%, rgba(20,13,12,0.95) 100%)'
                          : 'var(--md-sys-color-surface-container-low)',
                        borderColor: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
                              style={{
                                background: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                                color: isSelected ? 'white' : 'var(--md-sys-color-on-surface)'
                              }}>
                              📅 {t.tournament_date || t.start_date || 'Tanggal TBD'}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase" style={levelBadgeStyle(t.level || 'lokal')}>
                              {t.level || 'lokal'}
                            </span>
                          </div>
                          <h4 className="font-bold text-base line-clamp-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {t.name}
                          </h4>
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            📍 {t.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t"
                        style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Kontingen: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{partCount} Atlet</strong>
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {t.organizer || 'Pengda KKI'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Tourney Metric Banner & Primary Action */}
            {currentTourney && (
              <div className="rounded-3xl p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 border"
                style={{
                  background: 'linear-gradient(135deg, var(--md-sys-color-surface-container-high) 0%, var(--md-sys-color-surface-container) 100%)',
                  borderColor: 'var(--md-sys-color-outline-variant)'
                }}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {currentTourney.name}
                    </h3>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    📍 {currentTourney.location} • 📅 {currentTourney.tournament_date || currentTourney.start_date} • Penyelenggara: {currentTourney.organizer || 'FORKI / KKI'}
                  </p>

                  {/* Action Edit & Hapus Event Turnamen */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => handleOpenEditTourney(currentTourney, e)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border hover:bg-slate-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                    >
                      ✏️ Edit Turnamen
                    </button>
                    <button
                      onClick={(e) => handleDeleteTourney(currentTourney.id, currentTourney.name, e)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      🗑️ Hapus Turnamen
                    </button>
                  </div>
                </div>

                {/* 4 Medals & Athletes Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-xl">
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total Atlet</div>
                    <div className="text-xl font-black mt-0.5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{tourneyStats.total}</div>
                  </div>
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium text-amber-400">🥇 Emas</div>
                    <div className="text-xl font-black mt-0.5 text-amber-400">{tourneyStats.emas}</div>
                  </div>
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium text-slate-300">🥈 Perak</div>
                    <div className="text-xl font-black mt-0.5 text-slate-300">{tourneyStats.perak}</div>
                  </div>
                  <div className="p-3 rounded-2xl text-center border"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="text-xs font-medium text-amber-600">🥉 Perunggu</div>
                    <div className="text-xl font-black mt-0.5 text-amber-600">{tourneyStats.perunggu}</div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleOpenBatchRegister}
                  className="m3-btn-filled px-6 py-3 text-sm font-bold cursor-pointer whitespace-nowrap shadow-lg hover:scale-102 transition-transform"
                >
                  + Daftarkan Atlet Kontingen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Competitors List with Live Search & Filter */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden border"
          style={{ background: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
          
          {/* Table Header & Toolbar */}
          <div className="p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b"
            style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Daftar Kontingen Atlet ({filteredActiveParticipants.length}/{activeParticipants.length})
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Catat kategori tanding dan perolehan medali atlet dojo KKI.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari atlet..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              />

              <select
                value={tableCategoryFilter}
                onChange={(e) => setTableCategoryFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              >
                <option value="all">Semua Kategori</option>
                <option value="kata">Kata (Jurus)</option>
                <option value="kumite">Kumite (Tanding)</option>
              </select>

              <select
                value={tableMedalFilter}
                onChange={(e) => setTableMedalFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              >
                <option value="all">Semua Medali</option>
                <option value="emas">🥇 Emas ({tourneyStats.emas})</option>
                <option value="perak">🥈 Perak ({tourneyStats.perak})</option>
                <option value="perunggu">🥉 Perunggu ({tourneyStats.perunggu})</option>
                <option value="none">Tanpa Medali ({tourneyStats.tanpaMedali})</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-[var(--md-sys-shape-corner-medium)] animate-pulse"
                  style={{ background: 'var(--md-sys-color-surface-container)' }} />
              ))}
            </div>
          ) : activeParticipants.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3 opacity-40">🏆</div>
              <h4 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Belum ada atlet didaftarkan pada event turnamen ini
              </h4>
              <p className="text-xs mt-1 mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Klik tombol di bawah untuk mendaftarkan atlet kontingen dojo.
              </p>
              {selectedTourneyId && (
                <button
                  onClick={handleOpenBatchRegister}
                  className="m3-btn-filled px-5 py-2.5 text-sm cursor-pointer"
                >
                  + Daftarkan Atlet Kontingen Sekarang
                </button>
              )}
            </div>
          ) : filteredActiveParticipants.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Tidak ada atlet yang cocok dengan filter pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                    {['Nama Atlet', 'Kategori Tanding', 'Kelas Berat', 'Keterangan Hasil', 'Perolehan Medali'].map((h, idx) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${idx === 4 ? 'text-right' : ''}`}
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                  {filteredActiveParticipants.map((part) => {
                    const student = students.find(s => s.id === part.student_id);
                    const studentName = student?.full_name || 'Siswa';
                    const currentMedal = medalState[part.id] || (part.medal as any) || 'none';

                    return (
                      <tr key={part.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {studentName}
                          </div>
                          <div className="text-[11px] flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <span>Sabuk:</span>
                            <span className="font-semibold text-red-400">
                              {getBeltEmoji(student?.current_belt)} {student?.current_belt || 'Putih'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            part.category === 'kata'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            {part.category === 'kata' ? '🥋 Kata (Jurus)' : '🥊 Kumite (Tanding)'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {part.weight_class ? `${part.weight_class}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {part.result || 'Berpartisipasi'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all focus:ring-2 focus:ring-red-500"
                              style={{
                                borderColor: 'var(--md-sys-color-outline-variant)',
                                background: currentMedal === 'emas' ? 'rgba(255, 193, 7, 0.2)' :
                                            currentMedal === 'perak' ? 'rgba(158, 158, 158, 0.2)' :
                                            currentMedal === 'perunggu' ? 'rgba(205, 127, 50, 0.2)' :
                                            'var(--md-sys-color-surface-container)',
                                color: currentMedal === 'emas' ? '#ffd700' :
                                       currentMedal === 'perak' ? '#e0e0e0' :
                                       currentMedal === 'perunggu' ? '#ffab40' :
                                       'var(--md-sys-color-on-surface)'
                              }}
                              value={currentMedal}
                              onChange={(e) => handleMedalChange(part.id, e.target.value as any)}
                            >
                              <option value="none">Tanpa Medali</option>
                              <option value="emas">🥇 Medali Emas</option>
                              <option value="perak">🥈 Medali Perak</option>
                              <option value="perunggu">🥉 Medali Perunggu</option>
                            </select>
                            <button
                              onClick={() => handleDeleteParticipant(part.id, studentName)}
                              title="Hapus atlet dari kontingen turnamen ini"
                              className="w-7 h-7 rounded-lg flex items-center justify-center border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors text-xs cursor-pointer ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Tournament Modal */}
        <M3Dialog
          open={isTourneyModalOpen}
          onClose={() => setIsTourneyModalOpen(false)}
          title={editingTourneyId ? 'Edit Event Turnamen' : 'Tambah Event Turnamen'}
        >
          <form onSubmit={handleSaveTournament} className="space-y-4">
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
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status Event</label>
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="aktif">Aktif</option>
                  <option value="pendaftaran">Pendaftaran</option>
                  <option value="selesai">Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </div>
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

            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                type="button"
                onClick={() => setIsTourneyModalOpen(false)}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button type="submit" disabled={submittingTourney} className="m3-btn-filled px-5 py-2.5 text-sm font-semibold">
                {submittingTourney ? 'Menyimpan...' : editingTourneyId ? 'Simpan Perubahan' : 'Simpan Turnamen'}
              </button>
            </div>
          </form>
        </M3Dialog>

        {/* Batch Register Competitors Modal */}
        <M3Dialog
          open={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          title="Daftarkan Atlet Kontingen Sekaligus"
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleBatchRegisterCompetitors} className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Pilih satu atau banyak atlet untuk dimasukkan ke kontingen dojo. Tentukan kategori tanding (Kata/Kumite) dan kelas berat untuk tiap atlet.
            </p>

            {/* Search Bar */}
            <div className="pt-2">
              <input
                type="text"
                placeholder="Cari nama atlet..."
                className={inputClass}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-xs py-1 px-1">
              <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Tersedia {filteredStudents.length} atlet | Dipilih: <strong style={{ color: 'var(--md-sys-color-primary)' }}>{selectedStudentIds.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--md-sys-color-primary)' }}
              >
                {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id))
                  ? 'Batalkan Pilih Semua di List'
                  : 'Pilih Semua di List Ini'}
              </button>
            </div>

            {/* Athletes List */}
            <div
              className="border rounded-[var(--md-sys-shape-corner-medium)] max-h-72 overflow-y-auto divide-y"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                background: 'var(--md-sys-color-surface-container-low)'
              }}
            >
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {availableStudents.length === 0
                    ? 'Semua atlet sudah terdaftar di kontingen turnamen ini.'
                    : 'Tidak ada atlet yang cocok dengan pencarian.'}
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  const cfg = athleteConfigs[st.id] || { category: 'kata', weightClass: '' };

                  return (
                    <div
                      key={st.id}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isChecked ? 'bg-primary/5' : 'hover:bg-slate-500/5'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(st.id)}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {st.full_name}
                          </div>
                          <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <span>Sabuk:</span>
                            <span className="font-medium text-red-400">
                              {getBeltEmoji(st.current_belt)} {st.current_belt || 'Putih'}
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* Category & Weight Class Config */}
                      <div className="flex items-center gap-2 pl-7 sm:pl-0">
                        <select
                          disabled={!isChecked}
                          value={cfg.category}
                          onChange={(e) => {
                            const cat = e.target.value as 'kata' | 'kumite';
                            setAthleteConfigs(prev => ({
                              ...prev,
                              [st.id]: { category: cat, weightClass: cat === 'kata' ? '' : cfg.weightClass }
                            }));
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          style={{
                            background: isChecked ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container)',
                            color: 'var(--md-sys-color-on-surface)',
                            borderColor: 'var(--md-sys-color-outline-variant)'
                          }}
                        >
                          <option value="kata">Kata (Jurus)</option>
                          <option value="kumite">Kumite (Tanding)</option>
                        </select>

                        {cfg.category === 'kumite' && (
                          <input
                            type="text"
                            disabled={!isChecked}
                            placeholder="-35kg"
                            value={cfg.weightClass}
                            onChange={(e) => {
                              const wc = e.target.value;
                              setAthleteConfigs(prev => ({
                                ...prev,
                                [st.id]: { ...cfg, weightClass: wc }
                              }));
                            }}
                            className="w-20 text-xs px-2.5 py-1.5 rounded-lg border focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                            style={{
                              background: isChecked ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container)',
                              color: 'var(--md-sys-color-on-surface)',
                              borderColor: 'var(--md-sys-color-outline-variant)'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {selectedStudentIds.length} atlet akan didaftarkan
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="m3-btn-text px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCompetitor || selectedStudentIds.length === 0}
                  className="m3-btn-filled px-5 py-2 text-sm font-semibold"
                >
                  {submittingCompetitor ? 'Mendaftarkan...' : `Daftarkan ${selectedStudentIds.length} Atlet`}
                </button>
              </div>
            </div>
          </form>
        </M3Dialog>
      </div>
    </Navigation>
  );
}
