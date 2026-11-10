'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase, rawClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Registration, Student, Notification, Profile } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { useSearchParams } from 'next/navigation';
import { OFFICIAL_BELTS } from '@/lib/constants/belts';

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

function RegistrationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const approveId = searchParams.get('approve');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'semua' | 'menunggu' | 'disetujui' | 'ditolak'>('semua');

  // Approval modal state
  const [approveTarget, setApproveTarget] = useState<Registration | null>(null);
  const [parentProfiles, setParentProfiles] = useState<Profile[]>([]);
  const [parentMode, setParentMode] = useState<'existing' | 'new'>('existing');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [approving, setApproving] = useState(false);

  // Form Create/Edit state
  const [formOpen, setFormOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [formData, setFormData] = useState<Partial<Registration>>({});
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreateModal = () => {
    setEditingReg(null);
    setFormData({
      full_name: '',
      dob: '',
      birth_place: '',
      nik: '',
      current_belt: 'Putih',
      weight: undefined,
      height: undefined,
      parent_name: '',
      parent_phone: '',
      parent_job: '',
      address: '',
      status: 'menunggu',
    });
    setFormOpen(true);
  };

  const openEditModal = (reg: Registration) => {
    setEditingReg(reg);
    setFormData({ ...reg });
    setFormOpen(true);
  };

  const handleSaveRegistration = async () => {
    if (!formData.full_name?.trim() || !formData.dob || !formData.parent_name?.trim() || !formData.parent_phone?.trim()) {
      alert('Mohon lengkapi bidang wajib (Nama Siswa, Tanggal Lahir, Nama Wali, dan No HP Wali).');
      return;
    }

    if (formData.nik && formData.nik.trim() !== '') {
      const trimmedNik = formData.nik.trim();
      if (trimmedNik.length !== 16 || !/^\d+$/.test(trimmedNik)) {
        alert('NIK harus berupa 16 digit angka.');
        return;
      }
    }

    setSaving(true);
    if (editingReg) {
      const updatePayload: any = {
        full_name: formData.full_name.trim(),
        dob: formData.dob,
        birth_place: formData.birth_place || '',
        nik: formData.nik || '',
        current_belt: formData.current_belt || 'Putih',
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        parent_name: formData.parent_name.trim(),
        parent_phone: formData.parent_phone.trim(),
        parent_job: formData.parent_job || '',
        address: formData.address?.trim() || '',
        status: formData.status || 'menunggu',
      };

      // Optimistic update
      setRegistrations(prev => prev.map(r => r.id === editingReg.id ? { ...r, ...updatePayload } : r));
      setFormOpen(false);

      const { data: resData, error } = await rawClient
        .from('registrations')
        .update(updatePayload)
        .eq('id', editingReg.id)
        .select();

      if (error || !resData || resData.length === 0) {
        alert('Gagal mengupdate pendaftaran di database: ' + (error?.message || 'Izin database menolak perubahan atau data tidak ditemukan.'));
        fetchRegistrations();
      }
    } else {
      const newReg: Registration = {
        id: isSupabaseConfigured ? crypto.randomUUID() : `reg-${Date.now()}`,
        full_name: formData.full_name.trim(),
        dob: formData.dob || '',
        birth_place: formData.birth_place || '',
        nik: formData.nik || '',
        current_belt: formData.current_belt || 'Putih',
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        parent_name: formData.parent_name.trim(),
        parent_phone: formData.parent_phone.trim(),
        parent_job: formData.parent_job || '',
        address: formData.address?.trim() || '',
        status: (formData.status as any) || 'menunggu',
        submitted_at: new Date().toISOString(),
      };

      // Optimistic update
      setRegistrations(prev => [newReg, ...prev]);
      setFormOpen(false);

      const { data: resData, error } = await rawClient.from('registrations').insert([newReg]).select();
      if (error || !resData || resData.length === 0) {
        alert('Gagal menambahkan pendaftaran ke database: ' + (error?.message || 'Izin database menolak penambahan.'));
        fetchRegistrations();
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const targetId = deleteTarget.id;

    // Eksekusi penghapusan di database Supabase
    try {
      const { error } = await rawClient.from('registrations').delete().eq('id', targetId);
      if (error) {
        alert('Gagal menghapus pendaftaran: ' + error.message);
        setDeleting(false);
        return;
      }
      // Update UI seketika
      setRegistrations(prev => prev.filter(r => r.id !== targetId));
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Terjadi kesalahan saat menghapus: ' + (err?.message || 'Gagal'));
    } finally {
      setDeleting(false);
    }
  };

  const fetchRegistrations = async () => {
    const { data } = await rawClient.from('registrations').select('*').order('submitted_at', { ascending: false });
    if (data) {
      setRegistrations(data as Registration[]);
    }
    setLoading(false);
  };

  const fetchParentProfiles = async () => {
    const { data } = await supabase.from('profiles').eq('role', 'ortu').select();
    if (data) setParentProfiles(data as Profile[]);
  };

  const openApproveModal = (reg: Registration) => {
    setApproveTarget(reg);
    const phoneClean = reg.parent_phone?.trim().replace(/\D/g, '');
    const existingParent = parentProfiles.find(
      p => p.phone && p.phone.trim().replace(/\D/g, '') === phoneClean
    );

    if (existingParent) {
      setParentMode('existing');
      setSelectedParentId(existingParent.id);
    } else {
      setParentMode('new');
      setSelectedParentId('');
    }

    setNewParentName(reg.parent_name);
    setNewParentPhone(reg.parent_phone);
    // Otomatis jadikan nomor HP sebagai default password agar mudah diingat
    setNewParentPassword(reg.parent_phone || '');
    setShowPassword(false);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const { data: regs } = await supabase.from('registrations').order('submitted_at', { ascending: false }).select();
      const { data: parents } = await supabase.from('profiles').eq('role', 'ortu').select();

      if (regs) setRegistrations(regs as Registration[]);
      if (parents) setParentProfiles(parents as Profile[]);
      setLoading(false);

      if (approveId && regs) {
        const found = regs.find((r: Registration) => r.id === approveId && r.status === 'menunggu');
        if (found) {
          openApproveModal(found as Registration);
        }
      }
    };
    loadAll();
  }, [approveId]);

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    // Guard: jangan proses ulang jika sudah disetujui
    if (approveTarget.status !== 'menunggu') {
      alert('Pendaftaran ini sudah diproses sebelumnya.');
      setApproveTarget(null);
      setApproving(false);
      return;
    }
    setApproving(true);

    let parentId = '';

    if (parentMode === 'existing') {
      if (!selectedParentId) {
        alert('Pilih akun orang tua terlebih dahulu.');
        setApproving(false);
        return;
      }
      parentId = selectedParentId;
    } else {
      if (!newParentName.trim() || !newParentPhone.trim()) {
        alert('Nama dan nomor telepon orang tua wajib diisi.');
        setApproving(false);
        return;
      }
      if (newParentPassword.length < 6) {
        alert('Kata sandi minimal 6 karakter.');
        setApproving(false);
        return;
      }

      // Buat akun orang tua secara aman via API server tanpa membajak sesi login Owner
      const phoneDigits = newParentPhone.trim().replace(/\D/g, '');
      const generatedEmail = `${phoneDigits}@kkidpl.com`;

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            email: generatedEmail,
            password: newParentPassword,
            fullName: newParentName.trim(),
            phone: newParentPhone.trim(),
            role: 'ortu',
          }),
        });

        const resData = await res.json();
        if (resData?.userId) {
          parentId = resData.userId;
        } else if (resData?.error) {
          console.warn('Admin user creation warning:', resData.error);
          // Fallback lokal jika API mengembalikan error
          parentId = isSupabaseConfigured ? crypto.randomUUID() : `parent-${phoneDigits}`;
        }
      } catch (err) {
        console.error('Call to /api/admin/users failed:', err);
        parentId = isSupabaseConfigured ? crypto.randomUUID() : `parent-${phoneDigits}`;
      }

      fetchParentProfiles();
    }

    const newStudentData: any = {
      id: isSupabaseConfigured ? crypto.randomUUID() : `student-${Date.now()}`,
      full_name: approveTarget.full_name,
      dob: approveTarget.dob,
      gender: '-',
      address: approveTarget.address || '',
      phone: approveTarget.parent_phone,
      parent_name: approveTarget.parent_name,
      parent_job: approveTarget.parent_job,
      nik: approveTarget.nik || '',
      birth_place: approveTarget.birth_place || '',
      weight: approveTarget.weight ? Number(approveTarget.weight) : undefined,
      height: approveTarget.height ? Number(approveTarget.height) : undefined,
      photo_url: '',
      join_date: new Date().toISOString().split('T')[0],
      current_belt: approveTarget.current_belt || 'Putih',
      status: 'active',
    };

    if (parentId && parentId.trim() !== '' && parentId !== 'user-parent-id') {
      newStudentData.parent_id = parentId;
    }

    // 1. Simpan data siswa ke tabel 'students' TERLEBIH DAHULU
    const { error: studentError } = await supabase.from('students').insert(newStudentData);
    if (studentError) {
      console.error('Insert student error details:', studentError);
      alert('Gagal menambahkan siswa ke Data Siswa: ' + studentError.message);
      setApproving(false);
      return;
    }

    // 2. Jika siswa berhasil dimasukkan, baru ubah status registrasi ke 'disetujui'
    const { error: updateRegError } = await supabase.from('registrations').eq('id', approveTarget.id).update({
      status: 'disetujui',
    });
    if (updateRegError) {
      alert('Siswa berhasil dibuat, namun gagal mengupdate status pendaftaran: ' + updateRegError.message);
    }

    // 3. Kirim notifikasi
    const notif: Partial<Notification> = {
      id: `notif-approve-${approveTarget.id}`,
      user_id: parentId || 'user-owner-id',
      title: 'Pendaftaran Disetujui',
      message: `Pendaftaran ${approveTarget.full_name} telah disetujui dan ditambahkan sebagai siswa baru. Sabuk saat ini: ${approveTarget.current_belt || 'Putih'}.`,
      type: 'umum',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    await supabase.from('notifications').insert(notif);

    setApproveTarget(null);
    setApproving(false);
    fetchRegistrations();
  };

  const handleReject = async (reg: Registration) => {
    await supabase.from('registrations').eq('id', reg.id).update({
      status: 'ditolak',
    });
    fetchRegistrations();
  };

  const filtered = filter === 'semua'
    ? registrations
    : registrations.filter((r: Registration) => r.status === filter);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'menunggu': return { background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' };
      case 'disetujui': return { background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' };
      case 'ditolak': return { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' };
      default: return { background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)' };
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'menunggu': return 'Menunggu';
      case 'disetujui': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Pendaftaran Siswa Baru
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Review dan kelola pendaftaran calon siswa KKI DPL Dojo.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="apple-btn text-xs py-2.5 px-4.5 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-semibold"
          >
            <span>➕</span> Tambah Pendaftaran
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['menunggu', 'disetujui', 'ditolak'] as const).map((status) => {
            const count = registrations.filter((r: Registration) => r.status === status).length;
            const icons = { menunggu: '⏳', disetujui: '✅', ditolak: '❌' };
            const isSelected = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(f => f === status ? 'semua' : status)}
                className="text-left transition-all duration-300 cursor-pointer flex flex-col gap-2 rounded-3xl p-5 border"
                style={{
                  background: isSelected ? 'var(--neu-surface-high)' : 'var(--neu-surface)',
                  boxShadow: isSelected ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-flat)',
                  borderColor: isSelected ? 'var(--md-sys-color-primary)' : 'var(--neu-border)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                  style={{
                    background: 'var(--neu-surface-low)',
                    boxShadow: 'var(--neu-shadow-pressed-sm)',
                  }}
                >
                  {icons[status]}
                </div>
                <p className="text-2xl font-extrabold leading-none mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>{count}</p>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{statusLabel(status)}</p>
              </button>
            );
          })}
        </div>

        {/* Registration List */}
        <div
          className="rounded-3xl overflow-hidden border border-[var(--neu-border)]"
          style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
        >
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">📋</span>
              <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {filter === 'semua' ? 'Belum ada pendaftaran' : `Tidak ada pendaftaran berstatus "${statusLabel(filter)}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--neu-border)]">
              {filtered.map((reg: Registration) => (
                <div
                  key={reg.id}
                  className="p-6 transition-all duration-200 hover:bg-slate-500/5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3.5 mb-3.5">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
                          style={{
                            background: 'var(--neu-surface-high)',
                            boxShadow: 'var(--neu-shadow-flat-sm)',
                            color: 'var(--md-sys-color-primary)'
                          }}
                        >
                          {reg.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>{reg.full_name}</h3>
                          <p className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Lahir: {new Date(reg.dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs p-4 rounded-2xl border border-[var(--neu-border)] sm:ml-14"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}
                      >
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tempat Lahir:</span> {reg.birth_place || '-'}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>NIK (KK):</span> {reg.nik || '-'}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Sabuk Saat Ini:</span> <span className="font-bold text-red-400">{reg.current_belt || 'Putih'}</span>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Postur:</span> {reg.weight ? `${reg.weight} kg` : '-'} / {reg.height ? `${reg.height} cm` : '-'}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Wali:</span> {reg.parent_name}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Pekerjaan Wali:</span> {reg.parent_job || '-'}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Telp:</span> {reg.parent_phone}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Alamat:</span> {reg.address}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end flex-shrink-0">
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: 'var(--neu-surface-low)',
                          boxShadow: 'var(--neu-shadow-pressed-sm)',
                          color: reg.status === 'disetujui' ? '#4caf50' : reg.status === 'ditolak' ? '#f44336' : 'var(--md-sys-color-primary)'
                        }}
                      >
                        {statusLabel(reg.status)}
                      </span>

                      <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
                        {reg.status === 'menunggu' && (
                          <>
                            <button
                              onClick={() => openApproveModal(reg)}
                              className="apple-btn text-xs py-1.5 px-3.5 font-semibold cursor-pointer"
                            >
                              ✓ Setujui
                            </button>
                            <button
                              onClick={() => handleReject(reg)}
                              className="apple-btn-secondary text-xs py-1.5 px-3.5 font-semibold cursor-pointer"
                            >
                              ✕ Tolak
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openEditModal(reg)}
                          className="apple-btn-secondary text-xs py-1.5 px-3 font-semibold cursor-pointer"
                          title="Edit Pendaftaran"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(reg)}
                          className="text-xs py-1.5 px-3 font-semibold rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus Pendaftaran"
                        >
                          🗑️ Hapus
                        </button>
                      </div>

                      <p className="text-[10px] opacity-70 mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {new Date(reg.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Approve Modal ── */}
      <M3Dialog
        open={!!approveTarget}
        onClose={() => !approving && setApproveTarget(null)}
        title="Setujui Pendaftaran"
      >
        {approveTarget && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Hubungkan <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{approveTarget.full_name}</span> ke akun orang tua siswa.
            </p>

            <div
              className="rounded-2xl p-4 text-xs space-y-1.5 border border-[var(--neu-border)]"
              style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              <p><span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Wali Pendaftar:</span> {approveTarget.parent_name} {approveTarget.parent_job ? `(${approveTarget.parent_job})` : ''} · {approveTarget.parent_phone}</p>
              <p><span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Sabuk Saat Ini:</span> {approveTarget.current_belt || 'Putih'}</p>
            </div>

            {/* Mode toggle */}
            <div
              className="flex rounded-2xl p-1.5 border border-[var(--neu-border)] gap-1.5"
              style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
            >
              <button
                onClick={() => setParentMode('existing')}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
                style={{
                  background: parentMode === 'existing' ? 'var(--neu-accent-grad)' : 'transparent',
                  boxShadow: parentMode === 'existing' ? 'var(--neu-shadow-accent)' : 'none',
                  color: parentMode === 'existing' ? 'white' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                Akun Sudah Ada
              </button>
              <button
                onClick={() => setParentMode('new')}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
                style={{
                  background: parentMode === 'new' ? 'var(--neu-accent-grad)' : 'transparent',
                  boxShadow: parentMode === 'new' ? 'var(--neu-shadow-accent)' : 'none',
                  color: parentMode === 'new' ? 'white' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                Buat Akun Baru
              </button>
            </div>

            {parentMode === 'existing' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Pilih Akun Orang Tua
                </label>
                {parentProfiles.length === 0 ? (
                  <p className="text-xs italic py-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Belum ada akun orang tua terdaftar. Buat akun baru.
                  </p>
                ) : (
                  <select
                    value={selectedParentId}
                    onChange={e => setSelectedParentId(e.target.value)}
                    className={inputClass}
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  >
                    <option value="">-- Pilih orang tua --</option>
                    {parentProfiles.map((p: Profile) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} · {p.phone}
                      </option>
                    ))}
                  </select>
                )}
                {selectedParentId && (
                  <p className="text-xs font-bold text-emerald-400">
                    ✅ Siswa akan ditambahkan ke akun orang tua ini
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Orang Tua</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={e => setNewParentName(e.target.value)}
                    placeholder="Nama lengkap orang tua"
                    className={inputClass}
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  />
                </div>
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nomor HP / WhatsApp (digunakan untuk login)</label>
                  <input
                    type="tel"
                    value={newParentPhone}
                    onChange={e => setNewParentPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={inputClass}
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  />
                </div>

                {/* Preview login identifier */}
                {newParentPhone.trim() && (
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-[var(--neu-border)]"
                    style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', color: 'var(--md-sys-color-primary)' }}
                  >
                    <span>📱</span>
                    <span>Login menggunakan: <strong>{newParentPhone.trim()}</strong></span>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--neu-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-primary)' }}>
                      🔐 Kata Sandi Akun
                    </p>
                    {newParentPhone.trim() && (
                      <button
                        type="button"
                        onClick={() => setNewParentPassword(newParentPhone.trim())}
                        className="text-[11px] font-semibold underline hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--md-sys-color-tertiary)' }}
                      >
                        ⚡ Samakan dengan No. HP
                      </button>
                    )}
                  </div>
                  <div className={fieldWrap}>
                    <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kata Sandi (Default: No. HP) *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newParentPassword}
                        onChange={e => setNewParentPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className={inputClass}
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)', paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%',
                          transform: 'translateY(-50%)', background: 'none',
                          border: 'none', cursor: 'pointer', fontSize: '14px',
                          color: 'var(--md-sys-color-on-surface-variant)'
                        }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {newParentPassword && newParentPassword.length < 6 && (
                      <p className="text-xs mt-1 text-rose-400">Minimal 6 karakter</p>
                    )}
                  </div>
                </div>

                <p
                  className="text-xs p-3.5 rounded-2xl border border-[var(--neu-border)]"
                  style={{ background: 'var(--neu-surface-low)', color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  💡 <strong>Info Login:</strong> Orang tua dapat login menggunakan <strong>No. HP</strong> sebagai username dan <strong>No. HP</strong> (atau kata sandi di atas) sebagai password.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <button
                onClick={() => setApproveTarget(null)}
                disabled={approving}
                className="apple-btn-secondary px-5 py-2.5 text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={approving}
                className="apple-btn px-5 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                {approving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                    Menyimpan...
                  </>
                ) : '✓ Setujui'}
              </button>
            </div>
          </div>
        )}
      </M3Dialog>

      {/* ── Form Modal (Tambah / Edit Pendaftaran) ── */}
      <M3Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editingReg ? 'Edit Pendaftaran Siswa' : 'Tambah Pendaftaran Siswa'}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-primary)' }}>
              Data Siswa
            </h4>
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Lengkap Siswa *</label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Contoh: Muhammad Ali"
                className={inputClass}
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tempat Lahir</label>
                <input
                  type="text"
                  value={formData.birth_place || ''}
                  onChange={e => setFormData({ ...formData, birth_place: e.target.value })}
                  placeholder="Tempat lahir"
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal Lahir *</label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>NIK (NIK anak pada KK)</label>
                <input
                  type="text"
                  value={formData.nik || ''}
                  onChange={e => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="NIK atau nomor KK"
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Sabuk Saat Ini</label>
                <select
                  value={formData.current_belt || 'Putih'}
                  onChange={e => setFormData({ ...formData, current_belt: e.target.value })}
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                >
                  {OFFICIAL_BELTS.map((belt) => (
                    <option key={belt} value={belt}>
                      {belt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Berat Badan (kg)</label>
                <input
                  type="number"
                  value={formData.weight ?? ''}
                  onChange={e => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Misal: 45"
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tinggi Badan (cm)</label>
                <input
                  type="number"
                  value={formData.height ?? ''}
                  onChange={e => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Misal: 155"
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[var(--neu-border)]">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-primary)' }}>
              Data Orang Tua / Wali
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Wali *</label>
                <input
                  type="text"
                  value={formData.parent_name || ''}
                  onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                  placeholder="Nama orang tua/wali"
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No. HP / WhatsApp *</label>
                <input
                  type="tel"
                  value={formData.parent_phone || ''}
                  onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className={inputClass}
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pekerjaan Wali</label>
              <input
                type="text"
                value={formData.parent_job || ''}
                onChange={e => setFormData({ ...formData, parent_job: e.target.value })}
                placeholder="Pekerjaan wali"
                className={inputClass}
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
              />
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Alamat *</label>
              <textarea
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap rumah"
                rows={2}
                className={inputClass}
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
              />
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status Pendaftaran</label>
              <select
                value={formData.status || 'menunggu'}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className={inputClass}
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
              >
                <option value="menunggu">Menunggu</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
            <button
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="apple-btn-secondary px-5 py-2.5 text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveRegistration}
              disabled={saving}
              className="apple-btn px-5 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                  Menyimpan...
                </>
              ) : (editingReg ? '💾 Simpan Perubahan' : '➕ Tambah Pendaftaran')}
            </button>
          </div>
        </div>
      </M3Dialog>

      {/* ── Modal Konfirmasi Hapus ── */}
      <M3Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Konfirmasi Hapus Pendaftaran"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Apakah Anda yakin ingin menghapus pendaftaran untuk <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{deleteTarget.full_name}</strong>?
            </p>
            <p className="text-xs p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              ⚠️ Tindakan ini tidak dapat dibatalkan dan akan menghapus record pendaftaran dari database.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="apple-btn-secondary px-5 py-2.5 text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-semibold flex items-center gap-2 rounded-2xl bg-rose-600 text-white shadow-lg hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                    Menghapus...
                  </>
                ) : '🗑️ Ya, Hapus'}
              </button>
            </div>
          </div>
        )}
      </M3Dialog>
    </>
  );
}

export default function OwnerRegistrations() {
  return (
    <Navigation>
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-12 py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin mb-4" />
          <p className="text-xs font-semibold uppercase tracking-wider animate-pulse" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Memuat Halaman Pendaftaran...
          </p>
        </div>
      }>
        <RegistrationsContent />
      </Suspense>
    </Navigation>
  );
}
