'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase, rawClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Registration, Student, Notification, Profile } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { useSearchParams } from 'next/navigation';

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

  const fetchRegistrations = async () => {
    const { data } = await supabase.from('registrations').order('submitted_at', { ascending: false }).select();
    if (data) setRegistrations(data as Registration[]);
    setLoading(false);
  };

  const fetchParentProfiles = async () => {
    const { data } = await supabase.from('profiles').eq('role', 'ortu').select();
    if (data) setParentProfiles(data as Profile[]);
  };

  const openApproveModal = (reg: Registration) => {
    setApproveTarget(reg);
    setParentMode('existing');
    setSelectedParentId('');
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

      // Buat email internal dari nomor HP: {digitsOnly}@kkidpl.com (menggunakan domain valid agar lolos validasi Supabase)
      const phoneDigits = newParentPhone.trim().replace(/\D/g, '');
      const generatedEmail = `${phoneDigits}@kkidpl.com`;

      let authUserId = '';

      // Coba buat akun Supabase Auth
      const { data: signUpData, error: signUpError } = await rawClient.auth.signUp({
        email: generatedEmail,
        password: newParentPassword,
        options: {
          data: { full_name: newParentName.trim(), role: 'ortu' },
          emailRedirectTo: undefined,
        },
      });

      if (!signUpError && signUpData?.user?.id) {
        authUserId = signUpData.user.id;
      } else {
        console.warn('Supabase Auth signUp failed/bypassed:', signUpError?.message);
        // Fallback ID jika Supabase Auth menolak domain atau user auth gagal dibuat
        authUserId = isSupabaseConfigured ? crypto.randomUUID() : `parent-${phoneDigits}`;
      }

      const newProfile: Partial<Profile> = {
        id: authUserId,
        full_name: newParentName.trim(),
        role: 'ortu',
        phone: newParentPhone.trim(),
        avatar_url: '',
        created_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase.from('profiles').insert(newProfile);
      if (profileError) {
        console.warn('Profil orang tua insert log:', profileError.message);
      }
      parentId = authUserId;
      fetchParentProfiles();
    }

    // Update status registrasi ke 'disetujui' TERLEBIH DAHULU
    // untuk mencegah double-approve jika terjadi error di tengah proses
    const { error: updateRegError } = await supabase.from('registrations').eq('id', approveTarget.id).update({
      status: 'disetujui',
    });
    if (updateRegError) {
      alert('Gagal mengupdate status pendaftaran: ' + updateRegError.message);
      setApproving(false);
      return;
    }

    const newStudent: Partial<Student> = {
      id: isSupabaseConfigured ? crypto.randomUUID() : `student-${crypto.randomUUID().slice(0, 8)}`,
      full_name: approveTarget.full_name,
      dob: approveTarget.dob,
      gender: '-',
      address: approveTarget.address,
      parent_id: parentId && parentId !== 'user-parent-id' ? parentId : undefined,
      phone: approveTarget.parent_phone,
      parent_name: approveTarget.parent_name,
      parent_job: approveTarget.parent_job,
      photo_url: '',
      join_date: new Date().toISOString().split('T')[0],
      current_belt: approveTarget.current_belt || 'Putih',
      status: 'active',
    };
    const { error: studentError } = await supabase.from('students').insert(newStudent);
    if (studentError) {
      alert('Pendaftaran disetujui, namun gagal membuat data siswa: ' + studentError.message + '\nSilakan tambahkan siswa secara manual di menu Siswa.');
    }

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
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Pendaftaran Siswa Baru
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Review dan kelola pendaftaran calon siswa KKI DPL Dojo.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          {(['menunggu', 'disetujui', 'ditolak'] as const).map((status) => {
            const count = registrations.filter((r: Registration) => r.status === status).length;
            const icons = { menunggu: '⏳', disetujui: '✅', ditolak: '❌' };
            const badgeStyle = statusBadge(status);
            return (
              <button
                key={status}
                onClick={() => setFilter(f => f === status ? 'semua' : status)}
                className="m3-card-filled text-left transition-all duration-200 cursor-pointer flex flex-col gap-2"
                style={{
                  border: filter === status ? '2px solid var(--md-sys-color-primary)' : '2px solid transparent',
                  padding: '16px'
                }}
              >
                <div className="w-9 h-9 rounded-[var(--md-sys-shape-corner-medium)] flex items-center justify-center text-base"
                  style={badgeStyle}>
                  {icons[status]}
                </div>
                <p className="text-2xl font-bold leading-none mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>{count}</p>
                <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{statusLabel(status)}</p>
              </button>
            );
          })}
        </div>

        {/* Registration List */}
        <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
          style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">📋</span>
              <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {filter === 'semua' ? 'Belum ada pendaftaran' : `Tidak ada pendaftaran berstatus "${statusLabel(filter)}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              {filtered.map((reg: Registration) => (
                <div key={reg.id} className="p-5 transition-colors duration-150"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-surface-container)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                          {reg.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{reg.full_name}</h3>
                          <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Lahir: {new Date(reg.dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:ml-13 pl-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tempat Lahir:</span> {reg.birth_place || '-'}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>NIK (KK):</span> {reg.nik || '-'}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Sabuk Saat Ini:</span> <span className="font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>{reg.current_belt || 'Putih'}</span>
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
                      <span className="px-3 py-1.5 rounded-[var(--md-sys-shape-corner-full)] text-xs font-semibold"
                        style={statusBadge(reg.status)}>
                        {statusLabel(reg.status)}
                      </span>

                      {reg.status === 'menunggu' && (
                        <div className="flex gap-2 mt-0 sm:mt-2">
                          <button
                            onClick={() => openApproveModal(reg)}
                            className="m3-btn-filled text-xs py-1.5 px-3"
                          >
                            ✓ Setujui
                          </button>
                          <button
                            onClick={() => handleReject(reg)}
                            className="m3-btn-outlined text-xs py-1.5 px-3"
                          >
                            ✕ Tolak
                          </button>
                        </div>
                      )}

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

            <div className="rounded-xl p-4 text-xs space-y-1" style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
              <p><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Wali Pendaftar:</span> {approveTarget.parent_name} {approveTarget.parent_job ? `(${approveTarget.parent_job})` : ''} · {approveTarget.parent_phone}</p>
              <p><span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>Sabuk Saat Ini:</span> {approveTarget.current_belt || 'Putih'}</p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <button
                onClick={() => setParentMode('existing')}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                style={{
                  background: parentMode === 'existing' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: parentMode === 'existing' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                Akun Sudah Ada
              </button>
              <button
                onClick={() => setParentMode('new')}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                style={{
                  background: parentMode === 'new' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: parentMode === 'new' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                Buat Akun Baru
              </button>
            </div>

            {parentMode === 'existing' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
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
                  <p className="text-xs font-medium" style={{ color: 'var(--md-sys-color-tertiary)' }}>
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
                  />
                </div>

                {/* Preview login identifier */}
                {newParentPhone.trim() && (
                  <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                    style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                    <span>📱</span>
                    <span>Login menggunakan: <strong>{newParentPhone.trim()}</strong></span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '12px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-primary)' }}>
                      🔐 Kata Sandi Akun
                    </p>
                    {newParentPhone.trim() && (
                      <button
                        type="button"
                        onClick={() => setNewParentPassword(newParentPhone.trim())}
                        className="text-[11px] underline hover:opacity-80 transition-opacity"
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
                        style={{ paddingRight: '44px' }}
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
                      <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-error)' }}>Minimal 6 karakter</p>
                    )}
                  </div>
                </div>

                <p className="text-xs p-3 rounded-lg" style={{ background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                  💡 <strong>Info Login:</strong> Orang tua dapat login menggunakan <strong>No. HP</strong> sebagai username dan <strong>No. HP</strong> (atau kata sandi di atas) sebagai password.
                </p>
              </div>
            )}


            <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <button
                onClick={() => setApproveTarget(null)}
                disabled={approving}
                className="m3-btn-text px-5 py-2.5 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={approving}
                className="m3-btn-filled px-5 py-2.5 text-sm flex items-center gap-2"
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
