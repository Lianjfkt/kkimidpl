'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { CurriculumMaterial } from '@/lib/mockData';
import { OFFICIAL_BELTS } from '@/lib/constants/belts';

const beltLevels = OFFICIAL_BELTS;

export default function CurriculumPage() {
  const [selectedBelt, setSelectedBelt] = useState('Putih');
  const [materials, setMaterials] = useState<CurriculumMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // New technique form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [techCategory, setTechCategory] = useState<'Kihon' | 'Kata' | 'Kumite'>('Kihon');
  const [techTitle, setTechTitle] = useState('');
  const [techDescription, setTechDescription] = useState('');
  const [techVideo, setTechVideo] = useState('');
  const [techItems, setTechItems] = useState<string>('');

  const loadMaterials = async () => {
    setLoading(true);
    const { data } = await supabase.from('curriculum_materials').select('*');
    if (data) setMaterials(data as CurriculumMaterial[]);
    setLoading(false);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const filteredMaterials = materials.filter(m => m.belt_level === selectedBelt);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsArray = techItems.split('\n').map(i => i.trim()).filter(i => i.length > 0);
    const newMaterial = {
      id: `mat-${Date.now()}`,
      belt_level: selectedBelt,
      category: techCategory,
      title: techTitle,
      description: techDescription,
      video_url: techVideo || undefined,
      checklist_items: itemsArray
    };

    await supabase.from('curriculum_materials').insert(newMaterial);
    setIsModalOpen(false);
    setTechTitle('');
    setTechDescription('');
    setTechVideo('');
    setTechItems('');
    loadMaterials();
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Kurikulum &amp; Silabus Latihan
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftar standar teknik dasar (Kihon), seni gerakan (Kata), dan pertarungan (Kumite) per tingkat sabuk dojo KKI DPL.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="apple-btn px-5 py-2.5 text-sm font-semibold cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Teknik
          </button>
        </div>

        {/* Belt Tabs */}
        <div
          className="flex gap-2 p-1.5 rounded-2xl border border-[var(--neu-border)] overflow-x-auto"
          style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
        >
          {beltLevels.map(belt => {
            const isSelected = selectedBelt === belt;
            return (
              <button
                key={belt}
                onClick={() => setSelectedBelt(belt)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                style={{
                  background: isSelected ? 'var(--neu-accent-grad)' : 'transparent',
                  boxShadow: isSelected ? 'var(--neu-shadow-accent)' : 'none',
                  color: isSelected ? 'white' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                🥋 Sabuk {belt}
              </button>
            );
          })}
        </div>

        {/* Materials list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div
                key={i}
                className="h-44 rounded-3xl animate-pulse"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div
            className="p-12 text-center rounded-3xl border border-[var(--neu-border)]"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
          >
            <div className="text-4xl mb-2">🥋</div>
            <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Belum ada materi kurikulum untuk Sabuk {selectedBelt}.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="apple-btn px-4 py-2 text-xs font-semibold mt-3 cursor-pointer"
            >
              + Tambah Teknik Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMaterials.map(mat => (
              <div
                key={mat.id}
                className="rounded-3xl border border-[var(--neu-border)] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
                style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        background: 'var(--neu-surface-low)',
                        boxShadow: 'var(--neu-shadow-pressed-sm)',
                        color: mat.category === 'Kihon' ? 'var(--md-sys-color-primary)' : mat.category === 'Kata' ? '#3b82f6' : '#10b981'
                      }}
                    >
                      {mat.category}
                    </span>
                    {mat.video_url && (
                      <a
                        href={mat.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apple-btn-secondary px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        🎬 Video Materi
                      </a>
                    )}
                  </div>
                  <h4 className="font-bold text-lg mb-2 tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>{mat.title}</h4>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{mat.description}</p>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-[var(--neu-border)]">
                    <span className="block text-[11px] font-bold uppercase tracking-wider opacity-60">Syarat Penguasaan:</span>
                    {mat.checklist_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 text-xs p-2.5 rounded-xl border border-[var(--neu-border)]"
                        style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)' }}
                      >
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add technique Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--neu-border)] p-6 shadow-2xl animate-fade-in"
            style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-shadow-flat)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Tambah Silabus Sabuk {selectedBelt}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-flat-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMaterial} className="space-y-4 text-xs">
              <div className="flex flex-col">
                <label className="mb-1.5 font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Kategori Teknik</label>
                <select
                  className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  value={techCategory}
                  onChange={e => setTechCategory(e.target.value as any)}
                >
                  <option value="Kihon">Kihon (Teknik Dasar)</option>
                  <option value="Kata">Kata (Jurus Senam)</option>
                  <option value="Kumite">Kumite (Pertarungan)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nama Gerakan / Jurus</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  placeholder="mis. Heian Shodan"
                  value={techTitle}
                  onChange={e => setTechTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Deskripsi Penjelasan</label>
                <textarea
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  placeholder="Jelaskan teknik ini..."
                  value={techDescription}
                  onChange={e => setTechDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Link Video Referensi (Opsional)</label>
                <input
                  type="url"
                  className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  placeholder="https://..."
                  value={techVideo}
                  onChange={e => setTechVideo(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Poin Penilaian (Satu per baris)</label>
                <textarea
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: 'var(--neu-surface-low)', boxShadow: 'var(--neu-shadow-pressed-sm)', border: '1px solid var(--neu-border)', color: 'var(--md-sys-color-on-surface)' }}
                  placeholder="mis. Kiai mantap&#10;Kuda-kuda rendah"
                  value={techItems}
                  onChange={e => setTechItems(e.target.value)}
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
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Navigation>
  );
}
