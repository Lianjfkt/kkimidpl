# Spec: Executive Physical Intelligence & Monitoring Dashboard for Dojo Owner

**Tanggal:** 2026-11-22  
**Status:** Approved by User  
**Tujuan:** Memisahkan UI/UX fitur tes fisik antara Pelatih (eksekutor tes di matras dengan timer & stopwatch) dan Owner (pengambil kebijakan dengan analitik kebugaran dojo, kesiapan ujian sabuk, pemetaan atlet, dan audit pelatih).

---

## 1. Latar Belakang & Diferensiasi Peran

### 1.1 Masalah Sebelumnya
Sebelumnya rute menu fisik untuk Owner mengarah atau menampilkan antarmuka yang sama persis dengan Pelatih (`/pelatih/physical-tests`), yang dilengkapi alat bantu matras (stopwatch skipping, tap counter, countdown 30 detik dengan audio buzzer). Bagi seorang Owner (Ketua/Pengurus Dojo), alat-alat tersebut tidak relevan karena Owner tidak bertugas mencatat push-up di tepi tatami.

### 1.2 Pemisahan Peran yang Jelas
- **Pelatih (`/pelatih/physical-tests`):** Asisten matras taktis (*On-the-mat Assistant*) untuk mencatat repetisi, mengukur waktu split/skipping, dan menyimpan tes baru per siswa.
- **Owner (`/owner/physical-tests`):** Dashboard analitik eksekutif (*Executive Physical Intelligence & Audit*) untuk memantau performa dojo, memvalidasi kelayakan ujian kenaikan sabuk, menyaring atlet unggul untuk turnamen, dan mengaudit catatan tes yang diinput pelatih.

---

## 2. Arsitektur & Komponen Halaman Owner

Halaman `src/app/owner/physical-tests/page.tsx` akan terdiri dari 4 bagian utama:

### 2.1 Kartu Ringkasan Eksekutif (Executive KPI Header)
1. **Rata-rata Skor Kebugaran Dojo (Overall Fitness Score):**
   - Nilai rata-rata dari seluruh siswa yang telah diuji (contoh: `74.8 / 100` - Grade B).
   - Perbandingan dengan target dojo.
2. **Kesiapan Ujian Kenaikan Sabuk (Exam Readiness Index):**
   - Menghitung siswa yang memenuhi syarat kelayakan fisik (target skor sabuk) + kehadiran ($\ge 75\%$).
   - Menampilkan perbandingan: `24 Siswa Siap Ujian / 38 Total Diuji`.
3. **Cakupan Pengujian Bulan Ini:**
   - Jumlah siswa aktif yang sudah menjalani tes fisik berkala.
4. **Distribusi Grade Siswa:**
   - Visualisasi persentase Grade S (Elite), Grade A (Mahir), Grade B (Standar), Grade C & D (Butuh Pembinaan).

---

### 2.2 Tiga Tab Tampilan Utama (View Tabs)

#### Tab 1: Kesiapan Ujian & Pembinaan (Belt Exam & Conditioning)
- **Tabel Siswa Siap Ujian Sabuk:** Menampilkan siswa yang telah melewati ambang batas fisik untuk kyu mereka, siap direkomendasikan masuk gelombang ujian sabuk berikutnya.
- **Tabel Butuh Pembinaan Khusus (Needs Attention):** Siswa dengan skor fisik di bawah standar sabuk atau kehadiran rendah, lengkap dengan indikator fisik yang paling lemah (misal: "Daya Tahan Kardio Rendah" atau "Kelenturan Terbatas") sehingga Owner dapat mengarahkan pelatih untuk memfokuskan porsi latihan.

#### Tab 2: Papan Rekor Dojo & Pemetaan Atlet (Dojo Leaderboards)
- Papan peringkat dojo untuk scouting atlet turnamen:
  - **Overall Top Performers:** Atlet dengan akumulasi poin fisik tertinggi.
  - **Speed & Striking:** Atlet dengan frekuensi pukulan & tendangan tercepat (kandidat Kumite).
  - **Stamina & Footwork:** Rekor skipping terlama (daya tahan kardiovaskular).
  - **Flexibility:** Split terendah (kandidat Kata & fleksibilitas teknik).
  - **Core Strength:** Repetisi sit-up & push-up tertinggi.

#### Tab 3: Log Audit Tes Fisik oleh Pelatih (Audit & Verification Log)
- Rekapitulasi seluruh sesi tes yang tersimpan di Supabase:
  - Tanggal Tes
  - Nama Siswa & Sabuk
  - Pelatih Penguji (`tester_id` / nama pelatih)
  - Skor Total & Grade
  - Status Kelayakan Ujian
  - Tombol **"Lihat Detail Rapor"**
- Dilengkapi filter pencarian siswa, filter sabuk, dan tombol **"Cetak / Ekspor Rekap Fisik"**.

---

### 2.3 Modal Inspeksi Atlet (Read-Only Athlete Radar & Timeline)
Ketika Owner mengklik nama atlet pada leaderboard atau tabel audit:
- Muncul modal popup elegan menampilkan:
  - Identitas Siswa & Foto/Inisial
  - **Radar Chart 6 Dimensi** (Upper Body, Core, Speed, Cardio, Flexibility, Discipline) menggunakan komponen visual SVG yang sudah ada (`PhysicalRadarChart`).
  - **Grafik Tren Perkembangan Fisik** (`PhysicalProgressChart`).
  - Analisis kelayakan ujian sabuk dan rekomendasi latihan.
- Tidak ada form input atau tombol audio timer yang membingungkan.

---

## 3. Navigasi & Routing
- Navbar Desktop & Mobile untuk role `owner` di `src/components/Navigation.tsx`:
  - Mengarahkan menu **"Tes Fisik"** ke `/owner/physical-tests`.
- Middleware `src/proxy.ts`:
  - Memastikan rute `/owner/physical-tests` dilindungi oleh session `owner`.
