'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { CurriculumMaterial } from '@/lib/mockData';

const beltLevels = ['Putih', 'Kuning', 'Orange', 'Hijau', 'Biru Muda', 'Biru Tua', 'Coklat Muda', 'Coklat', 'Hitam'];

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Kurikulum &amp; Silabus Latihan
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Daftar standar teknik dasar (Kihon), seni gerakan (Kata), dan pertarungan (Kumite) per tingkat sabuk dojo KKI DPL.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="m3-btn-filled px-5 py-2.5 text-xs font-semibold cursor-pointer">
            + Tambah Teknik
          </button>
        </div>

        {/* Belt Tabs */}
        <div className="flex gap-2 pb-2 overflow-x-auto">
          {beltLevels.map(belt => (
            <button
              key={belt}
              onClick={() => setSelectedBelt(belt)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedBelt === belt
                  ? 'bg-[var(--md-sys-color-primary)] text-white shadow-sm'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]'
              }`}
            >
              🥋 Sabuk {belt}
            </button>
          ))}
        </div>

        {/* Materials list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 rounded-3xl animate-pulse" style={{ background: 'var(--md-sys-color-surface-container)' }} />)}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-8 text-center bg-[var(--md-sys-color-surface-container-low)] rounded-3xl">
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Belum ada materi latihan untuk Sabuk {selectedBelt}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMaterials.map(mat => (
              <div key={mat.id} className="m3-card-elevated flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                      {mat.category}
                    </span>
                    {mat.video_url && (
                      <a href={mat.video_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1">
                        🎬 Video Materi
                      </a>
                    )}
                  </div>
                  <h4 className="font-bold text-base mb-1.5" style={{ color: 'var(--md-sys-color-on-surface)' }}>{mat.title}</h4>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{mat.description}</p>
                  
                  <div className="space-y-1.5 mt-4 pt-4 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">Syarat Penguasaan:</span>
                    {mat.checklist_items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" readOnly checked className="accent-[var(--md-sys-color-primary)] w-3.5 h-3.5" />
                        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add technique M3Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-md rounded-[var(--md-sys-shape-corner-extra-large)] shadow-2xl p-6 bg-[var(--md-sys-color-surface-container-high)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Tambah Silabus Sabuk {selectedBelt}</h3>
            <form onSubmit={handleAddMaterial} className="space-y-4 text-xs">
              <div className="flex flex-col">
                <label className="mb-1.5 font-bold">Kategori Teknik</label>
                <select className="m3-textfield-outlined" value={techCategory} onChange={e => setTechCategory(e.target.value as any)}>
                  <option value="Kihon">Kihon (Teknik Dasar)</option>
                  <option value="Kata">Kata (Jurus Senam)</option>
                  <option value="Kumite">Kumite (Pertarungan)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold">Nama Gerakan / Jurus</label>
                <input type="text" required className="m3-textfield-outlined" placeholder="mis. Heian Shodan" value={techTitle} onChange={e => setTechTitle(e.target.value)} />
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold">Deskripsi Penjelasan</label>
                <textarea rows={3} required className="m3-textfield-outlined border p-2" placeholder="Jelaskan teknik ini..." value={techDescription} onChange={e => setTechDescription(e.target.value)} />
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold">Link Video Referensi (Opsional)</label>
                <input type="url" className="m3-textfield-outlined" placeholder="https://..." value={techVideo} onChange={e => setTechVideo(e.target.value)} />
              </div>

              <div className="flex flex-col">
                <label className="mb-1.5 font-bold">Poin Penilaian (Satu per baris)</label>
                <textarea rows={3} required className="m3-textfield-outlined border p-2" placeholder="mis. Kiai mantap&#10;Kuda-kuda rendah" value={techItems} onChange={e => setTechItems(e.target.value)} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="m3-btn-text py-2 px-4 font-semibold">Batal</button>
                <button type="submit" className="m3-btn-filled py-2 px-4 font-semibold">Simpan Materi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Navigation>
  );
}
