'use client';

import React, { useState, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

// ─── Column mapping definition ──────────────────────────────────────────────
const FIELD_MAP = [
  { key: 'full_name',     label: 'Nama Lengkap',       required: true },
  { key: 'nik',           label: 'NIK',                 required: false },
  { key: 'birth_place',   label: 'Tempat Lahir',        required: false },
  { key: 'dob',           label: 'Tanggal Lahir',       required: true,  hint: 'Format: YYYY-MM-DD atau DD/MM/YYYY' },
  { key: 'gender',        label: 'Jenis Kelamin',       required: false, hint: 'Laki-laki / Perempuan' },
  { key: 'address',       label: 'Alamat',              required: false },
  { key: 'phone',         label: 'Nomor Telepon',       required: false },
  { key: 'current_belt',  label: 'Sabuk Saat Ini',      required: false, hint: 'Putih / Kuning / Hijau / dst.' },
  { key: 'weight',        label: 'Berat Badan',         required: false },
  { key: 'height',        label: 'Tinggi Badan',        required: false },
  { key: 'join_date',     label: 'Tanggal Bergabung',   required: false, hint: 'Format: YYYY-MM-DD' },
  { key: 'parent_name',   label: 'Nama Orang Tua',      required: false },
];

type ParsedRow = Record<string, string>;
type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

// ─── Date normalization ──────────────────────────────────────────────────────
function normalizeDate(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'number' || !isNaN(Number(val)) && String(val).indexOf('-') === -1 && String(val).indexOf('/') === -1) {
    const d = XLSX.SSF.parse_date_code(Number(val));
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split('/');
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split('-');
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return str;
}

// ─── Template download ───────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = ['Nama Lengkap', 'NIK', 'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)', 'Jenis Kelamin', 'Alamat', 'Nomor Telepon', 'Sabuk Saat Ini', 'Berat Badan', 'Tinggi Badan', 'Tanggal Bergabung (YYYY-MM-DD)', 'Nama Orang Tua'];
  const example = ['Ahmad Fauzi', '1871131810140002', 'BANDAR LAMPUNG', '2014-05-10', 'Laki-laki', 'Jl. Merdeka No. 5', '08123456789', 'Putih', '30', '135', '2025-01-15', 'Budi Fauzi'];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
  XLSX.writeFile(wb, 'template-import-siswa-dojo.xlsx');
}

export default function ImportStudentsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [colMapping, setColMapping] = useState<Record<string, string>>({});
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: string[] }>({ success: 0, skipped: 0, errors: [] });
  const [dragOver, setDragOver] = useState(false);

  // ── Parse file ──────────────────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    setStatus('parsing');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        
        const sheetName = wb.SheetNames.includes('Siswa') ? 'Siswa' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        if (jsonRows.length === 0) { alert('Sheet kosong atau tidak ada data.'); setStatus('idle'); return; }

        const headers = Object.keys(jsonRows[0]);
        setFileHeaders(headers);
        setRows(jsonRows.map(r => {
          const out: ParsedRow = {};
          headers.forEach(h => { out[h] = String(r[h] ?? ''); });
          return out;
        }));

        const autoMap: Record<string, string> = {};
        FIELD_MAP.forEach(f => {
          const match = headers.find(h => {
            const hClean = h.toLowerCase().replace(/_/g, ' ');
            const fClean = f.label.toLowerCase();
            const fKeyClean = f.key.toLowerCase().replace(/_/g, ' ');
            return hClean === fClean || hClean === fKeyClean || hClean.includes(fKeyClean) || hClean.includes(fClean.split(' ')[0]);
          });
          if (match) autoMap[f.key] = match;
        });
        setColMapping(autoMap);
        setStatus('preview');
      } catch (err) {
        alert('Gagal membaca file. Pastikan format file adalah Excel (.xlsx/.xls) atau CSV.');
        setStatus('idle');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  // ── Validate & resolve a row ────────────────────────────────────────────────
  const resolveRow = (row: ParsedRow) => {
    const get = (key: string) => (colMapping[key] ? row[colMapping[key]] || '' : '');
    return {
      full_name: get('full_name').trim(),
      nik: get('nik').trim(),
      birth_place: get('birth_place').trim(),
      dob: normalizeDate(get('dob')),
      gender: get('gender').trim() || 'Laki-laki',
      address: get('address').trim(),
      phone: get('phone').trim(),
      current_belt: get('current_belt').trim() || 'Putih',
      weight: get('weight').trim(),
      height: get('height').trim(),
      join_date: normalizeDate(get('join_date')) || new Date().toISOString().split('T')[0],
      parent_id: '',
      photo_url: '',
      status: 'active' as const,
      _parent_name: get('parent_name').trim(),
    };
  };

  // ── Import rows ─────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setStatus('importing');
    let success = 0, skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const resolved = resolveRow(rows[i]);
      if (!resolved.full_name) { skipped++; continue; }

      const { data: existing } = await supabase.from('students').eq('full_name', resolved.full_name).select('id');
      if (existing && existing.length > 0) {
        skipped++;
        errors.push(`Baris ${i + 2}: "${resolved.full_name}" sudah ada — dilewati.`);
        continue;
      }

      const { _parent_name, ...studentData } = resolved;
      const { error } = await (supabase.from('students').insert({ ...studentData, id: `student-import-${crypto.randomUUID().slice(0, 8)}` }) as unknown as Promise<{ error: unknown }>);
      if (error) {
        errors.push(`Baris ${i + 2}: "${resolved.full_name}" — gagal disimpan.`);
      } else {
        success++;
      }
    }

    setImportResult({ success, skipped, errors });
    setStatus('done');
  };

  const reset = () => {
    setStatus('idle');
    setRows([]);
    setColMapping({});
    setFileHeaders([]);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const previewRows = rows.slice(0, 5);

  return (
    <Navigation>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Import Data Siswa
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Upload file Excel (.xlsx) atau CSV dari database lama Anda.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="m3-btn-outlined px-5 py-2.5 text-sm font-semibold flex items-center gap-2 cursor-pointer w-fit"
          >
            📋 Unduh Template Excel
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {['Upload File', 'Petakan Kolom', 'Import'].map((step, i) => {
            const stepStatus = i === 0 ? (status === 'idle' || status === 'parsing' ? 'active' : 'done') :
                                i === 1 ? (status === 'preview' ? 'active' : status === 'importing' || status === 'done' ? 'done' : 'pending') :
                                (status === 'importing' || status === 'done' ? 'active' : 'pending');
            return (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  stepStatus === 'active' ? 'bg-[var(--md-sys-color-primary)] text-white' :
                  stepStatus === 'done' ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  <span>{stepStatus === 'done' ? '✓' : i + 1}</span>
                  <span>{step}</span>
                </div>
                {i < 2 && <span className="text-gray-300 text-xs">→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: Upload ── */}
        {(status === 'idle' || status === 'parsing') && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`rounded-[var(--md-sys-shape-corner-extra-large)] border-2 border-dashed cursor-pointer transition-all duration-200 py-16 text-center ${
              dragOver ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20' : 'border-[var(--md-sys-color-outline-variant)] hover:border-gray-400 hover:bg-gray-50/50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            {status === 'parsing' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
                <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Membaca file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl">📂</span>
                <div>
                  <p className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Klik atau seret file ke sini</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Mendukung format .xlsx, .xls, dan .csv</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info panduan */}
        {status === 'idle' && (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-5 space-y-3"
            style={{ background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
            <h3 className="text-sm font-bold">💡 Panduan Import</h3>
            <ul className="text-xs space-y-1.5 list-disc list-inside opacity-90">
              <li>Unduh template Excel di atas untuk format yang sudah siap dipakai</li>
              <li>File boleh memiliki nama kolom berbeda — Anda bisa petakan di langkah berikutnya</li>
              <li>Kolom wajib: <strong>Nama Lengkap</strong> dan <strong>Tanggal Lahir</strong></li>
              <li>Siswa dengan nama yang sama akan dilewati (tidak di-duplicate)</li>
              <li>Format tanggal: YYYY-MM-DD, DD/MM/YYYY, atau DD-MM-YYYY semua didukung</li>
            </ul>
          </div>
        )}

        {/* ── STEP 2: Column Mapping + Preview ── */}
        {status === 'preview' && (
          <>
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6 space-y-4"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Petakan Kolom</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    File: <strong>{fileName}</strong> · {rows.length} baris ditemukan
                  </p>
                </div>
                <button onClick={reset} className="text-xs font-semibold hover:underline" style={{ color: 'var(--md-sys-color-error)' }}>
                  ✕ Ganti File
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIELD_MAP.map(field => (
                  <div key={field.key} className="flex flex-col">
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={colMapping[field.key] || ''}
                      onChange={e => setColMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="m3-textfield-outlined text-sm"
                    >
                      <option value="">— Tidak digunakan —</option>
                      {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    {field.hint && <p className="text-[10px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.8 }}>{field.hint}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Preview Data (5 baris pertama dari {rows.length} total)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr style={{ background: 'var(--md-sys-color-surface-container)' }}>
                      <th className="px-4 py-2.5 font-bold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>#</th>
                      {FIELD_MAP.filter(f => colMapping[f.key]).map(f => (
                        <th key={f.key} className="px-4 py-2.5 font-bold whitespace-nowrap" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    {previewRows.map((row, i) => {
                      const resolved = resolveRow(row);
                      const missing = !resolved.full_name;
                      return (
                        <tr key={i} style={missing ? { background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' } : {}}>
                          <td className="px-4 py-2.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{i + 2}</td>
                          {FIELD_MAP.filter(f => colMapping[f.key]).map(f => (
                            <td key={f.key} className="px-4 py-2.5 whitespace-nowrap max-w-[160px] truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {f.key === 'dob' || f.key === 'join_date'
                                ? normalizeDate(row[colMapping[f.key]] || '')
                                : row[colMapping[f.key]] || <span className="text-gray-400 italic">kosong</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <p className="text-xs p-3 text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  + {rows.length - 5} baris lainnya tidak ditampilkan
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={reset} className="m3-btn-outlined px-5 py-2.5 text-sm font-semibold cursor-pointer">
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={!colMapping['full_name']}
                className="m3-btn-filled px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Import {rows.length} Siswa
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Importing progress ── */}
        {status === 'importing' && (
          <div className="rounded-[var(--md-sys-shape-corner-extra-large)] py-16 text-center space-y-4"
            style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
            <div className="w-12 h-12 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin mx-auto" />
            <p className="text-base font-bold animate-pulse" style={{ color: 'var(--md-sys-color-on-surface)' }}>Sedang mengimpor data...</p>
            <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Mohon tunggu, jangan tutup halaman ini</p>
          </div>
        )}

        {/* ── STEP 4: Result ── */}
        {status === 'done' && (
          <div className="space-y-4">
            <div className="rounded-[var(--md-sys-shape-corner-extra-large)] p-6 space-y-4"
              style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>✅ Import Selesai</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl p-4" style={{ background: 'var(--md-sys-color-tertiary-container)' }}>
                  <p className="text-3xl font-bold" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>{importResult.success}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>Berhasil Diimpor</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--md-sys-color-secondary-container)' }}>
                  <p className="text-3xl font-bold" style={{ color: 'var(--md-sys-color-on-secondary-container)' }}>{importResult.skipped}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--md-sys-color-on-secondary-container)' }}>Dilewati / Duplikat</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--md-sys-color-error-container)' }}>
                  <p className="text-3xl font-bold" style={{ color: 'var(--md-sys-color-on-error-container)' }}>{importResult.errors.length}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--md-sys-color-on-error-container)' }}>Gagal</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-xl p-4 space-y-1" style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}>
                  <p className="text-xs font-bold">Detail Error:</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs">{err}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex-1 m3-btn-outlined py-2.5 text-sm font-semibold cursor-pointer">
                  Import File Lain
                </button>
                <a href="/owner/students" className="flex-1 m3-btn-filled py-2.5 text-sm font-semibold text-center">
                  Lihat Data Siswa
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
