'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/lib/mockData';

const roleLabel: Record<string, string> = {
  owner: 'Pemilik / Pengelola Dojo',
  pelatih: 'Pelatih / Sempai',
  ortu: 'Orang Tua / Wali',
};

const inputClass = 'm3-textfield-outlined text-sm';
const labelClass = 'block text-xs font-semibold mb-1.5';
const fieldWrap = 'flex flex-col';

// Reusable M3 Dialog
function M3Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl animate-m3-dialog-enter"
        style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// SHA-256 hashing helper
async function generateSHA256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function SettingsPage() {
  const { profile } = useAuth();
  
  // Own profile states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };
  const [saved, setSaved] = useState(false);

  // Management states (Owner only)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  // Form states for CRUD modal
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'owner' | 'pelatih' | 'ortu'>('ortu');
  const [formPassword, setFormPassword] = useState('');

  const loadAllProfiles = async () => {
    if (profile?.role !== 'owner') return;
    setLoadingProfiles(true);
    const { data } = await supabase.from('profiles').select('*');
    if (data) setAllProfiles(data);
    setLoadingProfiles(false);
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
      if (profile.role === 'owner') {
        loadAllProfiles();
      }
    }
  }, [profile]);

  const handleSaveOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').eq('id', profile.id).update({
      full_name: fullName.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // CRUD Actions
  const openAddUserModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormPhone('');
    setFormRole('ortu');
    setFormPassword('');
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: Profile) => {
    setEditingUser(user);
    setFormName(user.full_name);
    setFormPhone(user.phone);
    setFormRole(user.role as 'owner' | 'pelatih' | 'ortu');
    setFormPassword(''); // blank means do not change password
    setIsModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updateData: any = {
      full_name: formName.trim(),
      phone: formPhone.trim(),
      role: formRole,
    };

    if (formPassword.trim() !== '') {
      updateData.password_hash = await generateSHA256(formPassword.trim());
    }

    if (editingUser) {
      // Edit User Profile
      await supabase.from('profiles').eq('id', editingUser.id).update(updateData);
    } else {
      // Create User Profile
      const newId = `user-${Date.now()}`;
      // default hash if blank is '123456'
      if (!updateData.password_hash) {
        updateData.password_hash = await generateSHA256('123456');
      }
      await supabase.from('profiles').insert({
        id: newId,
        avatar_url: '',
        created_at: new Date().toISOString(),
        ...updateData
      });
    }

    setSaving(false);
    setIsModalOpen(false);
    loadAllProfiles();
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) {
      await supabase.from('profiles').eq('id', userId).delete();
      loadAllProfiles();
    }
  };

  return (
    <Navigation>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Pengaturan Akun &amp; Profil
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Kelola profil pribadi Anda{profile?.role === 'owner' ? ' dan akun seluruh pengguna dojo' : ''}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Top: Own profile info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 flex items-center gap-4"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="w-12 h-12 rounded-[var(--md-sys-shape-corner-full)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ background: 'var(--md-sys-color-primary)' }}>
                {fullName.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{fullName || '—'}</p>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-[var(--md-sys-shape-corner-full)] text-[10px] font-semibold"
                  style={{ background: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {profile ? roleLabel[profile.role] || profile.role : '—'}
                </span>
              </div>
            </div>

            {/* Own profile form */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6 space-y-4"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>Profil Saya</h3>
              <form onSubmit={handleSaveOwnProfile} className="space-y-4">
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Lengkap</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClass} />
                </div>
                <div className={fieldWrap}>
                  <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nomor Telepon</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className={inputClass} />
                </div>
                <button type="submit" disabled={saving} className="m3-btn-filled w-full py-2.5 text-xs font-semibold">
                  {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
                {saved && (
                  <p className="text-xs font-semibold text-center mt-1" style={{ color: 'var(--md-sys-color-tertiary)' }}>
                    ✅ Profil berhasil diperbarui!
                  </p>
                )}
              </form>
            </div>

            {/* Theme Settings Form */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6 space-y-4"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <h3 className="font-semibold text-sm animate-fade-in" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tampilan</h3>
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Mode Tema</label>
                <div className="flex gap-2 p-1 rounded-full bg-[var(--md-sys-color-surface-container-high)]">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[var(--md-sys-color-primary)] text-white'
                        : 'text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  >
                    🌙 Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-[var(--md-sys-color-primary)] text-white'
                        : 'text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  >
                    ☀️ Light
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Bottom: User Accounts CRUD list (Owner only) */}
          {profile?.role === 'owner' && (
            <div className="lg:col-span-2 rounded-[var(--md-sys-shape-corner-extra-large)] p-6 flex flex-col"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Kelola Akun Dojo</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Daftar akun pelatih, orang tua, dan pemilik
                  </p>
                </div>
                <button onClick={openAddUserModal} className="m3-btn-outlined px-3 py-1.5 text-xs font-semibold">
                  + Tambah Akun
                </button>
              </div>

              {loadingProfiles ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-[var(--md-sys-shape-corner-medium)]" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ background: 'var(--md-sys-color-surface-container)', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama</th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Role</th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Username (No WA)</th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.map((user, idx) => (
                        <tr key={user.id} style={{ borderBottom: idx < allProfiles.length - 1 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{user.full_name}</td>
                          <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{user.role}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{user.phone || '—'}</td>
                          <td className="px-4 py-3 text-right text-xs">
                            <button onClick={() => openEditUserModal(user)} className="m3-btn-text py-1 px-2 font-semibold">Edit</button>
                            <button onClick={() => handleDeleteUser(user.id)} className="m3-btn-text py-1 px-2 font-semibold" style={{ color: 'var(--md-sys-color-error)' }}>Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal User CRUD Form */}
        <M3Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}>
          <form onSubmit={handleUserSubmit} className="space-y-4 animate-fade-in">
            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Lengkap *</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Masukkan nama" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No WhatsApp / Phone *</label>
                <input type="tel" required value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="08xxxxx..." className={inputClass} />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Hak Akses (Role)</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value as any)} className={inputClass}>
                  <option value="ortu">Orang Tua / Wali</option>
                  <option value="pelatih">Pelatih / Sempai</option>
                  <option value="owner">Pemilik / Owner</option>
                </select>
              </div>
            </div>

            <div className={fieldWrap}>
              <label className={labelClass} style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {editingUser ? 'Sandi Baru (Kosongkan jika tak diubah)' : 'Kata Sandi *'}
              </label>
              <input type="password" required={!editingUser} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={editingUser ? '••••••••' : 'Sandi masuk'} className={inputClass} />
              <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {editingUser ? 'Isi hanya jika ingin mengubah sandi pengguna.' : 'Sandi default jika kosong adalah: 123456'}
              </p>
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
