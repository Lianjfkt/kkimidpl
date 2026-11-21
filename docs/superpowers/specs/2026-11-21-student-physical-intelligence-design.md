# Spec: Dojo Physical Intelligence & Student Fitness Tracking System

**Tanggal:** 2026-11-21  
**Status:** Approved by User  
**Tujuan:** Menyediakan sistem pelacakan kemampuan fisik, visualisasi radar 6 dimensi (termasuk kedisiplinan), rekomendasi latihan pintar, dan penentu kelayakan ujian sabuk untuk siswa dojo karate KKI.

---

## 1. Ringkasan & Ruang Lingkup Sistem

Sistem ini merekam, menormalisasi, dan memvisualisasikan data kemampuan fisik serta kedisiplinan siswa dojo secara berkala. Sistem ini melayani 3 aktor utama:
1. **Pelatih (*Coach*):** Menginput hasil tes dengan bantuan asisten timer 30 detik (audio/buzzer) & stopwatch skipping di tepi matras, serta memantau papan rekor dojo (*Leaderboard*).
2. **Pengelola / Pelatih Kepala (*Owner/Admin*):** Melihat riwayat lengkap, grafik radar, tren progres, dan verifikasi kelayakan siswa untuk mengikuti Ujian Kenaikan Sabuk (*Belt Exam*).
3. **Orang Tua (*Parent*):** Memantau perkembangan fisik, tingkat kedisiplinan latihan, dan panduan latihan anak di rumah melalui portal orang tua (`/ortu`).

---

## 2. Metrik Pengukuran & Model Normalisasi

### 2.1 Indikator Input Mentah
1. **Push Up (30 detik):** Repetisi daya tahan otot tubuh bagian atas.
2. **Sit Up (30 detik):** Repetisi kekuatan otot inti/perut.
3. **Pukulan (30 detik):** Repetisi kecepatan pukulan (*tsuki speed*).
4. **Tendangan (30 detik):** Repetisi kecepatan & daya ledak tendangan (*keri speed*).
5. **Skipping (detik):** Durasi bertahan lompat tali (daya tahan kardiovaskular & ritme footwork).
6. **Split Depan (cm):** Jarak pangkal paha ke lantai (kelenturan sagital: hamstring & pinggul).
7. **Split Samping (cm):** Jarak pangkal paha ke lantai (kelenturan frontal: adductor).
8. **Kedisiplinan Kehadiran (%):** Dihitung otomatis dari riwayat absensi `attendance_students`.

### 2.2 Sumbu Radar Chart (Heksagon 6 Dimensi, Skala 0 – 100)
1. **Upper Body Power:** Dinormalisasi dari `push_up_30s`.
2. **Core Strength:** Dinormalisasi dari `sit_up_30s`.
3. **Striking Speed:** Rata-rata normalisasi `punches_30s` dan `kicks_30s`.
4. **Cardio & Footwork:** Dinormalisasi dari durasi `skipping_sec`.
5. **Flexibility (Kelenturan):** Rata-rata skor inversi split depan dan split samping:
   $$\text{Skor Inversi} = \max(0, \min(100, 100 - (\text{jarak cm} \times 2.5)))$$
   *(0 cm = 100 poin; 10 cm = 75 poin; 20 cm = 50 poin; $\ge 40$ cm = 0 poin)*.
6. **Discipline & Dedication:**
   $$\text{Discipline Score} = \left(\frac{\text{Hadir} + (0.5 \times (\text{Izin} + \text{Sakit}))}{\text{Total Sesi}}\right) \times 100$$

### 2.3 Matriks Standar Acuan (Benchmark) Berdasarkan Usia & Sabuk
Dikelompokkan menurut tanggal lahir (`dob`):
- **Anak-anak (< 12 tahun)**
- **Remaja (12 – 16 tahun)**
- **Dewasa (> 16 tahun)**

Target standar minimum berjenjang:
- **Sabuk Putih:** Target skor rata-rata $\ge 60$
- **Sabuk Kuning / Oranye:** Target skor rata-rata $\ge 65$
- **Sabuk Hijau / Biru:** Target skor rata-rata $\ge 70$
- **Sabuk Cokelat:** Target skor rata-rata $\ge 80$
- **Sabuk Hitam (Dan):** Target skor rata-rata $\ge 85$

### 2.4 Grade & Syarat Kelayakan Ujian Kenaikan Sabuk (*Dual-Gate Exam Readiness*)
- **Grade Akhir:**
  - $\ge 90$: **Grade S** (*Elite / Athlete Tier*)
  - $80 - 89$: **Grade A** (*Advanced*)
  - $70 - 79$: **Grade B** (*Standard Lulus*)
  - $60 - 69$: **Grade C** (*Developing*)
  - $< 60$: **Grade D** (*Needs Focus*)
- **Dual-Gate Exam Readiness:**
  - Syarat 1: Skor Fisik $\ge$ target sabuk berikutnya.
  - Syarat 2: Skor Kedisiplinan Kehadiran $\ge 75\%$.
  - Status: 🟢 *Siap Ujian Sabuk*, 🟡 *Perhatian Kehadiran*, atau 🟠 *Perlu Peningkatan Fisik*.

### 2.5 Rekomendasi Latihan Pintar (*Smart Drill Prescription*)
Sistem secara deterministik mendeteksi 1–2 pilar fisik terendah ($< 70$) dan memunculkan rekomendasi spesifik:
- **Fleksibilitas rendah:** Panduan peregangan hamstring, butterfly stretch, dan peregangan dinamis.
- **Kardio/Skipping rendah:** Latihan interval lari sprint pendek dan skipping bertahap.
- **Pukulan/Tendangan rendah:** Latihan kelincahan koordinasi, plyometrics, dan target pads cepat.
- **Push Up/Sit Up rendah:** Kalistenik dasar harian (plank progresif dan push up bertahap).

---

## 3. Skema Database & Keamanan (Supabase)

### 3.1 Tabel `student_physical_tests`
```sql
create table if not exists public.student_physical_tests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  tester_id uuid references public.profiles(id) on delete set null,
  test_date date not null default current_date,
  
  -- 7 Indikator Fisik
  push_up_30s integer not null default 0,
  sit_up_30s integer not null default 0,
  punches_30s integer not null default 0,
  kicks_30s integer not null default 0,
  skipping_sec integer not null default 0,
  split_front_cm numeric(5,1) not null default 0,
  split_side_cm numeric(5,1) not null default 0,
  
  -- Nilai Hasil Kalkulasi
  total_score numeric(5,1) not null default 0,
  grade text not null default 'C',
  notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_physical_tests_student on public.student_physical_tests(student_id);
create index if not exists idx_physical_tests_date on public.student_physical_tests(test_date desc);
```

### 3.2 Row Level Security (RLS)
- **Select:** 
  - Owner & Pelatih: Bisa membaca semua data tes fisik.
  - Orang Tua: Hanya bisa membaca data siswa yang memiliki `parent_id = auth.uid()`.
- **Insert / Update / Delete:** 
  - Hanya dapat dilakukan oleh profil dengan role `'owner'` atau `'coach'`/`'pelatih'`.

---

## 4. Arsitektur Komponen & Antarmuka UI

### 4.1 Modul Logika & Kalkulasi (`src/lib/physicalScoring.ts`)
- Fungsi `calculatePhysicalAssessment(metrics, attendanceRate, dob, currentBelt)`: Menghasilkan pilar 6 dimensi, total score, grade, status ujian, dan daftar rekomendasi.
- Fungsi `getAgeCategory(dob)`: Menghitung kategori umur (`anak`, `remaja`, `dewasa`).

### 4.2 Komponen Visualisasi Pure SVG Responsif
1. `src/components/PhysicalRadarChart.tsx`:
   - Menggambar heksagon 6 sumbu interaktif berbasis SVG murni (tanpa dependensi berat).
   - Menampilkan area capaian siswa (aksen gradien merah dojo) dan garis putus-putus target sabuk berikutnya.
2. `src/components/PhysicalProgressChart.tsx`:
   - Grafik garis timeline yang melacak tren dari waktu ke waktu.

### 4.3 Halaman & Integrasi Antarmuka
1. **Layar Pelatih (`src/app/pelatih/physical-tests/page.tsx`):**
   - Asisten Timer 30 detik (audio beep, buzzer akhir, tombol tap counter +1 besar).
   - Asisten Stopwatch skipping (Mulai/Stop, otomatis mengisi detik).
   - Form pencarian siswa dan input cepat.
   - Papan Rekor Dojo (*Leaderboard*): *Iron Core*, *Speed Striker*, *Skipping King/Queen*, *Rubber Master*.
2. **Detail Siswa (`src/app/owner/students/[id]/page.tsx`):**
   - Tab baru "Kemampuan Fisik": Radar 6 dimensi, badge grade, status kelayakan ujian, grafik tren, dan riwayat tes.
3. **Portal Orang Tua (`src/app/ortu/page.tsx`):**
   - Kartu "Rapor Kebugaran & Fisik Ananda" dengan grafik radar, predikat, panduan latihan di rumah, dan opsi cetak.

---

## 5. Rencana Pengujian & Verifikasi
1. **Verifikasi Database & RLS:** Uji insert, update, dan proteksi akses antar role.
2. **Verifikasi Logika Kalkulasi:** Unit test formula split inversi, pembagian kelompok umur, normalisasi pilar, dan status ujian ganda.
3. **Verifikasi Audio Timer & Stopwatch:** Uji fungsi timer 30 detik pada perangkat mobile/desktop tanpa latency.
4. **Verifikasi Visualisasi SVG:** Uji responsivitas radar chart pada layar mobile dan desktop.
